package edu.cit.beato.eventuniverse.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendRegistrationConfirmation(
            String toEmail,
            String participantName,
            String eventName,
            String organizerName,
            String eventDateTime,
            String eventVenue,
            String categoryName,
            String categoryPrice,
            String paymentMethod,
            String registrationTime
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("aa28beato@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject("Registration Confirmed — " + eventName);

            String html = "<div style='font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f5f0e8;'>"
                    + "<div style='background-color: #6b1a1a; padding: 24px; border-radius: 12px;'>"
                    + "<h1 style='color: #f5f0e8; font-size: 24px; margin: 0 0 8px 0;'>Registration Confirmed! 🎉</h1>"
                    + "<p style='color: rgba(245,240,232,0.8); font-size: 14px; margin: 0;'>Your registration has been confirmed by the organizer.</p>"
                    + "</div>"
                    + "<div style='background-color: #fff; padding: 24px; border-radius: 12px; margin-top: 16px;'>"
                    + "<h2 style='color: #6b1a1a; font-size: 20px; margin: 0 0 16px 0;'>" + eventName + "</h2>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Organized by:</strong> " + organizerName + "</p>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Date &amp; Time:</strong> " + eventDateTime + "</p>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Venue:</strong> " + eventVenue + "</p>"
                    + "<hr style='border: 1px solid #f5f0e8; margin: 16px 0;'/>"
                    + "<h3 style='color: #6b1a1a; margin: 0 0 8px 0;'>Your Registration Details</h3>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Name:</strong> " + participantName + "</p>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Category:</strong> " + categoryName + "</p>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Amount:</strong> " + (categoryPrice.equals("0") ? "Free" : "P " + categoryPrice) + "</p>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Pax:</strong> 1</p>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Payment Method:</strong> " + paymentMethod + "</p>"
                    + "<p style='color: #3d2b2b; margin: 4px 0;'><strong>Registered at:</strong> " + registrationTime + "</p>"
                    + "</div>"
                    + "<p style='color: #b0a090; font-size: 12px; text-align: center; margin-top: 16px;'>This is an automated message from Event Universe. Please do not reply.</p>"
                    + "</div>";

            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("Email sent to: " + toEmail);

        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }
}
