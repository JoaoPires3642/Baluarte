import { validateProductInput } from "../admin-validation";

describe("validateProductInput", () => {
  it("rejects missing required product fields", () => {
    expect(validateProductInput("", "", 0, false)).toEqual({
      ok: false,
      message: "Preencha nome, descricao, preco e time."
    });
  });

  it("accepts a complete product draft", () => {
    expect(validateProductInput("Camisa Flamengo I", "Oficial", 299.9, true)).toEqual({
      ok: true
    });
  });
});