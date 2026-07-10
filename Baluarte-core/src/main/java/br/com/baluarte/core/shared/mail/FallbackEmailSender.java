package br.com.baluarte.core.shared.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnBean(SmtpEmailSender.class)
public class FallbackEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(FallbackEmailSender.class);

    private final SmtpEmailSender primary;
    private final ResendEmailSender fallback;

    public FallbackEmailSender(SmtpEmailSender primary, @Autowired(required = false) ResendEmailSender fallback) {
        this.primary = primary;
        this.fallback = fallback;
    }

    @Override
    public void sendHtml(String to, String subject, String htmlBody) {
        try {
            primary.sendHtml(to, subject, htmlBody);
        } catch (Exception e) {
            log.warn("email.fallback switching_to_resend to={} reason={}", to, e.getMessage());

            if (fallback == null) {
                log.error("email.fallback no_fallback_available to={}", to);
                throw e;
            }

            fallback.sendHtml(to, subject, htmlBody);
        }
    }
}
