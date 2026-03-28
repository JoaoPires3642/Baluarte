package br.com.baluarte.core.shared.error;

import java.util.List;

public record ApiErrorPayload(String code, String message, List<String> details) {
}
