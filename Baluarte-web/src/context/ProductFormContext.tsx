import { createContext, useContext, useMemo, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";

import type { ProductFormDraft } from "../components/admin/ProductFormTypes";
import {
  createInitialProductFormState,
  productFormReducer,
  type ProductFormAction,
  type ProductFormState
} from "./productFormReducer";

type ProductFormContextValue = {
  state: ProductFormState;
  dispatch: Dispatch<ProductFormAction>;
};

const ProductFormContext = createContext<ProductFormContextValue | null>(null);

type ProductFormProviderProps = {
  initialDraft: ProductFormDraft;
  children: ReactNode;
};

export function ProductFormProvider({ initialDraft, children }: ProductFormProviderProps) {
  const [state, dispatch] = useReducer(productFormReducer, createInitialProductFormState(initialDraft));
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>;
}

export function useProductFormContext() {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error("useProductFormContext must be used within ProductFormProvider");
  }
  return context;
}
