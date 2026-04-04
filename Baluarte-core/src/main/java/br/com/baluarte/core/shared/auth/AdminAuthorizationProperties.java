package br.com.baluarte.core.shared.auth;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AdminAuthorizationProperties {

    private List<String> adminEmails = new ArrayList<>();
    private String clerkIssuer;
    private String clerkJwksUri;

    public List<String> getAdminEmails() {
        return adminEmails;
    }

    public void setAdminEmails(List<String> adminEmails) {
        this.adminEmails = adminEmails;
    }

    public String getClerkIssuer() {
        return clerkIssuer;
    }

    public void setClerkIssuer(String clerkIssuer) {
        this.clerkIssuer = clerkIssuer;
    }

    public String getClerkJwksUri() {
        return clerkJwksUri;
    }

    public void setClerkJwksUri(String clerkJwksUri) {
        this.clerkJwksUri = clerkJwksUri;
    }
}