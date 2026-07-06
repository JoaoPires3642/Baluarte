package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.shared.auth.AdminAuthFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Endpoint administrativo para testar a conectividade SMTP.
 * POST /api/v1/admin/email/test
 *
 * Exige header de admin (AdminAuthFilter). Envia um email de teste
 * para verificar se a configuracao SMTP do Stalwart Mail esta funcionando.
 */
@RestController
@RequestMapping("/api/v1/admin/email")
@ConditionalOnProperty("spring.mail.host")
public class EmailTestController {

    private static final Logger log = LoggerFactory.getLogger(EmailTestController.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.from:Baluarte <contato@dombaluarte.com.br>}")
    private String from;

    public EmailTestController(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostMapping("/test")
    public Map<String, Object> testEmail(
        @RequestHeader(AdminAuthFilter.USER_ID_HEADER) String userId,
        @RequestHeader(AdminAuthFilter.USER_EMAIL_HEADER) String userEmail
    ) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(userEmail);
            msg.setSubject("[Baluarte] Teste de envio de email - Stalwart Mail");
            msg.setText("""
                Teste de conectividade SMTP do Baluarte.

                Se voce esta recebendo este email, a configuracao do
                Stalwart Mail esta funcionando corretamente.

                Destinatario: %s
                Remetente: %s
                Servidor SMTP: %s
                """.formatted(userEmail, from, mailSender));

            mailSender.send(msg);

            log.info("email.test event=sent to={} from={}", userEmail, from);
            return Map.of("status", "sent", "to", userEmail, "from", from);
        } catch (Exception e) {
            log.error("email.test event=failed to={} reason={}", userEmail, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Falha ao enviar email: " + e.getMessage());
        }
    }
}
