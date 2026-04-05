import {
  createAdminProductApi,
  deleteAdminProductApi,
  listAdminProductsApi,
  mapAdminProductDtoToAdminProduct,
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

  it("calls GET /admin/products for list", async () => {
    const request = jest.fn().mockResolvedValue({ data: [] });
    const client = { request };

    await listAdminProductsApi({
      client: client as never,
      bearerToken: "token_admin"
    });

    expect(request).toHaveBeenCalledWith(
      "/admin/products",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token_admin" })
      })
    );
  });

  it("maps admin product dto into app state shape", () => {
    const product = mapAdminProductDtoToAdminProduct(
      {
        id: "p1",
        categorySlug: "nacionais",
        teamSlug: "flamengo",
        modelName: "Camisa Teste",
        description: "Descricao",
        price: 199.9,
        originalPrice: 249.9,
        imageUrl: "https://cdn.baluarte.com/produto.png",
        customizationEnabled: true,
        customizationTemplatePng: "https://cdn.baluarte.com/template.png",
        stockQuantity: 5,
        active: true,
        available: true,
        variants: [{ size: "P", stockQuantity: 5, available: true }]
      },
      [
        {
          id: "flamengo",
          name: "Flamengo",
          logo: "https://cdn.baluarte.com/flamengo.png",
          category: "nacionais",
          league: "Serie A"
        }
      ]
    );

    expect(product.id).toBe("p1");
    expect(product.team.id).toBe("flamengo");
    expect(product.stockBySize.P).toBe(5);
    expect(product.inStock).toBe(true);
  });
});
