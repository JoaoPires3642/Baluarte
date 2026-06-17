package br.com.baluarte.core.shared.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.fusionauth")
public class FusionAuthProperties {

    private String issuer = "";
    private String jwksUri = "";
    private String apiKey = "";
    private String applicationId = "";
    private Duration userInfoCacheTtl = Duration.ofMinutes(5);

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getJwksUri() {
        return jwksUri;
    }

    public void setJwksUri(String jwksUri) {
        this.jwksUri = jwksUri;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public Duration getUserInfoCacheTtl() {
        return userInfoCacheTtl;
    }

    public void setUserInfoCacheTtl(Duration userInfoCacheTtl) {
        this.userInfoCacheTtl = userInfoCacheTtl;
    }
}
