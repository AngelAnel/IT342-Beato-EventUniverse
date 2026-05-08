package edu.cit.beato.eventuniverse.controller;

import edu.cit.beato.eventuniverse.config.JwtUtil;
import edu.cit.beato.eventuniverse.model.Event;
import edu.cit.beato.eventuniverse.model.Registration;
import edu.cit.beato.eventuniverse.model.User;
import edu.cit.beato.eventuniverse.repository.EventRepository;
import edu.cit.beato.eventuniverse.repository.RegistrationRepository;
import edu.cit.beato.eventuniverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/registrations")
public class RegistrationController {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public RegistrationController(RegistrationRepository registrationRepository,
                                  EventRepository eventRepository,
                                  UserRepository userRepository,
                                  JwtUtil jwtUtil) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    private User getUserFromToken(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.isTokenValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    // POST /api/v1/registrations — submit registration
    @PostMapping
    public ResponseEntity<Map<String, Object>> register(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {

        Map<String, Object> response = new HashMap<>();
        try {
            User participant = getUserFromToken(authHeader);
            if (participant == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            UUID eventId = UUID.fromString((String) body.get("eventId"));
            Event event = eventRepository.findById(eventId).orElse(null);
            if (event == null) {
                response.put("success", false);
                response.put("message", "Event not found");
                return ResponseEntity.status(404).body(response);
            }

            // Check if already registered
            Optional<Registration> existing = registrationRepository.findByParticipantAndEvent(participant, event);
            if (existing.isPresent()) {
                response.put("success", false);
                response.put("message", "You have already registered for this event");
                return ResponseEntity.status(400).body(response);
            }

            Registration registration = new Registration();
            registration.setParticipant(participant);
            registration.setEvent(event);
            registration.setCategoryName((String) body.get("categoryName"));
            registration.setCategoryPrice((String) body.get("categoryPrice"));
            registration.setPaymentMethod((String) body.get("paymentMethod"));
            registration.setProofOfPayment((String) body.get("proofOfPayment"));
            registration.setLinks((String) body.get("links"));

            registrationRepository.save(registration);

            response.put("success", true);
            response.put("message", "Registration submitted successfully");
            response.put("data", Map.of(
                    "id", registration.getId(),
                    "status", registration.getStatus(),
                    "categoryName", registration.getCategoryName(),
                    "categoryPrice", registration.getCategoryPrice(),
                    "paymentMethod", registration.getPaymentMethod(),
                    "createdAt", registration.getCreatedAt()
            ));
            return ResponseEntity.status(201).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // GET /api/v1/registrations/event/{eventId}/slot-counts
    // Returns how many registrants per category for an event
    @GetMapping("/event/{eventId}/slot-counts")
    public ResponseEntity<Map<String, Object>> getSlotCounts(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID eventId) {

        Map<String, Object> response = new HashMap<>();
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            Event event = eventRepository.findById(eventId).orElse(null);
            if (event == null) {
                response.put("success", false);
                response.put("message", "Event not found");
                return ResponseEntity.status(404).body(response);
            }

            List<Registration> registrations = registrationRepository.findByEvent(event);

            // Count per category
            Map<String, Integer> counts = new HashMap<>();
            for (Registration reg : registrations) {
                String cat = reg.getCategoryName();
                counts.put(cat, counts.getOrDefault(cat, 0) + 1);
            }

            // Also check if current participant already registered
            Optional<Registration> myReg = registrationRepository.findByParticipantAndEvent(user, event);

            response.put("success", true);
            response.put("data", Map.of(
                    "counts", counts,
                    "alreadyRegistered", myReg.isPresent(),
                    "myRegistration", myReg.map(r -> Map.of(
                            "categoryName", r.getCategoryName(),
                            "status", r.getStatus()
                    )).orElse(null)
            ));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // GET /api/v1/registrations/my — get participant's own registrations
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyRegistrations(
            @RequestHeader("Authorization") String authHeader) {

        Map<String, Object> response = new HashMap<>();
        try {
            User participant = getUserFromToken(authHeader);
            if (participant == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            List<Registration> registrations = registrationRepository.findByParticipant(participant);
            List<Map<String, Object>> list = new ArrayList<>();

            for (Registration reg : registrations) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", reg.getId());
                map.put("eventId", reg.getEvent().getId());
                map.put("eventName", reg.getEvent().getEventName());
                map.put("eventDateTime", reg.getEvent().getEventDateTime());
                map.put("venue", reg.getEvent().getVenue());
                map.put("picture", reg.getEvent().getPicture());
                map.put("categoryName", reg.getCategoryName());
                map.put("categoryPrice", reg.getCategoryPrice());
                map.put("paymentMethod", reg.getPaymentMethod());
                map.put("status", reg.getStatus());
                map.put("createdAt", reg.getCreatedAt());
                list.add(map);
            }

            response.put("success", true);
            response.put("data", list);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}