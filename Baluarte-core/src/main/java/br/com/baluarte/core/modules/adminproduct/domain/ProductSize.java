package br.com.baluarte.core.modules.adminproduct.domain;

public enum ProductSize {
    P,
    M,
    G,
    GG,
    G1,
    G2,
    G3,
    G4;

    public static ProductSize fromString(String value) {
        return ProductSize.valueOf(value.trim().toUpperCase());
    }
}
