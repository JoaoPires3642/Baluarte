package br.com.baluarte.core.modules.auth.api;

public record AuthSessionResponse(String userId, String email, String internalRole) {
}