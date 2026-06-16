package br.com.baluarte.core.shared.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "auth_user")
@Getter
@NoArgsConstructor
public class AuthUserJpaEntity implements Persistable<String> {

    @Id
    @Column(name = "clerk_user_id", nullable = false, length = 120)
    private String userId;

    @Column(name = "email", nullable = false, length = 320)
    private String email;

    @Column(name = "role", nullable = false, length = 16)
    private String role;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    private boolean isNew = true;

    @Override
    public String getId() {
        return userId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    private void markNotNew() {
        this.isNew = false;
    }

    public static AuthUserJpaEntity createDefaultCustomer(String userId, String email) {
        AuthUserJpaEntity entity = new AuthUserJpaEntity();
        LocalDateTime now = LocalDateTime.now();
        entity.userId = userId;
        entity.email = email;
        entity.role = "client";
        entity.createdAt = now;
        entity.updatedAt = now;
        return entity;
    }

    public void touchEmail(String nextEmail) {
        if (!email.equals(nextEmail)) {
            this.email = nextEmail;
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void setRole(String role) {
        this.role = role;
        this.updatedAt = LocalDateTime.now();
    }
}
