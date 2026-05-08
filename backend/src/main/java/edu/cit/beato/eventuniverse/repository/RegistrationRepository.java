package edu.cit.beato.eventuniverse.repository;

import edu.cit.beato.eventuniverse.model.Event;
import edu.cit.beato.eventuniverse.model.Registration;
import edu.cit.beato.eventuniverse.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationRepository extends JpaRepository<Registration, UUID> {
    List<Registration> findByEvent(Event event);
    Optional<Registration> findByParticipantAndEvent(User participant, Event event);
    List<Registration> findByParticipant(User participant);
}
