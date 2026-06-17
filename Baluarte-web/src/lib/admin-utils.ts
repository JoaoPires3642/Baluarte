import { slugify } from "./slugify";

export const VALID_SIZES = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"] as const;

export const slugifyEntity = (value: string): string => slugify(value);
