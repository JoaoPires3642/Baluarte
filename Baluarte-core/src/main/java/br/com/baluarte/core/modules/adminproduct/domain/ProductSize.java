package br.com.baluarte.core.modules.adminproduct.domain;

public enum ProductSize {
    P,
    M,
    G,
    GG;

    public static ProductSize fromString(String value) {
        return ProductSize.valueOf(value.trim().toUpperCase());
    }
}