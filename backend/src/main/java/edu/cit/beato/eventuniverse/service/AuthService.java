package edu.cit.beato.eventuniverse.service;
import edu.cit.beato.eventuniverse.config.JwtUtil;
import edu.cit.beato.eventuniverse.dto.LoginRequest;
import edu.cit.beato.eventuniverse.dto.RegisterRequest;
import edu.cit.beato.eventuniverse.model.User;
import edu.cit.beato.eventuniverse.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public Map<String, Object> register(RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            response.put("success", false);
            response.put("message", "Passwords do not match");
            return response;
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            response.put("success", false);
            response.put("message", "Email is already registered");
            return response;
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .department(request.getDepartment())
                .role(request.getRole())
                .build();

        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Registration successful");
        return response;
    }

    public Map<String, Object> login(LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return response;
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        Map<String, Object> data = new HashMap<>();
        data.put("accessToken", token);
        data.put("user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "role", user.getRole(),
                "department", user.getDepartment()
        ));

        response.put("success", true);
        response.put("message", "Login successful");
        response.put("data", data);
        return response;
    }
}