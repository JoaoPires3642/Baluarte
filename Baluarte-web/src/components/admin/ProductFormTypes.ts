import type { Dispatch, SetStateAction } from "react";

import type { ValidSize } from "../../pages/admin/types";

export type ProductFormDraft = {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  category: string;
  teamId: string;
  stockBySize: Record<ValidSize, string>;
  images: string[];
};

export type ProductFormSetter = Dispatch<SetStateAction<ProductFormDraft>>;

export type ProductOption = {
  value: string;
  label: string;
};

export type ProductFormStep = 1 | 2 | 3;
