import { useState } from "react";

import type { Address } from "../lib/types";

type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export function useViaCep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddressByCep = async (cep: string): Promise<Partial<Address> | null> => {
    const digits = cep.replace(/\D/g, "");

    if (digits.length !== 8) {
      setError("CEP deve ter 8 dígitos");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setError("CEP não encontrado");
        return null;
      }

      return {
        cep: data.cep.replace(/(\d{5})(\d{3})/, "$1-$2"),
        street: data.logradouro,
        complement: data.complemento || undefined,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf
      };
    } catch (err) {
      setError("Erro ao buscar CEP. Tente novamente.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchAddressByCep, loading, error };
}
