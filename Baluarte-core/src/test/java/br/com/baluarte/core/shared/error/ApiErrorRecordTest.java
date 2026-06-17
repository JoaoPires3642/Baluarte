package br.com.baluarte.core.shared.error;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class ApiErrorRecordTest {

    @Test
    void apiErrorPayload() {
        var payload = new ApiErrorPayload("VALIDATION_ERROR", "Invalid input", List.of("field x is wrong"));
        assertThat(payload.code()).isEqualTo("VALIDATION_ERROR");
        assertThat(payload.message()).isEqualTo("Invalid input");
        assertThat(payload.details()).containsExactly("field x is wrong");
    }

    @Test
    void apiErrorResponse() {
        var payload = new ApiErrorPayload("ERR", "msg", List.of());
        var response = new ApiErrorResponse(payload, "trace-1");
        assertThat(response.error()).isSameAs(payload);
        assertThat(response.traceId()).isEqualTo("trace-1");
    }
}
