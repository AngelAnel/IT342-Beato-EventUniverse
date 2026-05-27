package edu.cit.beato.eventuniverse.api

import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    // Events
    @GET("events/participant")
    suspend fun getParticipantEvents(
        @Header("Authorization") token: String
    ): Response<EventResponse>

    // Slot counts
    @GET("registrations/event/{eventId}/slot-counts")
    suspend fun getSlotCounts(
        @Header("Authorization") token: String,
        @Path("eventId") eventId: String
    ): Response<SlotCountResponse>

    // Register for event
    @POST("registrations")
    suspend fun registerForEvent(
        @Header("Authorization") token: String,
        @Body request: RegistrationRequest
    ): Response<RegistrationResponse>

    // My confirmed registrations
    @GET("registrations/my/confirmed")
    suspend fun getMyConfirmedRegistrations(
        @Header("Authorization") token: String
    ): Response<MyRegistrationsResponse>

    // My archived registrations
    @GET("registrations/my/archived")
    suspend fun getMyArchivedRegistrations(
        @Header("Authorization") token: String
    ): Response<MyRegistrationsResponse>

    // Notifications
    @GET("notifications")
    suspend fun getNotifications(
        @Header("Authorization") token: String
    ): Response<NotificationResponse>

    @PUT("notifications/mark-read")
    suspend fun markNotificationsRead(
        @Header("Authorization") token: String
    ): Response<Void>

    @GET("auth/me")
    suspend fun getMe(
        @Header("Authorization") token: String
    ): Response<MeResponse>

    @PUT("auth/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body updates: Map<String, String>
    ): Response<MeResponse>

    @PUT("auth/change-password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: Map<String, String>
    ): Response<MeResponse>
}