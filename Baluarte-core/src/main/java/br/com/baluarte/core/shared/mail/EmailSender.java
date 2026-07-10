package br.com.baluarte.core.shared.mail;

/**
 * Contrato generico para envio de emails transacionais.
 * Implementacao unica: FallbackEmailSender (tenta SMTP, fallback Resend).
 */
public interface EmailSender {

    void sendHtml(String to, String subject, String htmlBody);
}
