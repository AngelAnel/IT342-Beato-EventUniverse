package edu.cit.beato.eventuniverse.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(name = "venue", nullable = false)
    private String venue;

    @Column(name = "event_date_time", nullable = false)
    private LocalDateTime eventDateTime;

    // Departments stored as comma-separated string
    @Column(name = "departments", columnDefinition = "TEXT")
    private String departments;

    // Picture stored as Base64 string
    @Column(name = "picture", columnDefinition = "TEXT")
    private String picture;

    // Additional Info
    @Column(name = "attachment_enabled")
    private boolean attachmentEnabled;

    @Column(name = "attachment_instructions", columnDefinition = "TEXT")
    private String attachmentInstructions;

    @Column(name = "max_participants_enabled")
    private boolean maxParticipantsEnabled;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    // Payment Details
    @Column(name = "categories_enabled")
    private boolean categoriesEnabled;

    // Categories stored as JSON string
    @Column(name = "categories", columnDefinition = "TEXT")
    private String categories;

    // Payment Methods
    @Column(name = "gcash_enabled")
    private boolean gcashEnabled;

    // GCash QR images stored as JSON array of Base64 strings
    @Column(name = "gcash_qrs", columnDefinition = "TEXT")
    private String gcashQRs;

    @Column(name = "onsite_enabled")
    private boolean onsiteEnabled;

    @Column(name = "onsite_personnel")
    private String onsitePersonnel;

    @Column(name = "onsite_location")
    private String onsiteLocation;

    @Column(name = "onsite_start")
    private LocalDateTime onsiteStart;

    @Column(name = "onsite_end")
    private LocalDateTime onsiteEnd;

    // Organizer relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_archived")
    private boolean archived;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.archived = false;
    }

    // Getters
    public UUID getId() { return id; }
    public String getEventName() { return eventName; }
    public String getVenue() { return venue; }
    public LocalDateTime getEventDateTime() { return eventDateTime; }
    public String getDepartments() { return departments; }
    public String getPicture() { return picture; }
    public boolean isAttachmentEnabled() { return attachmentEnabled; }
    public String getAttachmentInstructions() { return attachmentInstructions; }
    public boolean isMaxParticipantsEnabled() { return maxParticipantsEnabled; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public boolean isCategoriesEnabled() { return categoriesEnabled; }
    public String getCategories() { return categories; }
    public boolean isGcashEnabled() { return gcashEnabled; }
    public String getGcashQRs() { return gcashQRs; }
    public boolean isOnsiteEnabled() { return onsiteEnabled; }
    public String getOnsitePersonnel() { return onsitePersonnel; }
    public String getOnsiteLocation() { return onsiteLocation; }
    public LocalDateTime getOnsiteStart() { return onsiteStart; }
    public LocalDateTime getOnsiteEnd() { return onsiteEnd; }
    public User getOrganizer() { return organizer; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isArchived() { return archived; }

    // Setters
    public void setId(UUID id) { this.id = id; }
    public void setEventName(String eventName) { this.eventName = eventName; }
    public void setVenue(String venue) { this.venue = venue; }
    public void setEventDateTime(LocalDateTime eventDateTime) { this.eventDateTime = eventDateTime; }
    public void setDepartments(String departments) { this.departments = departments; }
    public void setPicture(String picture) { this.picture = picture; }
    public void setAttachmentEnabled(boolean attachmentEnabled) { this.attachmentEnabled = attachmentEnabled; }
    public void setAttachmentInstructions(String attachmentInstructions) { this.attachmentInstructions = attachmentInstructions; }
    public void setMaxParticipantsEnabled(boolean maxParticipantsEnabled) { this.maxParticipantsEnabled = maxParticipantsEnabled; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    public void setCategoriesEnabled(boolean categoriesEnabled) { this.categoriesEnabled = categoriesEnabled; }
    public void setCategories(String categories) { this.categories = categories; }
    public void setGcashEnabled(boolean gcashEnabled) { this.gcashEnabled = gcashEnabled; }
    public void setGcashQRs(String gcashQRs) { this.gcashQRs = gcashQRs; }
    public void setOnsiteEnabled(boolean onsiteEnabled) { this.onsiteEnabled = onsiteEnabled; }
    public void setOnsitePersonnel(String onsitePersonnel) { this.onsitePersonnel = onsitePersonnel; }
    public void setOnsiteLocation(String onsiteLocation) { this.onsiteLocation = onsiteLocation; }
    public void setOnsiteStart(LocalDateTime onsiteStart) { this.onsiteStart = onsiteStart; }
    public void setOnsiteEnd(LocalDateTime onsiteEnd) { this.onsiteEnd = onsiteEnd; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setArchived(boolean archived) { this.archived = archived; }
}
