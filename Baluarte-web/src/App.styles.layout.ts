import { StyleSheet } from "react-native";

import { theme } from "./App.theme";

export const layoutStyles = {
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.white
  },
  appShell: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  scroll: {
    flex: 1
  },
  container: {
    paddingBottom: 112
  },
  headerShell: {
    backgroundColor: theme.colors.white,
    borderBottomColor: theme.colors.borderSoft,
    borderBottomWidth: 1,
    shadowColor: theme.colors.slate900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 64,
    backgroundColor: theme.colors.white
  },
  headerBrand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    flexShrink: 1
  },
  headerBrandTextWrap: {
    gap: 1,
    flexShrink: 1
  },
  heroSection: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 420,
    position: "relative"
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)"
  },
  heroContent: {
    padding: 18,
    gap: 8,
    marginTop: "auto"
  },
  heroButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 10
  },
  sectionMuted: {
    marginTop: 20,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12
  },
  categoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.5)"
  },
  categoryContent: {
    marginTop: "auto",
    padding: 16,
    gap: 4
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  stackScreen: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 10
  },
  authScreen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: "center",
    gap: 10
  },
  authCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.slate900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6
  },
  authTabRow: {
    flexDirection: "row",
    gap: 8
  },
  authForm: {
    gap: 10
  },
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginTop: 8
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10
  },
  productContent: {
    padding: 10,
    gap: 4
  },
  sizesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  productActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  cartItemCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    gap: 10
  },
  cartItemContent: {
    flex: 1,
    gap: 2
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 10
  },
  personalizationPreviewCard: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    minHeight: 220,
    position: "relative"
  },
  personalizationPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 18
  },
  chipsRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  inlineActionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  couponApplied: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 8,
    padding: 10
  },
  couponForm: {
    gap: 8
  },
  couponSuggestions: {
    flexDirection: "row",
    gap: 14
  },
  shippingRow: {
    flexDirection: "row",
    gap: 8
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  summaryLineTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2
  },
  checkoutSteps: {
    flexDirection: "row",
    gap: 16
  },
  adminMenuList: {
    gap: 8
  },
  adminKpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  footer: {
    marginTop: 18,
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 6
  },
  bottomNav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 8,
    shadowColor: theme.colors.slate900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8
  },
  bottomNavItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: "center"
  },
  adminHeroCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 4
  },
  adminKpiCard: {
    width: "48.5%",
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 10
  },
modalBody: {
    gap: 8,
    paddingBottom: 6
  },
  contentShell: {
    flex: 1
  },
  contentShellDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
    flex: 1
  },
  containerDesktop: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: "center",
    paddingBottom: 48,
    paddingHorizontal: 32
  },
  appShellDesktop: {
    maxWidth: "100%",
    flexDirection: "row"
  },
  bottomNavDesktop: {
    position: "static",
    width: 220,
    minHeight: "auto",
    borderRadius: 0,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    margin: 0,
    padding: 16,
    paddingTop: 24
  },
  headerDesktop: {
    paddingHorizontal: 32,
    minHeight: 80
  },
  headerActionsDesktop: {
    maxWidth: "none",
    gap: 16,
    flexDirection: "row"
  }
};

export const desktopStyles = {
  heroSectionDesktop: {
    marginHorizontal: 0,
    marginTop: 24,
    borderRadius: 16,
    minHeight: 480
  },
  heroButtonsDesktop: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16
  },
  sectionDesktop: {
    paddingHorizontal: 0,
    paddingTop: 32,
    gap: 16
  },
  productGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    rowGap: 20,
    columnGap: 16
  },
  stackScreenDesktop: {
    paddingHorizontal: 0,
    paddingTop: 24,
    gap: 16
  }
};
