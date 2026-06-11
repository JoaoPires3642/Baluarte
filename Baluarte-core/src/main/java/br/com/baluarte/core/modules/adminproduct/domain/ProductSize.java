package br.com.baluarte.core.modules.adminproduct.domain;

import java.util.List;

public enum ProductSize {
    P("P"),
    M("M"),
    G("G"),
    GG("GG"),
    G1("G1"),
    G2("G2"),
    G3("G3"),
    G4("G4"),
    SIZE_2("2"),
    SIZE_4("4"),
    SIZE_6("6"),
    SIZE_8("8"),
    SIZE_10("10"),
    SIZE_12("12"),
    SIZE_14("14");

    private final String dbValue;

    ProductSize(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public ProductSizeCategory getCategory() {
        return switch (this) {
            case P, M, G, GG, G1, G2, G3, G4 -> ProductSizeCategory.ADULTO;
            case SIZE_2, SIZE_4, SIZE_6, SIZE_8, SIZE_10, SIZE_12, SIZE_14 -> ProductSizeCategory.INFANTIL;
        };
    }

    public static ProductSize fromString(String value) {
        String trimmed = value.trim();
        for (ProductSize size : values()) {
            if (size.dbValue.equals(trimmed)) {
                return size;
            }
        }
        throw new IllegalArgumentException("Invalid size: " + value);
    }

    public static List<ProductSize> forCategory(ProductSizeCategory category) {
        return switch (category) {
            case ADULTO -> List.of(P, M, G, GG, G1, G2, G3, G4);
            case INFANTIL -> List.of(SIZE_2, SIZE_4, SIZE_6, SIZE_8, SIZE_10, SIZE_12, SIZE_14);
        };
    }
}
