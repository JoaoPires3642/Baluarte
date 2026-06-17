export const slugify = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");

  let result = "";
  for (const ch of normalized) {
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
      result += ch;
    } else if (result.length > 0 && !result.endsWith("-")) {
      result += "-";
    }
  }

  while (result.startsWith("-")) {
    result = result.slice(1);
  }
  while (result.endsWith("-")) {
    result = result.slice(0, -1);
  }

  return result;
};
