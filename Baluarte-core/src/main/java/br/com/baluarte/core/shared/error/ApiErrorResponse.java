package br.com.baluarte.core.shared.error;

public record ApiErrorResponse(ApiErrorPayload error, String traceId) {
}
