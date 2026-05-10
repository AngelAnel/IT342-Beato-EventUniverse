package edu.cit.beato.eventuniverse.feature.event;

import edu.cit.beato.eventuniverse.feature.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByOrganizerAndArchivedFalse(User organizer);
    List<Event> findByOrganizerAndArchivedTrue(User organizer);
    List<Event> findByArchivedFalse();
}