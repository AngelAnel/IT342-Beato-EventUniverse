package edu.cit.beato.eventuniverse.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "category_price")
    private String categoryPrice;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "proof_of_payment", columnDefinition = "TEXT")
    private String proofOfPayment;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.status = "Pending";
    }

    @Column(name = "links", columnDefinition = "TEXT")
    private String links;

    // Getters
    public String getLinks() { return links; }
    public UUID getId() { return id; }
    public User getParticipant() { return participant; }
    public Event getEvent() { return event; }
    public String getCategoryName() { return categoryName; }
    public String getCategoryPrice() { return categoryPrice; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getProofOfPayment() { return proofOfPayment; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setLinks(String links) { this.links = links; }
    public void setId(UUID id) { this.id = id; }
    public void setParticipant(User participant) { this.participant = participant; }
    public void setEvent(Event event) { this.event = event; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public void setCategoryPrice(String categoryPrice) { this.categoryPrice = categoryPrice; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setProofOfPayment(String proofOfPayment) { this.proofOfPayment = proofOfPayment; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
