package br.com.baluarte.core.shared.error;

import br.com.baluarte.core.modules.adminproduct.application.AdminProductValidationException;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String VALIDATION_ERROR_CODE = "VALIDATION_ERROR";
    private static final String VALIDATION_FAILED_MESSAGE = "Request validation failed";

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
        ConstraintViolationException exception,
        HttpServletRequest request
    ) {
        List<String> details = exception.getConstraintViolations()
            .stream()
            .map(violation -> violation.getPropertyPath() + " " + violation.getMessage())
            .toList();

        return buildResponse(
            HttpStatus.BAD_REQUEST,
            VALIDATION_ERROR_CODE,
            VALIDATION_FAILED_MESSAGE,
            details,
            request
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
        MethodArgumentNotValidException exception,
        HttpServletRequest request
    ) {
        List<String> details = exception.getBindingResult().getFieldErrors()
            .stream()
            .map(fieldError -> fieldError.getField() + " " + fieldError.getDefaultMessage())
            .toList();

        return buildResponse(
            HttpStatus.BAD_REQUEST,
            VALIDATION_ERROR_CODE,
            VALIDATION_FAILED_MESSAGE,
            details,
            request
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(Exception exception, HttpServletRequest request) {
        return buildResponse(
            HttpStatus.BAD_REQUEST,
            "BAD_REQUEST",
            "Malformed request",
            List.of(exception.getMessage()),
            request
        );
    }

    @ExceptionHandler(AdminProductValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleAdminProductValidation(
        AdminProductValidationException exception,
        HttpServletRequest request
    ) {
        return buildResponse(
            HttpStatus.BAD_REQUEST,
            VALIDATION_ERROR_CODE,
            VALIDATION_FAILED_MESSAGE,
            exception.getFieldErrors(),
            request
        );
    }

    @ExceptionHandler(PaymentValidationException.class)
    public ResponseEntity<ApiErrorResponse> handlePaymentValidation(
        PaymentValidationException exception,
        HttpServletRequest request
    ) {
        return buildResponse(
            HttpStatus.BAD_REQUEST,
            VALIDATION_ERROR_CODE,
            exception.getMessage(),
            List.of(),
            request
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(
        ResponseStatusException exception,
        HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return buildResponse(
            status,
            status.name(),
            exception.getReason() != null ? exception.getReason() : status.getReasonPhrase(),
            List.of(),
            request
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(
        NoResourceFoundException exception,
        HttpServletRequest request
    ) {
        return buildResponse(
            HttpStatus.NOT_FOUND,
            "NOT_FOUND",
            "Resource not found",
            List.of(exception.getMessage()),
            request
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        String traceId = request.getAttribute(TraceIdFilter.TRACE_ID_KEY) instanceof String value
            ? value
            : MDC.get(TraceIdFilter.TRACE_ID_KEY);

        log.error("Unhandled exception for traceId={}", traceId, exception);

        return buildResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            exception.getMessage() != null ? exception.getMessage() : "An unexpected error occurred",
            List.of(),
            request
        );
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
        HttpStatus status,
        String code,
        String message,
        List<String> details,
        HttpServletRequest request
    ) {
        String traceId = request.getAttribute(TraceIdFilter.TRACE_ID_KEY) instanceof String value
            ? value
            : MDC.get(TraceIdFilter.TRACE_ID_KEY);

        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }

        ApiErrorResponse response = new ApiErrorResponse(new ApiErrorPayload(code, message, details), traceId);
        return ResponseEntity.status(status).body(response);
    }
}
