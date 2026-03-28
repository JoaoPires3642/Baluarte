package br.com.baluarte.core.shared.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiSuccessResponse<T>(T data, Map<String, Object> meta) {

    public static <T> ApiSuccessResponse<T> of(T data) {
        return new ApiSuccessResponse<>(data, null);
    }
}
