"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck } from "lucide-react";

interface ShippingOption {
  name: string;
  price: number;
  days: string;
}

interface ShippingCalculatorProps {
  onSelectShipping?: (price: number) => void;
}

export function ShippingCalculator({ onSelectShipping }: ShippingCalculatorProps) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    setOptions(null);
    setError("");
    setSelectedOption(null);
  };

  const calculateShipping = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (cleanCep.length !== 8) {
      setError("CEP inválido. Digite um CEP com 8 dígitos.");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock shipping options based on CEP region
    const firstDigit = parseInt(cleanCep[0]);
    const basePrice = firstDigit <= 2 ? 15 : firstDigit <= 5 ? 25 : 35;

    const mockOptions: ShippingOption[] = [
      {
        name: "PAC",
        price: basePrice,
        days: `${5 + firstDigit} a ${8 + firstDigit} dias úteis`,
      },
      {
        name: "SEDEX",
        price: basePrice + 15,
        days: `${2 + Math.floor(firstDigit / 2)} a ${4 + Math.floor(firstDigit / 2)} dias úteis`,
      },
      {
        name: "SEDEX 10",
        price: basePrice + 30,
        days: `${1 + Math.floor(firstDigit / 3)} a ${2 + Math.floor(firstDigit / 3)} dias úteis`,
      },
    ];

    setOptions(mockOptions);
    setLoading(false);
  };

  const handleSelectOption = (index: number, price: number) => {
    setSelectedOption(index);
    onSelectShipping?.(price);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-foreground">
        <Truck className="h-5 w-5" />
        <span className="font-medium">Calcular Frete</span>
      </div>
      
      <div className="mt-3 flex gap-2">
        <Input
          type="text"
          placeholder="00000-000"
          value={cep}
          onChange={handleCepChange}
          maxLength={9}
          className="flex-1 bg-secondary"
        />
        <Button
          onClick={calculateShipping}
          disabled={loading || cep.replace(/\D/g, "").length !== 8}
          variant="secondary"
        >
          {loading ? "..." : "Calcular"}
        </Button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      
      {options && (
        <div className="mt-4 space-y-2">
          {options.map((option, index) => (
            <button
              key={option.name}
              onClick={() => handleSelectOption(index, option.price)}
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                selectedOption === index
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{option.name}</span>
                <span className="font-bold text-primary">
                  R$ {option.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{option.days}</p>
            </button>
          ))}
        </div>
      )}
      
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block text-sm text-primary hover:underline"
      >
        Não sei meu CEP
      </a>
    </div>
  );
}
