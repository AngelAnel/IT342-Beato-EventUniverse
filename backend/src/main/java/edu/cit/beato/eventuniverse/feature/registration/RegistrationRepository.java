package edu.cit.beato.eventuniverse.feature.registration;

import edu.cit.beato.eventuniverse.feature.event.Event;
import edu.cit.beato.eventuniverse.feature.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationRepository extends JpaRepository<Registration, UUID> {
    List<Registration> findByEventAndStatus(Event event, String status);
    Optional<Registration> findByParticipantAndEvent(User participant, Event event);
    List<Registration> findByParticipant(User participant);
}
