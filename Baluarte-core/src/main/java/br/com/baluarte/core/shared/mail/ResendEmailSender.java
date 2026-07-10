package br.com.baluarte.core.shared.mail;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty("app.email.resend.api-key")
public class ResendEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailSender.class);
    private static final String RESEND_API = "https://api.resend.com/emails";

    private final HttpClient http = HttpClient.newHttpClient();

    @Value("${app.email.resend.api-key}")
    private String apiKey;

    @Value("${app.email.from:Baluarte <contato@dombaluarte.com.br>}")
    private String from;

    @Override
    public void sendHtml(String to, String subject, String htmlBody) {
        String body = """
            {"from":"%s","to":["%s"],"subject":"%s","html":"%s"}
            """.formatted(escape(from), escape(to), escape(subject), escape(htmlBody));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESEND_API))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("email.resend event=sent to={} subject={}", to, subject);
            } else {
                throw new RuntimeException("Resend API error: " + response.statusCode() + " " + response.body());
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("email.resend event=failed to={} subject={} reason={}", to, subject, e.getMessage());
            throw new RuntimeException("Falha ao enviar email via Resend", e);
        }
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }
}
