package br.com.baluarte.core.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@ConditionalOnBean(EmailSender.class)
public class PasswordResetEmailController {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetEmailController.class);

    private static final String RESET_URL_BASE = "https://dombaluarte.com.br/redefinir-senha?token=";

    private final EmailSender emailSender;

    public PasswordResetEmailController(@Autowired EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @PostMapping("/send-password-reset")
    public Map<String, String> sendPasswordReset(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String changePasswordId = body.get("changePasswordId");

        if (email == null || email.isBlank() || changePasswordId == null || changePasswordId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email e changePasswordId sao obrigatorios");
        }

        String resetLink = RESET_URL_BASE + changePasswordId;

        try {
            emailSender.sendPasswordReset(email.trim().toLowerCase(), resetLink);
            log.info("password_reset_email event=sent to={}", email);
            return Map.of("status", "sent");
        } catch (Exception e) {
            log.error("password_reset_email event=failed to={} reason={}", email, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao enviar email");
        }
    }
}
