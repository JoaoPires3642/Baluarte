import { act, fireEvent, render, screen } from "@testing-library/react-native";

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

describe("CheckoutScreen", () => {
  it("allows visitor to advance checkout before login", () => {
    const onSetShipping = jest.fn();

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
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onOrderComplete={() => undefined}
      />
    );

    fireEvent.changeText(screen.getByPlaceholderText("CEP"), guestAddress.cep);
    fireEvent.changeText(screen.getByPlaceholderText("Rua"), guestAddress.street);
    fireEvent.changeText(screen.getByPlaceholderText("Numero"), guestAddress.number);
    fireEvent.changeText(screen.getByPlaceholderText("Bairro"), guestAddress.neighborhood);
    fireEvent.changeText(screen.getByPlaceholderText("Cidade"), guestAddress.city);
    fireEvent.changeText(screen.getByPlaceholderText("UF"), guestAddress.state);

    fireEvent.press(screen.getByText("Calcular frete e continuar"));

    expect(onSetShipping).toHaveBeenCalledTimes(1);
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
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
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
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={onRequireAuth}
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
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
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
        onBackCart={() => undefined}
        onGoProfile={() => undefined}
        onRequireAuth={() => undefined}
        onOrderComplete={onOrderComplete}
      />
    );

    await act(async () => {
      fireEvent.press(screen.getByText("Confirmar pagamento de R$ 120,00"));
      jest.advanceTimersByTime(1200);
      await Promise.resolve();
    });

    expect(onOrderComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        street: "Rua A",
        number: "100"
      })
    );
    jest.useRealTimers();
  });
});
