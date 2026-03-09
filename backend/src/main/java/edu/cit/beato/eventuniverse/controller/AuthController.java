package edu.cit.beato.eventuniverse.controller;

import edu.cit.beato.eventuniverse.dto.LoginRequest;
import edu.cit.beato.eventuniverse.dto.RegisterRequest;
import edu.cit.beato.eventuniverse.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
}