package br.com.baluarte.core.modules.admin.api;

public record AdminSessionResponse(String userId, String email, String internalRole) {
}