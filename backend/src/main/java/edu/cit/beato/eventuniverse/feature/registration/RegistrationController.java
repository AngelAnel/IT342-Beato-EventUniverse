package edu.cit.beato.eventuniverse.feature.registration;

import edu.cit.beato.eventuniverse.feature.auth.JwtUtil;
import edu.cit.beato.eventuniverse.feature.event.Event;
import edu.cit.beato.eventuniverse.feature.auth.User;
import edu.cit.beato.eventuniverse.feature.event.EventRepository;
import edu.cit.beato.eventuniverse.feature.auth.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import edu.cit.beato.eventuniverse.feature.notification.Notification;
import edu.cit.beato.eventuniverse.feature.notification.NotificationRepository;
import edu.cit.beato.eventuniverse.shared.EmailService;
import java.util.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/registrations")
public class RegistrationController {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public RegistrationController(RegistrationRepository registrationRepository,
                                  EventRepository eventRepository,
                                  UserRepository userRepository,
                                  JwtUtil jwtUtil,
                                  NotificationRepository notificationRepository,
                                  EmailService emailService) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;

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
            // Create notification for organizer
            Notification organizerNotif = new Notification();
            organizerNotif.setUser(event.getOrganizer());
            organizerNotif.setTitle(event.getEventName());
            organizerNotif.setMessage(
                    participant.getFirstName() + " " + participant.getLastName() +
                            " registered for your event " + event.getEventName()
            );
            organizerNotif.setEventId(event.getId());
            notificationRepository.save(organizerNotif);

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

    // GET /api/v1/registrations/event/{eventId} — get all registrations for an event (organizer)
    @GetMapping("/event/{eventId}")
    public ResponseEntity<Map<String, Object>> getEventRegistrations(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID eventId) {

        Map<String, Object> response = new HashMap<>();
        try {
            User organizer = getUserFromToken(authHeader);
            if (organizer == null) {
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
            List<Map<String, Object>> list = new ArrayList<>();

            for (Registration reg : registrations) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", reg.getId());
                map.put("participantId", reg.getParticipant().getId());
                map.put("participantName", reg.getParticipant().getFirstName() + " " + reg.getParticipant().getLastName());
                map.put("participantEmail", reg.getParticipant().getEmail());
                map.put("categoryName", reg.getCategoryName());
                map.put("categoryPrice", reg.getCategoryPrice());
                map.put("paymentMethod", reg.getPaymentMethod());
                map.put("status", reg.getStatus());
                map.put("createdAt", reg.getCreatedAt());
                map.put("proofOfPayment", reg.getProofOfPayment());
                map.put("links", reg.getLinks());
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

    // PUT /api/v1/registrations/{id}/confirm — confirm a registration
    @PutMapping("/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmRegistration(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id) {

        Map<String, Object> response = new HashMap<>();
        try {
            User organizer = getUserFromToken(authHeader);
            if (organizer == null) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }

            Registration registration = registrationRepository.findById(id).orElse(null);
            if (registration == null) {
                response.put("success", false);
                response.put("message", "Registration not found");
                return ResponseEntity.status(404).body(response);
            }

            // Update status
            registration.setStatus("Confirmed");
            registrationRepository.save(registration);

            // Create notification
            Notification notification = new Notification();
            notification.setUser(registration.getParticipant());
            notification.setTitle(registration.getEvent().getEventName());
            notification.setMessage(organizer.getFirstName() + " have confirmed your registration!");
            notification.setEventId(registration.getEvent().getId());
            notificationRepository.save(notification);


            // Send email
            String participantName = registration.getParticipant().getFirstName()
                    + " " + registration.getParticipant().getLastName();
            String eventDateTime = registration.getEvent().getEventDateTime().toString();
            String registrationTime = registration.getCreatedAt().toString();

            emailService.sendRegistrationConfirmation(
                    registration.getParticipant().getEmail(),
                    participantName,
                    registration.getEvent().getEventName(),
                    organizer.getFirstName(),
                    eventDateTime,
                    registration.getEvent().getVenue(),
                    registration.getCategoryName(),
                    registration.getCategoryPrice(),
                    registration.getPaymentMethod(),
                    registrationTime
            );

            response.put("success", true);
            response.put("message", "Registration confirmed");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // GET /api/v1/registrations/my/confirmed — get confirmed registrations for participant
    @GetMapping("/my/confirmed")
    public ResponseEntity<Map<String, Object>> getMyConfirmedRegistrations(
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
                if (!"Confirmed".equals(reg.getStatus())) continue;
                Map<String, Object> map = new HashMap<>();
                map.put("id", reg.getId());
                map.put("eventId", reg.getEvent().getId());
                map.put("eventName", reg.getEvent().getEventName());
                map.put("eventDateTime", reg.getEvent().getEventDateTime());
                map.put("venue", reg.getEvent().getVenue());
                map.put("picture", reg.getEvent().getPicture());
                map.put("departments", reg.getEvent().getDepartments());
                map.put("categoriesEnabled", reg.getEvent().isCategoriesEnabled());
                map.put("categories", reg.getEvent().getCategories());
                map.put("gcashEnabled", reg.getEvent().isGcashEnabled());
                map.put("onsiteEnabled", reg.getEvent().isOnsiteEnabled());
                map.put("organizerName", reg.getEvent().getOrganizer().getFirstName());
                map.put("status", reg.getStatus());
                map.put("categoryName", reg.getCategoryName());
                map.put("categoryPrice", reg.getCategoryPrice());
                map.put("paymentMethod", reg.getPaymentMethod());
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

    // GET /api/v1/registrations/my/archived — confirmed registrations where event is past
    @GetMapping("/my/archived")
    public ResponseEntity<Map<String, Object>> getMyArchivedRegistrations(
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
                if (!"Confirmed".equals(reg.getStatus())) continue;
                if (reg.getEvent().getEventDateTime().isAfter(LocalDateTime.now())) continue;

                Map<String, Object> map = new HashMap<>();
                map.put("id", reg.getId());
                map.put("eventId", reg.getEvent().getId());
                map.put("eventName", reg.getEvent().getEventName());
                map.put("eventDateTime", reg.getEvent().getEventDateTime());
                map.put("venue", reg.getEvent().getVenue());
                map.put("picture", reg.getEvent().getPicture());
                map.put("departments", reg.getEvent().getDepartments());
                map.put("categoriesEnabled", reg.getEvent().isCategoriesEnabled());
                map.put("categories", reg.getEvent().getCategories());
                map.put("gcashEnabled", reg.getEvent().isGcashEnabled());
                map.put("onsiteEnabled", reg.getEvent().isOnsiteEnabled());
                map.put("organizerName", reg.getEvent().getOrganizer().getFirstName());
                map.put("status", "CLOSED");
                map.put("categoryName", reg.getCategoryName());
                map.put("categoryPrice", reg.getCategoryPrice());
                map.put("paymentMethod", reg.getPaymentMethod());
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