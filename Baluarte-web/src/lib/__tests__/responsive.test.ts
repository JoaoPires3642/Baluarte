import { BREAKPOINTS, getViewportKind, isDesktopViewport, resolveResponsiveColumns } from "../responsive";

describe("responsive helpers", () => {
  it("classifies viewport widths consistently", () => {
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
    expect(getViewportKind(390)).toBe("mobile");
    expect(getViewportKind(900)).toBe("tablet");
    expect(getViewportKind(1280)).toBe("desktop");
    expect(isDesktopViewport(1280)).toBe(true);
    expect(isDesktopViewport(900)).toBe(false);
  });

  it("returns the right column count for each viewport kind", () => {
    expect(resolveResponsiveColumns(390, { mobile: 1, tablet: 2, desktop: 4 })).toBe(1);
    expect(resolveResponsiveColumns(834, { mobile: 1, tablet: 2, desktop: 4 })).toBe(2);
    expect(resolveResponsiveColumns(1440, { mobile: 1, tablet: 2, desktop: 4 })).toBe(4);
  });
});