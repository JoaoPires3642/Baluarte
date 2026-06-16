package br.com.baluarte.core.shared.auth;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AdminAuthorizationProperties {

    private List<String> adminEmails = new ArrayList<>();
    private List<String> adminUserIds = new ArrayList<>();
    private boolean devBypassEnabled;
    private String devBypassKey;

    public List<String> getAdminEmails() {
        return adminEmails;
    }

    public void setAdminEmails(List<String> adminEmails) {
        this.adminEmails = adminEmails;
    }

    public List<String> getAdminUserIds() {
        return adminUserIds;
    }

    public void setAdminUserIds(List<String> adminUserIds) {
        this.adminUserIds = adminUserIds;
    }

    public boolean isDevBypassEnabled() {
        return devBypassEnabled;
    }

    public void setDevBypassEnabled(boolean devBypassEnabled) {
        this.devBypassEnabled = devBypassEnabled;
    }

    public String getDevBypassKey() {
        return devBypassKey;
    }

    public void setDevBypassKey(String devBypassKey) {
        this.devBypassKey = devBypassKey;
    }
}
