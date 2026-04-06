package edu.cit.beato.eventuniverse.controller;

import edu.cit.beato.eventuniverse.config.JwtUtil;
import edu.cit.beato.eventuniverse.dto.LoginRequest;
import edu.cit.beato.eventuniverse.dto.RegisterRequest;
import edu.cit.beato.eventuniverse.model.User;
import edu.cit.beato.eventuniverse.repository.UserRepository;
import edu.cit.beato.eventuniverse.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, JwtUtil jwtUtil, UserRepository userRepository) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        Map<String, Object> result = authService.register(request);
        int status = (boolean) result.get("success") ? 201 : 400;
        return ResponseEntity.status(status).body(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> result = authService.login(request);
        int status = (boolean) result.get("success") ? 200 : 401;
        return ResponseEntity.status(status).body(result);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            String token = authHeader.replace("Bearer ", "");

            if (!jwtUtil.isTokenValid(token)) {
                response.put("success", false);
                response.put("message", "Invalid or expired token");
                return ResponseEntity.status(401).body(response);
            }

            String email = jwtUtil.extractEmail(token);
            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(404).body(response);
            }

            response.put("success", true);
            response.put("data", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "role", user.getRole(),
                    "department", user.getDepartment()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Something went wrong");
            return ResponseEntity.status(500).body(response);
        }
    }
}