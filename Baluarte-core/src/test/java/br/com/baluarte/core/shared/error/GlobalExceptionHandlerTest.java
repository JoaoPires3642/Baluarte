package br.com.baluarte.core.shared.error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.application.AdminProductValidationException;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @Mock
    private HttpServletRequest request;

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @BeforeEach
    void setUp() {
        when(request.getAttribute(TraceIdFilter.TRACE_ID_KEY)).thenReturn("trace-1");
    }

    @Test
    void handleConstraintViolation() {
        Path mockPath = mock(Path.class);
        when(mockPath.toString()).thenReturn("name");
        ConstraintViolation<?> violation = mock(ConstraintViolation.class);
        when(violation.getPropertyPath()).thenReturn(mockPath);
        when(violation.getMessage()).thenReturn("must not be blank");
        ConstraintViolationException ex = new ConstraintViolationException(Set.of(violation));

        ResponseEntity<ApiErrorResponse> resp = handler.handleConstraintViolation(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().error().details()).contains("name must not be blank");
    }

    @Test
    void handleMethodArgumentNotValid() {
        FieldError fieldError = new FieldError("obj", "email", "must be valid");
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(null, "obj");
        bindingResult.addError(fieldError);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiErrorResponse> resp = handler.handleMethodArgumentNotValid(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().error().details()).contains("email must be valid");
    }

    @Test
    void handleTypeMismatch() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
            "bad", String.class, "param", null, null
        );

        ResponseEntity<ApiErrorResponse> resp = handler.handleTypeMismatch(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void handleAdminProductValidation() {
        AdminProductValidationException ex = new AdminProductValidationException(
            List.of("price must be positive", "name required")
        );

        ResponseEntity<ApiErrorResponse> resp = handler.handleAdminProductValidation(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().error().details()).containsExactly(
            "price must be positive", "name required"
        );
    }

    @Test
    void handlePaymentValidation() {
        PaymentValidationException ex = new PaymentValidationException("Card expired");

        ResponseEntity<ApiErrorResponse> resp = handler.handlePaymentValidation(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().error().code()).isEqualTo("VALIDATION_ERROR");
    }

    @Test
    void handleResponseStatus() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");

        ResponseEntity<ApiErrorResponse> resp = handler.handleResponseStatus(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(resp.getBody().error().message()).isEqualTo("Resource not found");
    }

    @Test
    void handleUnexpected() {
        Exception ex = new RuntimeException("Unexpected error");

        ResponseEntity<ApiErrorResponse> resp = handler.handleUnexpected(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(resp.getBody().error().message()).isEqualTo("Unexpected error");
    }

    @Test
    void handleUnexpectedNullMessage() {
        Exception ex = new NullPointerException();

        ResponseEntity<ApiErrorResponse> resp = handler.handleUnexpected(ex, request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(resp.getBody().error().code()).isEqualTo("INTERNAL_SERVER_ERROR");
    }

    @Test
    void buildResponseGeneratesTraceIdWhenAttributeMissing() {
        when(request.getAttribute(TraceIdFilter.TRACE_ID_KEY)).thenReturn(null);

        ResponseEntity<ApiErrorResponse> resp = handler.handleConstraintViolation(
            new ConstraintViolationException(Set.of()), request
        );

        assertThat(resp.getBody().traceId()).isNotNull();
    }
}
