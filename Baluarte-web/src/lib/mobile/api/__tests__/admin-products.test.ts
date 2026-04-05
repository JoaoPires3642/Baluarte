import {
  createAdminProductApi,
  deleteAdminProductApi,
  updateAdminProductApi,
  type CreateAdminProductPayload
} from "../admin-products";

describe("admin products api helpers", () => {
  const payload: CreateAdminProductPayload = {
    categorySlug: "nacionais",
    teamSlug: "flamengo",
    modelName: "Camisa Teste",
    description: "Descricao",
    price: 199.9,
    imageUrl: "https://cdn.baluarte.com/produto.png",
    customizationEnabled: false,
    variants: [
      { size: "P", stockQuantity: 2 },
      { size: "M", stockQuantity: 3 }
    ]
  };

  it("calls POST /admin/products for create", async () => {
    const request = jest.fn().mockResolvedValue({ data: { id: "p1" } });
    const client = { request };

    await createAdminProductApi(payload, {
      client: client as never,
      bearerToken: "token_admin"
    });

    expect(request).toHaveBeenCalledWith(
      "/admin/products",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({ Authorization: "Bearer token_admin" })
      })
    );
  });

  it("calls PUT /admin/products/{id} for update", async () => {
    const request = jest.fn().mockResolvedValue({ data: { id: "p1" } });
    const client = { request };

    await updateAdminProductApi("p1", payload, {
      client: client as never,
      bearerToken: "token_admin"
    });

    expect(request).toHaveBeenCalledWith(
      "/admin/products/p1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({ Authorization: "Bearer token_admin" })
      })
    );
  });

  it("calls DELETE /admin/products/{id} for soft delete", async () => {
    const request = jest.fn().mockResolvedValue({ data: { id: "p1", active: false } });
    const client = { request };

    await deleteAdminProductApi("p1", {
      client: client as never,
      bearerToken: "token_admin"
    });

    expect(request).toHaveBeenCalledWith(
      "/admin/products/p1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer token_admin" })
      })
    );
  });
});
