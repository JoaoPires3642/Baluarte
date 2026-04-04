package br.com.baluarte.core.shared.auth;

public record AuthContext(String clerkUserId, String clerkEmail, InternalRole internalRole) {
}