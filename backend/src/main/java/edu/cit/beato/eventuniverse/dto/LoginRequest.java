package edu.cit.beato.eventuniverse.dto;

import jakarta.validation.constraints.*;

public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    // Getters
    public String getEmail() { return email; }
    public String getPassword() { return password; }

    // Setters
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
}