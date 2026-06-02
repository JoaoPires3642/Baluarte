export const VALID_SIZES = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"] as const;

export const slugifyEntity = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
