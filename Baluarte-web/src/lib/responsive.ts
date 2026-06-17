export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

export type ViewportKind = "mobile" | "tablet" | "desktop";

export function getViewportKind(width: number): ViewportKind {
  if (width >= BREAKPOINTS.desktop) {
    return "desktop";
  }
  if (width >= BREAKPOINTS.tablet) {
    return "tablet";
  }
  return "mobile";
}

export function isDesktopViewport(width: number): boolean {
  return getViewportKind(width) === "desktop";
}

export function isTabletViewport(width: number): boolean {
  return getViewportKind(width) === "tablet";
}

export function isMobileViewport(width: number): boolean {
  return getViewportKind(width) === "mobile";
}

function resolveResponsiveColumnValue<T>(
  width: number,
  values: { mobile: T; tablet?: T; desktop?: T }
): T {
  const kind = getViewportKind(width);
  if (kind === "desktop") {
    return values.desktop ?? values.tablet ?? values.mobile;
  }
  if (kind === "tablet") {
    return values.tablet ?? values.mobile;
  }
  return values.mobile;
}

export const resolveResponsiveColumns = resolveResponsiveColumnValue;
export const resolveResponsiveValue = resolveResponsiveColumnValue;
