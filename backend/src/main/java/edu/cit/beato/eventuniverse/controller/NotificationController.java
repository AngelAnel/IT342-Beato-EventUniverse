package edu.cit.beato.eventuniverse.controller;

import edu.cit.beato.eventuniverse.config.JwtUtil;
import edu.cit.beato.eventuniverse.model.Notification;
import edu.cit.beato.eventuniverse.model.User;
import edu.cit.beato.eventuniverse.repository.NotificationRepository;
import edu.cit.beato.eventuniverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public NotificationController(NotificationRepository notificationRepository,
                                  UserRepository userRepository,
                                  JwtUtil jwtUtil) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    private User getUserFromToken(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.isTokenValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @RequestHeader("Authorization") String authHeader) {

        Map<String, Object> response = new HashMap<>();
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
            long unreadCount = notificationRepository.countByUserAndReadFalse(user);

            List<Map<String, Object>> list = new ArrayList<>();
            for (Notification n : notifications) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", n.getId());
                map.put("title", n.getTitle());
                map.put("message", n.getMessage());
                map.put("read", n.isRead());
                map.put("createdAt", n.getCreatedAt());
                map.put("eventId", n.getEventId());
                list.add(map);
            }

            response.put("success", true);
            response.put("data", list);
            response.put("unreadCount", unreadCount);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong");
            return ResponseEntity.status(500).body(response);
        }
    }

    @PutMapping("/mark-read")
    public ResponseEntity<Map<String, Object>> markAllRead(
            @RequestHeader("Authorization") String authHeader) {

        Map<String, Object> response = new HashMap<>();
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
            for (Notification n : notifications) {
                if (!n.isRead()) {
                    n.setRead(true);
                    notificationRepository.save(n);
                }
            }

            response.put("success", true);
            response.put("message", "All notifications marked as read");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong");
            return ResponseEntity.status(500).body(response);
        }
    }
}
