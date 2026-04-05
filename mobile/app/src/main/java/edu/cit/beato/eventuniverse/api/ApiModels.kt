package edu.cit.beato.eventuniverse.api

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