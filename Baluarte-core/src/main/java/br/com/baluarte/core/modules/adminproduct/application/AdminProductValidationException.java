package br.com.baluarte.core.modules.adminproduct.application;

import java.util.List;

public class AdminProductValidationException extends RuntimeException {

    private final List<String> fieldErrors;

    public AdminProductValidationException(List<String> fieldErrors) {
        super("Admin product validation failed");
        this.fieldErrors = List.copyOf(fieldErrors);
    }

    public List<String> getFieldErrors() {
        return fieldErrors;
    }
}