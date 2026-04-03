import { slugifyCategory } from "./admin-categories";
import type { AdminCategory, Team } from "./types";

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export const validateCategoryInput = (name: string, logo: string, categories: AdminCategory[]): ValidationResult => {
  const nextName = name.trim();
  const nextLogo = logo.trim();
  const slug = slugifyCategory(nextName);

  if (!nextName || !nextLogo || !slug) {
    return { ok: false, message: "Preencha nome e logo da categoria." };
  }

  if (categories.some((item) => item.slug === slug)) {
    return { ok: false, message: "Ja existe uma categoria com este nome." };
  }

  return { ok: true };
};

export const validateTeamInput = (name: string, logo: string, teamId: string, teams: Team[]): ValidationResult => {
  if (!teamId || !name.trim() || !logo.trim()) {
    return { ok: false, message: "Preencha nome e escudo do time." };
  }

  if (teams.some((team) => team.id === teamId)) {
    return { ok: false, message: "Ja existe um time com esse identificador." };
  }

  return { ok: true };
};

export const validateProductInput = (
  name: string,
  description: string,
  parsedPrice: number,
  hasSelectedTeam: boolean
): ValidationResult => {
  if (!hasSelectedTeam || !name.trim() || !description.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return { ok: false, message: "Preencha nome, descricao, preco e time." };
  }

  return { ok: true };
};
