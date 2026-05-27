package edu.cit.beato.eventuniverse.api
import com.google.gson.annotations.SerializedName
data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val confirmPassword: String,
    val department: String,
    val role: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val success: Boolean,
    val message: String?,
    val data: AuthData?
)

data class AuthData(
    val accessToken: String?,
    val user: UserData?
)

data class UserData(
    val id: String?,
    val email: String?,
    val firstName: String?,
    val lastName: String?,
    val role: String?,
    val department: String?
)

// Events
data class EventResponse(
    val success: Boolean,
    val data: List<EventData>?
)

data class EventData(
    val id: String,
    val eventName: String,
    val venue: String,
    val eventDateTime: String,
    val departments: String?,
    val picture: String?,
    val categoriesEnabled: Boolean,
    val categories: String?,
    val gcashEnabled: Boolean,
    val onsiteEnabled: Boolean,
    val maxParticipantsEnabled: Boolean,
    val maxParticipants: Int?,
    val attachmentEnabled: Boolean,
    val attachmentInstructions: String?,
    @SerializedName("gcashQRs")
    val gcashQrs: String?,
    val onsitePersonnel: String?,
    val onsiteLocation: String?,
    val onsiteStart: String?,
    val onsiteEnd: String?,
    val organizerName: String?
)

// Slot counts
data class SlotCountResponse(
    val success: Boolean,
    val data: SlotCountData?
)

data class SlotCountData(
    val counts: Map<String, Int>,
    val alreadyRegistered: Boolean,
    val myRegistration: MyRegistrationData?
)

data class MyRegistrationData(
    val categoryName: String?,
    val status: String?
)

// Registration
data class RegistrationRequest(
    val eventId: String,
    val categoryName: String?,
    val categoryPrice: String?,
    val paymentMethod: String?,
    val proofOfPayment: String?,
    val links: String?
)

data class RegistrationResponse(
    val success: Boolean,
    val message: String?,
    val data: RegistrationData?
)

data class RegistrationData(
    val id: String,
    val status: String,
    val categoryName: String?,
    val categoryPrice: String?,
    val paymentMethod: String?,
    val createdAt: String?
)

// My confirmed registrations
data class MyRegistrationsResponse(
    val success: Boolean,
    val data: List<MyEventData>?
)

data class MyEventData(
    val id: String,
    val eventId: String,
    val eventName: String,
    val eventDateTime: String,
    val venue: String,
    val picture: String?,
    val departments: String?,
    val categoriesEnabled: Boolean,
    val categories: String?,
    val gcashEnabled: Boolean,
    val onsiteEnabled: Boolean,
    val organizerName: String?,
    val status: String,
    val categoryName: String?,
    val categoryPrice: String?,
    val paymentMethod: String?
)

// Notifications
data class NotificationResponse(
    val success: Boolean,
    val data: List<NotificationData>?
)

data class NotificationData(
    val id: String,
    val title: String,
    val message: String,
    val eventId: String?,
    val isRead: Boolean,
    val createdAt: String?
)

data class MeResponse(
    val success: Boolean,
    val message: String?,
    val data: MeData?
)

data class MeData(
    val user: UserData?
)