import { useState } from "react";

import type { Address, User } from "../lib/types";

type DemoUser = User & { password: string };

const DEMO_USERS: DemoUser[] = [
  {
    id: "admin-1",
    name: "Admin",
    email: "admin@loja.com",
    role: "admin",
    password: "admin123"
  },
  {
    id: "client-1",
    name: "Joao Silva",
    email: "joao@email.com",
    role: "client",
    password: "123456",
    defaultAddress: {
      cep: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP"
    },
    addresses: [
      {
        id: "addr-home",
        label: "Casa",
        cep: "01310-100",
        street: "Av. Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "Sao Paulo",
        state: "SP"
      },
      {
        id: "addr-work",
        label: "Trabalho",
        cep: "01330-000",
        street: "Av. Paulista",
        number: "500",
        neighborhood: "Bela Vista",
        city: "Sao Paulo",
        state: "SP"
      }
    ],
    defaultAddressId: "addr-home"
  }
];

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const found = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!found) {
      return false;
    }
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    return true;
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { ok: false, error: "Informe seu nome" };
    }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { ok: false, error: "Informe um email valido" };
    }
    if (password.length < 6) {
      return { ok: false, error: "A senha deve ter no minimo 6 caracteres" };
    }

    const exists = users.some((item) => item.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { ok: false, error: "Este email ja esta cadastrado" };
    }

    const nextUser: DemoUser = {
      id: `client-${Date.now()}`,
      name: trimmedName,
      email: normalizedEmail,
      role: "client",
      password
    };

    setUsers((prev) => [...prev, nextUser]);
    const { password: _, ...safeUser } = nextUser;
    setUser(safeUser);
    return { ok: true };
  };

  const accountLabel = !user ? "Perfil" : user.role === "admin" ? "Admin" : "Perfil";

  const updateUserAddress = (address: Address): { ok: true } | { ok: false; error: string } => {
    if (!user) {
      return { ok: false, error: "Usuario nao autenticado" };
    }
    const cepDigits = address.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      return { ok: false, error: "Informe um CEP valido com 8 digitos" };
    }
    if (!address.street.trim() || !address.number.trim() || !address.neighborhood.trim() || !address.city.trim() || !address.state.trim()) {
      return { ok: false, error: "Preencha todos os campos obrigatorios do endereco" };
    }

    const normalizedAddress: Address = {
      ...address,
      id: address.id || `addr-${Date.now()}`,
      label: address.label || "Endereco",
      cep: address.cep.trim(),
      street: address.street.trim(),
      number: address.number.trim(),
      complement: address.complement?.trim() || undefined,
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim().toUpperCase()
    };

    setUsers((prev) =>
      prev.map((item) => {
        if (item.id !== user.id) return item;
        
        let addresses = item.addresses || [];
        let defaultAddressId = item.defaultAddressId;
        
        // If address has an id, it's an existing address to update
        if (address.id) {
          addresses = addresses.map((a) => (a.id === address.id ? normalizedAddress : a));
          if (!addresses.find((a) => a.id === address.id)) {
            // If not found, add it (shouldn't happen normally)
            addresses.push(normalizedAddress);
          }
          // Set as default if there's no default or if it's the first address
          if (!defaultAddressId) {
            defaultAddressId = address.id;
          }
        } else {
          // No id means it's a new address being added
          addresses.push(normalizedAddress);
          if (!defaultAddressId) {
            defaultAddressId = normalizedAddress.id!;
          }
        }

        return {
          ...item,
          addresses,
          defaultAddressId,
          // Backward compatibility: keep defaultAddress updated
          defaultAddress: normalizedAddress
        };
      })
    );
    
    setUser((prev) => {
      if (!prev) return prev;
      
      let addresses = prev.addresses || [];
      let defaultAddressId = prev.defaultAddressId;
      
      if (address.id) {
        addresses = addresses.map((a) => (a.id === address.id ? normalizedAddress : a));
        if (!addresses.find((a) => a.id === address.id)) {
          addresses.push(normalizedAddress);
        }
        if (!defaultAddressId) {
          defaultAddressId = address.id;
        }
      } else {
        addresses.push(normalizedAddress);
        if (!defaultAddressId) {
          defaultAddressId = normalizedAddress.id!;
        }
      }
      
      return {
        ...prev,
        addresses,
        defaultAddressId,
        defaultAddress: normalizedAddress
      };
    });
    
    return { ok: true };
  };

  const updateUserAddresses = (addresses: Address[], defaultAddressId?: string): { ok: true } | { ok: false; error: string } => {
    if (!user) {
      return { ok: false, error: "Usuario nao autenticado" };
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              addresses,
              defaultAddressId: defaultAddressId || item.defaultAddressId
            }
          : item
      )
    );

    setUser((prev) =>
      prev
        ? {
            ...prev,
            addresses,
            defaultAddressId: defaultAddressId || prev.defaultAddressId
          }
        : prev
    );

    return { ok: true };
  };

  return {
    user,
    setUser,
    handleLogin,
    handleRegister,
    updateUserAddress,
    updateUserAddresses,
    accountLabel
  };
}
