package br.com.baluarte.core.shared.auth;

public record AuthContext(String userId, String email, InternalRole internalRole) {
}
