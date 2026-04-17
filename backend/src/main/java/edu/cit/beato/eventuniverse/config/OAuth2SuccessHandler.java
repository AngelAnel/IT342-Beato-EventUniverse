package edu.cit.beato.eventuniverse.config;

import edu.cit.beato.eventuniverse.model.User;
import edu.cit.beato.eventuniverse.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public OAuth2SuccessHandler(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");

        if (firstName == null) firstName = oAuth2User.getAttribute("name");
        if (firstName == null) firstName = "User";
        if (lastName == null) lastName = "";

        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            Optional<User> recheckUser = userRepository.findByEmail(email);
            if (recheckUser.isPresent()) {
                user = recheckUser.get();
            } else {
                user = new User();
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setEmail(email);
                user.setPassword("GOOGLE_OAUTH_USER");
                user.setDepartment("Not Specified");
                user.setRole("Participant");
                userRepository.save(user);
            }
        }

        String role = "Participant";
        String token = jwtUtil.generateToken(user.getEmail(), role);

        String redirectUrl = frontendUrl + "/oauth2/callback"
                + "?token=" + encode(token)
                + "&firstName=" + encode(user.getFirstName())
                + "&lastName=" + encode(user.getLastName())
                + "&email=" + encode(user.getEmail())
                + "&role=" + encode(role)
                + "&department=" + encode(user.getDepartment())
                + "&id=" + (user.getId() != null ? user.getId().toString() : "");

// ADD THIS LINE:
        System.out.println(">>> REDIRECTING TO: " + redirectUrl);

        response.sendRedirect(redirectUrl);
    }

    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value != null ? value : "", "UTF-8");
        } catch (Exception e) {
            return "";
        }
    }
}