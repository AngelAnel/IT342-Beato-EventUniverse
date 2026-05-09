package edu.cit.beato.eventuniverse.repository;

import edu.cit.beato.eventuniverse.model.Notification;
import edu.cit.beato.eventuniverse.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadFalse(User user);
}
