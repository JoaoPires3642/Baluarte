import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { CheckoutScreen } from "../CheckoutScreen";
import type { Address } from "../../../lib/types";

const guestAddress: Address = {
  cep: "01001-000",
  street: "Rua A",
  number: "100",
  neighborhood: "Centro",
  city: "Sao Paulo",
  state: "SP"
};

const defaultQuoteOptions = [
  {
    id: "standard",
    label: "Padrao",
    price: 19.9,
    estimatedDays: 4,
    deliveryEstimate: "4 dia(s)"
  }
];

const freeShippingQuoteOptions = [
  {
    id: "pickup",
    label: "Retirada na loja",
    price: 0,
    estimatedDays: 0,
    deliveryEstimate: "Mesmo dia"
  }
];

const resolveShippingQuotes = async () => ({ ok: true as const, options: defaultQuoteOptions });

describe("CheckoutScreen", () => {
  it("allows visitor to quote and advance checkout before login", async () => {
    const onSetShipping = jest.fn();
    const onRequestShippingQuotes = jest.fn(resolveShippingQuotes);

    render(
      <CheckoutScreen
        user={null}
        items={[
          {
            product: {
              id: "fla-home-2024",
              name: "Camisa Flamengo I",
              description: "desc",
              price: 299.9,
              image: "https://example.com/a.png",
              teamId: "flamengo",
              team: {
                id: "flamengo",
                name: "Flamengo",
                logo: "https://example.com/logo.png",
                category: "nacionais"
              },
              sizes: ["P", "M", "G", "GG"],
              stockBySize: { P: 1, M: 1, G: 1, GG: 1 },
              inStock: true
            },
            size: "M",
            quantity: 1
          }
        ]}
        subtotal={299.9}
        shipping={0}
        discount={0}
        total={299.9}
        onSetShipping={onSetShipping}
        onRequestShippingQuotes={onRequestShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    fireEvent.changeText(screen.getByPlaceholderText("CEP"), guestAddress.cep);
    fireEvent.changeText(screen.getByPlaceholderText("Rua"), guestAddress.street);
    fireEvent.changeText(screen.getByPlaceholderText("Numero"), guestAddress.number);
    fireEvent.changeText(screen.getByPlaceholderText("Bairro"), guestAddress.neighborhood);
    fireEvent.changeText(screen.getByPlaceholderText("Cidade"), guestAddress.city);
    fireEvent.changeText(screen.getByPlaceholderText("UF"), guestAddress.state);

    await act(async () => {
      fireEvent.press(screen.getByText("Buscar opcoes de frete"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onRequestShippingQuotes).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Padrao")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Continuar para revisao"));

    expect(onSetShipping).toHaveBeenCalledTimes(2);
    expect(onSetShipping).toHaveBeenLastCalledWith(19.9);
    expect(screen.getByText("Revisar pedido")).toBeTruthy();
  });

  it("requires auth only on final confirmation and keeps checkout context available", () => {
    const onRequireAuth = jest.fn();
    const onCheckoutContextChange = jest.fn();

    const { rerender } = render(
      <CheckoutScreen
        user={null}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={3}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={onCheckoutContextChange}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("Entrar para finalizar"));

    expect(onRequireAuth).toHaveBeenCalledTimes(1);
    expect(onCheckoutContextChange).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 3,
        guestAddressDraft: expect.objectContaining({ cep: "01001-000" })
      })
    );

    rerender(
      <CheckoutScreen
        user={{
          id: "u1",
          name: "Joao",
          email: "joao@email.com",
          role: "client"
        }}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={3}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={onCheckoutContextChange}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    expect(screen.getByText("Confirmar pagamento de R$ 120,00")).toBeTruthy();
  });

  it("keeps guest shipping address visible after login resume even when user has default address", () => {
    const onCheckoutContextChange = jest.fn();

    render(
      <CheckoutScreen
        user={{
          id: "u1",
          name: "Joao",
          email: "joao@email.com",
          role: "client",
          defaultAddressId: "addr-default",
          addresses: [
            {
              id: "addr-default",
              label: "Casa",
              cep: "22222-000",
              street: "Rua B",
              number: "200",
              neighborhood: "Jardins",
              city: "Sao Paulo",
              state: "SP"
            }
          ]
        }}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={2}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={onCheckoutContextChange}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    expect(screen.getByText("Rua A, 100")).toBeTruthy();
    expect(screen.getByText("Centro, Sao Paulo - SP")).toBeTruthy();
    expect(onCheckoutContextChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedAddressId: undefined,
        guestAddressDraft: expect.objectContaining({ street: "Rua A", number: "100" })
      })
    );
  });

  it("sends preserved checkout address when confirming payment after auth", async () => {
    jest.useFakeTimers();
    const onOrderComplete = jest.fn();
    const onFinalizeOrder = jest.fn(async () => ({ ok: true as const }));

    render(
      <CheckoutScreen
        user={{
          id: "u1",
          name: "Joao",
          email: "joao@email.com",
          role: "client",
          defaultAddressId: "addr-default",
          addresses: [
            {
              id: "addr-default",
              label: "Casa",
              cep: "22222-000",
              street: "Rua B",
              number: "200",
              neighborhood: "Jardins",
              city: "Sao Paulo",
              state: "SP"
            }
          ]
        }}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={3}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={() => undefined}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onFinalizeOrder={onFinalizeOrder}
        onOrderComplete={onOrderComplete}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Confirmar pagamento de R$ 120,00"));
      jest.advanceTimersByTime(600);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onFinalizeOrder).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(onOrderComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          street: "Rua A",
          number: "100"
        })
      );
    });
    jest.useRealTimers();
  });

  it("redirects to auth when backend finalization check requests re-authentication", async () => {
    const onRequireAuth = jest.fn();
    const onOrderComplete = jest.fn();

    render(
      <CheckoutScreen
        user={{
          id: "u1",
          name: "Joao",
          email: "joao@email.com",
          role: "client"
        }}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={3}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={() => undefined}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
        onFinalizeOrder={async () => ({ ok: false, requiresAuth: true })}
        onOrderComplete={onOrderComplete}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Confirmar pagamento de R$ 120,00"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onRequireAuth).toHaveBeenCalledTimes(1);
      expect(onOrderComplete).not.toHaveBeenCalled();
    });
  });

  it("shows recoverable error when finalization callback throws", async () => {
    const onRequireAuth = jest.fn();

    render(
      <CheckoutScreen
        user={{
          id: "u1",
          name: "Joao",
          email: "joao@email.com",
          role: "client"
        }}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={3}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={() => undefined}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
        onFinalizeOrder={async () => {
          throw new Error("network");
        }}
        onOrderComplete={() => undefined}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Confirmar pagamento de R$ 120,00"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText("Nao foi possivel validar a sessao. Tente novamente.")).toBeTruthy();
      expect(onRequireAuth).not.toHaveBeenCalled();
    });
  });

  it("preserves checkout context across reauth and allows final confirmation", async () => {
    const onRequireAuth = jest.fn();
    const onOrderComplete = jest.fn();
    const onCheckoutContextChange = jest.fn();

    const { rerender } = render(
      <CheckoutScreen
        user={null}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={3}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={onCheckoutContextChange}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
        onFinalizeOrder={async () => ({ ok: false, requiresAuth: true })}
        onOrderComplete={onOrderComplete}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Entrar para finalizar"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onRequireAuth).toHaveBeenCalledTimes(1);
      expect(onCheckoutContextChange).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 3,
          guestAddressDraft: expect.objectContaining({ street: "Rua A", number: "100" })
        })
      );
    });

    rerender(
      <CheckoutScreen
        user={{
          id: "u1",
          name: "Joao",
          email: "joao@email.com",
          role: "client"
        }}
        items={[]}
        subtotal={100}
        shipping={20}
        discount={0}
        total={120}
        initialStep={3}
        guestAddressDraft={guestAddress}
        onCheckoutContextChange={onCheckoutContextChange}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={onOrderComplete}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Confirmar pagamento de R$ 120,00"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onOrderComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          street: "Rua A",
          number: "100"
        })
      );
    });
  });

  it("requires logged user without saved addresses to go to profile", () => {
    const onGoProfile = jest.fn();

    render(
      <CheckoutScreen
        user={{
          id: "u-no-address",
          name: "Cliente",
          email: "cliente@email.com",
          role: "client",
          addresses: []
        }}
        items={[]}
        subtotal={100}
        shipping={0}
        discount={0}
        total={100}
        onCheckoutContextChange={() => undefined}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={onGoProfile}
        onRequireAuth={() => undefined}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    expect(screen.getByText("Para continuar, cadastre pelo menos um endereco no seu perfil.")).toBeTruthy();
    fireEvent.press(screen.getByText("Cadastrar endereco no perfil"));
    expect(onGoProfile).toHaveBeenCalledTimes(1);
  });

  it("blocks transition to payment when review data is invalid", () => {
    render(
      <CheckoutScreen
        user={null}
        items={[
          {
            product: {
              id: "fla-home-2024",
              name: "Camisa Flamengo I",
              description: "desc",
              price: 299.9,
              image: "https://example.com/a.png",
              teamId: "flamengo",
              team: {
                id: "flamengo",
                name: "Flamengo",
                logo: "https://example.com/logo.png",
                category: "nacionais"
              },
              sizes: ["P", "M", "G", "GG"],
              stockBySize: { P: 1, M: 1, G: 1, GG: 1 },
              inStock: true
            },
            size: "M",
            quantity: 1
          }
        ]}
        subtotal={299.9}
        shipping={0}
        discount={0}
        total={299.9}
        initialStep={2}
        guestAddressDraft={guestAddress}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("Confirmar e pagar"));

    expect(screen.getByText("Selecione uma opcao de frete para continuar.")).toBeTruthy();
    expect(screen.queryByText("Pagamento")).toBeNull();
  });

  it("allows transition to payment with explicit free shipping option selected", async () => {
    const onSetShipping = jest.fn();
    const onRequestShippingQuotes = jest.fn(async () => ({ ok: true as const, options: freeShippingQuoteOptions }));

    render(
      <CheckoutScreen
        user={null}
        items={[
          {
            product: {
              id: "fla-home-2024",
              name: "Camisa Flamengo I",
              description: "desc",
              price: 299.9,
              image: "https://example.com/a.png",
              teamId: "flamengo",
              team: {
                id: "flamengo",
                name: "Flamengo",
                logo: "https://example.com/logo.png",
                category: "nacionais"
              },
              sizes: ["P", "M", "G", "GG"],
              stockBySize: { P: 1, M: 1, G: 1, GG: 1 },
              inStock: true
            },
            size: "M",
            quantity: 1
          }
        ]}
        subtotal={299.9}
        shipping={0}
        discount={0}
        total={299.9}
        onSetShipping={onSetShipping}
        onRequestShippingQuotes={onRequestShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    fireEvent.changeText(screen.getByPlaceholderText("CEP"), guestAddress.cep);
    fireEvent.changeText(screen.getByPlaceholderText("Rua"), guestAddress.street);
    fireEvent.changeText(screen.getByPlaceholderText("Numero"), guestAddress.number);
    fireEvent.changeText(screen.getByPlaceholderText("Bairro"), guestAddress.neighborhood);
    fireEvent.changeText(screen.getByPlaceholderText("Cidade"), guestAddress.city);
    fireEvent.changeText(screen.getByPlaceholderText("UF"), guestAddress.state);

    await act(async () => {
      fireEvent.press(screen.getByText("Buscar opcoes de frete"));
      await Promise.resolve();
    });

    fireEvent.press(screen.getByText("Continuar para revisao"));
    fireEvent.press(screen.getByText("Confirmar e pagar"));

    expect(onSetShipping).toHaveBeenLastCalledWith(0);
    expect(screen.getByText("Pagamento")).toBeTruthy();
    expect(screen.queryByText("Selecione uma opcao de frete para continuar.")).toBeNull();
  });

  it("blocks transition to payment when review has empty cart", () => {
    render(
      <CheckoutScreen
        user={null}
        items={[]}
        subtotal={0}
        shipping={19.9}
        discount={0}
        total={19.9}
        initialStep={2}
        guestAddressDraft={guestAddress}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("Confirmar e pagar"));

    expect(screen.getByText("Seu carrinho esta vazio. Volte e adicione itens para continuar.")).toBeTruthy();
    expect(screen.queryByText("Pagamento")).toBeNull();
  });

  it("blocks transition to payment when review has invalid address", () => {
    render(
      <CheckoutScreen
        user={null}
        items={[
          {
            product: {
              id: "fla-home-2024",
              name: "Camisa Flamengo I",
              description: "desc",
              price: 299.9,
              image: "https://example.com/a.png",
              teamId: "flamengo",
              team: {
                id: "flamengo",
                name: "Flamengo",
                logo: "https://example.com/logo.png",
                category: "nacionais"
              },
              sizes: ["P", "M", "G", "GG"],
              stockBySize: { P: 1, M: 1, G: 1, GG: 1 },
              inStock: true
            },
            size: "M",
            quantity: 1
          }
        ]}
        subtotal={299.9}
        shipping={19.9}
        discount={0}
        total={319.8}
        initialStep={2}
        guestAddressDraft={{
          ...guestAddress,
          cep: "123"
        }}
        onSetShipping={() => undefined}
        onRequestShippingQuotes={resolveShippingQuotes}
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onFinalizeOrder={async () => ({ ok: true })}
        onOrderComplete={() => undefined}
      />
    );

    fireEvent.press(screen.getByText("Confirmar e pagar"));

    expect(screen.getByText("Endereco de entrega invalido. Revise os dados para continuar.")).toBeTruthy();
    expect(screen.queryByText("Pagamento")).toBeNull();
  });
});
