package edu.cit.beato.eventuniverse.controller;

import edu.cit.beato.eventuniverse.config.JwtUtil;
import edu.cit.beato.eventuniverse.model.Event;
import edu.cit.beato.eventuniverse.model.User;
import edu.cit.beato.eventuniverse.repository.EventRepository;
import edu.cit.beato.eventuniverse.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public EventController(EventRepository eventRepository, UserRepository userRepository, JwtUtil jwtUtil) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // Helper to get user from token
    private User getUserFromToken(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.isTokenValid(token)) return null;
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email).orElse(null);
    }

    // Helper to build event response map
    private Map<String, Object> buildEventMap(Event event) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", event.getId());
        map.put("eventName", event.getEventName());
        map.put("venue", event.getVenue());
        map.put("eventDateTime", event.getEventDateTime());
        map.put("departments", event.getDepartments());
        map.put("picture", event.getPicture());
        map.put("attachmentEnabled", event.isAttachmentEnabled());
        map.put("attachmentInstructions", event.getAttachmentInstructions());
        map.put("maxParticipantsEnabled", event.isMaxParticipantsEnabled());
        map.put("maxParticipants", event.getMaxParticipants());
        map.put("categoriesEnabled", event.isCategoriesEnabled());
        map.put("categories", event.getCategories());
        map.put("gcashEnabled", event.isGcashEnabled());
        map.put("gcashQRs", event.getGcashQRs());
        map.put("onsiteEnabled", event.isOnsiteEnabled());
        map.put("onsitePersonnel", event.getOnsitePersonnel());
        map.put("onsiteLocation", event.getOnsiteLocation());
        map.put("onsiteStart", event.getOnsiteStart());
        map.put("onsiteEnd", event.getOnsiteEnd());
        map.put("archived", event.isArchived());
        map.put("createdAt", event.getCreatedAt());
        // Auto compute status
        boolean isClosed = event.getEventDateTime().isBefore(LocalDateTime.now());
        map.put("status", isClosed ? "CLOSED" : "ONGOING");
        return map;
    }

    // POST /api/v1/events — create event
    @PostMapping
    public ResponseEntity<Map<String, Object>> createEvent(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {

        Map<String, Object> response = new HashMap<>();
        try {
            User organizer = getUserFromToken(authHeader);
            if (organizer == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            Event event = new Event();
            event.setEventName((String) body.get("eventName"));
            event.setVenue((String) body.get("venue"));
            event.setDepartments((String) body.get("departments"));
            event.setPicture((String) body.get("picture"));
            event.setAttachmentEnabled((boolean) body.getOrDefault("attachmentEnabled", false));
            event.setAttachmentInstructions((String) body.get("attachmentInstructions"));
            event.setMaxParticipantsEnabled((boolean) body.getOrDefault("maxParticipantsEnabled", false));
            event.setCategoriesEnabled((boolean) body.getOrDefault("categoriesEnabled", false));
            event.setCategories((String) body.get("categories"));
            event.setGcashEnabled((boolean) body.getOrDefault("gcashEnabled", false));
            event.setGcashQRs((String) body.get("gcashQRs"));
            event.setOnsiteEnabled((boolean) body.getOrDefault("onsiteEnabled", false));
            event.setOnsitePersonnel((String) body.get("onsitePersonnel"));
            event.setOnsiteLocation((String) body.get("onsiteLocation"));
            event.setOrganizer(organizer);

            // Parse datetime
            String dateTimeStr = (String) body.get("eventDateTime");
            event.setEventDateTime(LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            // Parse max participants
            Object maxP = body.get("maxParticipants");
            if (maxP != null) {
                event.setMaxParticipants(Integer.parseInt(maxP.toString()));
            }

            // Parse onsite dates
            String onsiteStartStr = (String) body.get("onsiteStart");
            String onsiteEndStr = (String) body.get("onsiteEnd");
            if (onsiteStartStr != null && !onsiteStartStr.isBlank()) {
                event.setOnsiteStart(LocalDateTime.parse(onsiteStartStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            if (onsiteEndStr != null && !onsiteEndStr.isBlank()) {
                event.setOnsiteEnd(LocalDateTime.parse(onsiteEndStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }

            eventRepository.save(event);

            response.put("success", true);
            response.put("message", "Event created successfully");
            response.put("data", buildEventMap(event));
            return ResponseEntity.status(201).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // GET /api/v1/events/my — get organizer's active events
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyEvents(
            @RequestHeader("Authorization") String authHeader) {

        Map<String, Object> response = new HashMap<>();
        try {
            User organizer = getUserFromToken(authHeader);
            if (organizer == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            List<Event> events = eventRepository.findByOrganizerAndArchivedFalse(organizer);

            // Auto-archive events that are past their date
            List<Map<String, Object>> eventList = new ArrayList<>();
            for (Event event : events) {
                if (event.getEventDateTime().isBefore(LocalDateTime.now())) {
                    event.setArchived(true);
                    eventRepository.save(event);
                } else {
                    eventList.add(buildEventMap(event));
                }
            }

            response.put("success", true);
            response.put("data", eventList);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong");
            return ResponseEntity.status(500).body(response);
        }
    }

    // GET /api/v1/events/my/archived — get organizer's archived events
    @GetMapping("/my/archived")
    public ResponseEntity<Map<String, Object>> getMyArchivedEvents(
            @RequestHeader("Authorization") String authHeader) {

        Map<String, Object> response = new HashMap<>();
        try {
            User organizer = getUserFromToken(authHeader);
            if (organizer == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            List<Event> events = eventRepository.findByOrganizerAndArchivedTrue(organizer);
            List<Map<String, Object>> eventList = new ArrayList<>();
            for (Event event : events) {
                eventList.add(buildEventMap(event));
            }

            response.put("success", true);
            response.put("data", eventList);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong");
            return ResponseEntity.status(500).body(response);
        }
    }

    // PUT /api/v1/events/{id} — edit event
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateEvent(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {

        Map<String, Object> response = new HashMap<>();
        try {
            User organizer = getUserFromToken(authHeader);
            if (organizer == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            Event event = eventRepository.findById(id).orElse(null);
            if (event == null) {
                response.put("success", false);
                response.put("message", "Event not found");
                return ResponseEntity.status(404).body(response);
            }

            if (!event.getOrganizer().getId().equals(organizer.getId())) {
                response.put("success", false);
                response.put("message", "You are not authorized to edit this event");
                return ResponseEntity.status(403).body(response);
            }

            if (body.containsKey("eventName")) event.setEventName((String) body.get("eventName"));
            if (body.containsKey("venue")) event.setVenue((String) body.get("venue"));
            if (body.containsKey("departments")) event.setDepartments((String) body.get("departments"));
            if (body.containsKey("picture")) event.setPicture((String) body.get("picture"));
            if (body.containsKey("attachmentEnabled")) event.setAttachmentEnabled((boolean) body.get("attachmentEnabled"));
            if (body.containsKey("attachmentInstructions")) event.setAttachmentInstructions((String) body.get("attachmentInstructions"));
            if (body.containsKey("maxParticipantsEnabled")) event.setMaxParticipantsEnabled((boolean) body.get("maxParticipantsEnabled"));
            if (body.containsKey("maxParticipants") && body.get("maxParticipants") != null) {
                event.setMaxParticipants(Integer.parseInt(body.get("maxParticipants").toString()));
            }
            if (body.containsKey("categoriesEnabled")) event.setCategoriesEnabled((boolean) body.get("categoriesEnabled"));
            if (body.containsKey("categories")) event.setCategories((String) body.get("categories"));
            if (body.containsKey("gcashEnabled")) event.setGcashEnabled((boolean) body.get("gcashEnabled"));
            if (body.containsKey("gcashQRs")) event.setGcashQRs((String) body.get("gcashQRs"));
            if (body.containsKey("onsiteEnabled")) event.setOnsiteEnabled((boolean) body.get("onsiteEnabled"));
            if (body.containsKey("onsitePersonnel")) event.setOnsitePersonnel((String) body.get("onsitePersonnel"));
            if (body.containsKey("onsiteLocation")) event.setOnsiteLocation((String) body.get("onsiteLocation"));

            if (body.containsKey("eventDateTime")) {
                event.setEventDateTime(LocalDateTime.parse(
                        (String) body.get("eventDateTime"), DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            if (body.containsKey("onsiteStart") && body.get("onsiteStart") != null) {
                event.setOnsiteStart(LocalDateTime.parse(
                        (String) body.get("onsiteStart"), DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            if (body.containsKey("onsiteEnd") && body.get("onsiteEnd") != null) {
                event.setOnsiteEnd(LocalDateTime.parse(
                        (String) body.get("onsiteEnd"), DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }

            eventRepository.save(event);

            response.put("success", true);
            response.put("message", "Event updated successfully");
            response.put("data", buildEventMap(event));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
