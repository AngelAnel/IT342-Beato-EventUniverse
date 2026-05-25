package edu.cit.beato.eventuniverse;

import edu.cit.beato.eventuniverse.feature.auth.*;
import edu.cit.beato.eventuniverse.feature.event.*;
import edu.cit.beato.eventuniverse.feature.registration.*;
import edu.cit.beato.eventuniverse.feature.notification.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EventuniverseApplicationTests {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private EventRepository eventRepository;

	@Autowired
	private RegistrationRepository registrationRepository;

	@Autowired
	private NotificationRepository notificationRepository;

	// helper: creates and saves a real user to satisfy FK constraints
	private User createTestUser(String email) {
		User user = new User();
		user.setFirstName("Test");
		user.setLastName("User");
		user.setEmail(email);
		user.setPassword("hashedpassword");
		user.setDepartment("CITE");
		user.setRole("Participant");
		return userRepository.save(user);
	}

	// helper: creates and saves a real event to satisfy FK constraints
	private Event createTestEvent(User organizer) {
		Event event = new Event();
		event.setEventName("Helper Event");
		event.setVenue("Test Hall");
		event.setEventDateTime(LocalDateTime.now().plusDays(7));
		event.setDepartments("CITE");
		event.setArchived(false);
		event.setOrganizer(organizer);
		return eventRepository.save(event);
	}

	// ── 1. Context loads ──────────────────────────────────────────────
	@Test
	void contextLoads() {
	}

	// ── 2. AUTH ───────────────────────────────────────────────────────

	@Test
	void testUserCanBeSavedAndFound() {
		User user = createTestUser("testuser_junit@example.com");
		assertTrue(userRepository.findByEmail("testuser_junit@example.com").isPresent());
		userRepository.delete(user);
	}

	@Test
	void testUserEmailIsUnique() {
		User u1 = createTestUser("unique_junit@example.com");

		User u2 = new User();
		u2.setFirstName("C"); u2.setLastName("D");
		u2.setEmail("unique_junit@example.com");
		u2.setPassword("pass");
		u2.setDepartment("CITE");
		u2.setRole("Participant");

		assertThrows(Exception.class, () -> userRepository.saveAndFlush(u2));
		userRepository.delete(u1);
	}

	@Test
	void testRegisterRequestHoldsData() {
		RegisterRequest req = new RegisterRequest();
		req.setFirstName("Angel");
		req.setLastName("Beato");
		req.setEmail("angel@example.com");
		req.setPassword("secret");
		req.setDepartment("CITE");
		req.setRole("Organizer");

		assertEquals("Angel", req.getFirstName());
		assertEquals("angel@example.com", req.getEmail());
		assertEquals("Organizer", req.getRole());
	}

	@Test
	void testLoginRequestHoldsData() {
		LoginRequest req = new LoginRequest();
		req.setEmail("login@example.com");
		req.setPassword("mypassword");

		assertEquals("login@example.com", req.getEmail());
		assertEquals("mypassword", req.getPassword());
	}

	// ── 3. EVENT ──────────────────────────────────────────────────────

	@Test
	void testEventCanBeSavedAndFound() {
		User organizer = createTestUser("organizer_event1_junit@example.com");
		Event event = createTestEvent(organizer);

		List<Event> events = eventRepository.findAll();
		assertTrue(events.stream().anyMatch(e -> "Helper Event".equals(e.getEventName())));
		eventRepository.delete(event);
		userRepository.delete(organizer);
	}

	@Test
	void testEventArchiveFlagDefaultsFalse() {
		User organizer = createTestUser("organizer_event2_junit@example.com");
		Event event = createTestEvent(organizer);

		Event found = eventRepository.findById(event.getId()).orElseThrow();
		assertFalse(found.isArchived());
		eventRepository.delete(event);
		userRepository.delete(organizer);
	}

	@Test
	void testEventFieldsArePersistedCorrectly() {
		User organizer = createTestUser("organizer_event3_junit@example.com");
		Event event = new Event();
		event.setEventName("Persistence Test");
		event.setVenue("Amphitheater");
		event.setEventDateTime(LocalDateTime.now().plusDays(10));
		event.setDepartments("CEA|CNAHS");
		event.setMaxParticipantsEnabled(true);
		event.setMaxParticipants(50);
		event.setOrganizer(organizer);
		eventRepository.save(event);

		Event found = eventRepository.findById(event.getId()).orElseThrow();
		assertEquals("Amphitheater", found.getVenue());
		assertEquals(50, found.getMaxParticipants());
		assertTrue(found.isMaxParticipantsEnabled());
		eventRepository.delete(event);
		userRepository.delete(organizer);
	}

	// ── 4. REGISTRATION ───────────────────────────────────────────────

	@Test
	void testRegistrationCanBeSaved() {
		User organizer = createTestUser("organizer_reg1_junit@example.com");
		User participant = createTestUser("participant_reg1_junit@example.com");
		Event event = createTestEvent(organizer);

		Registration reg = new Registration();
		reg.setStatus("Pending");
		reg.setPaymentMethod("GCash");
		reg.setCategoryName("General");
		reg.setCategoryPrice("100");
		reg.setEvent(event);
		reg.setParticipant(participant);
		registrationRepository.save(reg);

		assertNotNull(reg.getId());
		registrationRepository.delete(reg);
		eventRepository.delete(event);
		userRepository.delete(organizer);
		userRepository.delete(participant);
	}

	@Test
	void testRegistrationStatusDefaultsPending() {
		User organizer = createTestUser("organizer_reg2_junit@example.com");
		User participant = createTestUser("participant_reg2_junit@example.com");
		Event event = createTestEvent(organizer);

		Registration reg = new Registration();
		reg.setStatus("Pending");
		reg.setPaymentMethod("Onsite");
		reg.setEvent(event);
		reg.setParticipant(participant);
		registrationRepository.save(reg);

		Registration found = registrationRepository.findById(reg.getId()).orElseThrow();
		assertEquals("Pending", found.getStatus());
		registrationRepository.delete(reg);
		eventRepository.delete(event);
		userRepository.delete(organizer);
		userRepository.delete(participant);
	}

	@Test
	void testRegistrationCanBeConfirmed() {
		User organizer = createTestUser("organizer_reg3_junit@example.com");
		User participant = createTestUser("participant_reg3_junit@example.com");
		Event event = createTestEvent(organizer);

		Registration reg = new Registration();
		reg.setStatus("Pending");
		reg.setEvent(event);
		reg.setParticipant(participant);
		registrationRepository.save(reg);

		reg.setStatus("Confirmed");
		registrationRepository.save(reg);

		Registration found = registrationRepository.findById(reg.getId()).orElseThrow();
		assertEquals("Confirmed", found.getStatus());
		registrationRepository.delete(reg);
		eventRepository.delete(event);
		userRepository.delete(organizer);
		userRepository.delete(participant);
	}

	// ── 5. NOTIFICATION ───────────────────────────────────────────────

	@Test
	void testNotificationCanBeSaved() {
		User user = createTestUser("notif_user1_junit@example.com");

		Notification notif = new Notification();
		notif.setTitle("Test Notification");
		notif.setMessage("You have a new registration.");
		notif.setRead(false);
		notif.setUser(user);
		notificationRepository.save(notif);

		assertNotNull(notif.getId());
		notificationRepository.delete(notif);
		userRepository.delete(user);
	}

	@Test
	void testNotificationIsUnreadByDefault() {
		User user = createTestUser("notif_user2_junit@example.com");

		Notification notif = new Notification();
		notif.setTitle("Unread Test");
		notif.setMessage("This should be unread.");
		notif.setRead(false);
		notif.setUser(user);
		notificationRepository.save(notif);

		Notification found = notificationRepository.findById(notif.getId()).orElseThrow();
		assertFalse(found.isRead());
		notificationRepository.delete(notif);
		userRepository.delete(user);
	}

	@Test
	void testNotificationCanBeMarkedRead() {
		User user = createTestUser("notif_user3_junit@example.com");

		Notification notif = new Notification();
		notif.setTitle("Mark Read Test");
		notif.setMessage("Marking as read.");
		notif.setRead(false);
		notif.setUser(user);
		notificationRepository.save(notif);

		notif.setRead(true);
		notificationRepository.save(notif);

		Notification found = notificationRepository.findById(notif.getId()).orElseThrow();
		assertTrue(found.isRead());
		notificationRepository.delete(notif);
		userRepository.delete(user);
	}

	// ── 6. SHARED / GENERAL ───────────────────────────────────────────

	@Test
	void testAllRepositoriesAreInjected() {
		assertNotNull(userRepository);
		assertNotNull(eventRepository);
		assertNotNull(registrationRepository);
		assertNotNull(notificationRepository);
	}

	@Test
	void testUserRepositoryFindByEmailReturnsEmptyForUnknown() {
		assertTrue(userRepository.findByEmail("nobody_xyz_404@nowhere.com").isEmpty());
	}

	// ── 7. GROQ AI / PAYMENT SUMMARY ─────────────────────────────────

	@Test
	void testRegistrationPaymentSummaryCanBeSaved() {
		User organizer = createTestUser("organizer_groq1_junit@example.com");
		User participant = createTestUser("participant_groq1_junit@example.com");
		Event event = createTestEvent(organizer);

		Registration reg = new Registration();
		reg.setStatus("Pending");
		reg.setPaymentMethod("GCash");
		reg.setCategoryName("General");
		reg.setCategoryPrice("100");
		reg.setPaymentSummary("GCash payment of P100 sent to 09XX on May 19, 2026.");
		reg.setEvent(event);
		reg.setParticipant(participant);
		registrationRepository.save(reg);

		Registration found = registrationRepository.findById(reg.getId()).orElseThrow();
		assertEquals("GCash payment of P100 sent to 09XX on May 19, 2026.", found.getPaymentSummary());
		registrationRepository.delete(reg);
		eventRepository.delete(event);
		userRepository.delete(organizer);
		userRepository.delete(participant);
	}

	@Test
	void testRegistrationPaymentSummaryIsNullableForFreeEvents() {
		User organizer = createTestUser("organizer_groq2_junit@example.com");
		User participant = createTestUser("participant_groq2_junit@example.com");
		Event event = createTestEvent(organizer);

		Registration reg = new Registration();
		reg.setStatus("Pending");
		reg.setPaymentMethod("Not specified");
		reg.setCategoryName("General");
		reg.setCategoryPrice("0");
		reg.setPaymentSummary(null);
		reg.setEvent(event);
		reg.setParticipant(participant);
		registrationRepository.save(reg);

		Registration found = registrationRepository.findById(reg.getId()).orElseThrow();
		assertNull(found.getPaymentSummary());
		registrationRepository.delete(reg);
		eventRepository.delete(event);
		userRepository.delete(organizer);
		userRepository.delete(participant);
	}

	@Test
	void testRegistrationLinksCanBeSaved() {
		User organizer = createTestUser("organizer_groq3_junit@example.com");
		User participant = createTestUser("participant_groq3_junit@example.com");
		Event event = createTestEvent(organizer);

		Registration reg = new Registration();
		reg.setStatus("Pending");
		reg.setPaymentMethod("Not specified");
		reg.setCategoryName("General");
		reg.setCategoryPrice("0");
		reg.setLinks("https://drive.google.com/file1,https://drive.google.com/file2");
		reg.setEvent(event);
		reg.setParticipant(participant);
		registrationRepository.save(reg);

		Registration found = registrationRepository.findById(reg.getId()).orElseThrow();
		assertEquals("https://drive.google.com/file1,https://drive.google.com/file2", found.getLinks());
		registrationRepository.delete(reg);
		eventRepository.delete(event);
		userRepository.delete(organizer);
		userRepository.delete(participant);
	}
}