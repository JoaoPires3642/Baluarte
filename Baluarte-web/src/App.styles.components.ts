import { theme } from "./App.theme";

export const componentStyles = {
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 12
  },
  headerBrandName: {
    color: theme.colors.slate900,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  headerBrandTagline: {
    color: theme.colors.blue700,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  headerHint: {
    color: theme.colors.slate500,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "56%"
  },
  headerUserName: {
    color: theme.colors.slate800,
    fontSize: 12,
    fontWeight: "700"
  },
  navChip: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  navChipPrimary: {
    borderColor: theme.colors.blue700,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: theme.colors.blue700,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  navChipText: {
    color: theme.colors.slate900,
    fontSize: 11,
    fontWeight: "700"
  },
  navChipPrimaryText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: "700"
  },
  formInput: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.slate800,
    backgroundColor: theme.colors.white
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: theme.colors.white,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.white,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 36,
    textTransform: "uppercase"
  },
  titleAccent: {
    color: theme.colors.sky300,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 36,
    textTransform: "uppercase"
  },
  subtitle: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4
  },
  primaryButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  primaryButtonText: {
    color: theme.colors.slate800,
    fontWeight: "700",
    fontSize: 13
  },
  secondaryButton: {
    borderColor: theme.colors.white,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  secondaryButtonText: {
    color: theme.colors.white,
    fontWeight: "700",
    fontSize: 13
  },
  sectionTitle: {
    color: theme.colors.slate800,
    fontSize: 24,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  categoryCard: {
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 185,
    position: "relative"
  },
  categoryName: {
    color: theme.colors.white,
    fontSize: 26,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  categoryLink: {
    color: theme.colors.blue300,
    fontSize: 13,
    fontWeight: "700"
  },
  featuredLabel: {
    color: theme.colors.blue700,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  featuredLink: {
    color: theme.colors.blue700,
    fontSize: 13,
    fontWeight: "700"
  },
  backLink: {
    color: theme.colors.blue700,
    fontSize: 14,
    fontWeight: "700"
  },
  screenTitle: {
    color: theme.colors.slate800,
    fontSize: 28,
    fontWeight: "800"
  },
  screenDescription: {
    color: theme.colors.slate600,
    fontSize: 14,
    lineHeight: 20
  },
  authTitle: {
    color: theme.colors.slate900,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center"
  },
  authSubtitle: {
    color: theme.colors.slate600,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  },
  authTabButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center"
  },
  authTabButtonActive: {
    backgroundColor: theme.colors.blue700,
    borderColor: theme.colors.blue700
  },
  authTabButtonText: {
    color: theme.colors.slate800,
    fontSize: 12,
    fontWeight: "700"
  },
  authTabButtonTextActive: {
    color: theme.colors.white
  },
  authInput: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    color: theme.colors.slate800,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  authHint: {
    color: theme.colors.slate500,
    fontSize: 11,
    textAlign: "right",
    textDecorationLine: "underline"
  },
  authInfo: {
    color: theme.colors.blue700,
    fontSize: 12
  },
  authSubmitButton: {
    borderRadius: 999,
    backgroundColor: theme.colors.blue700,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: "center"
  },
  authSubmitButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  authSocialButtonsWrap: {
    marginTop: 4,
    gap: 10
  },
  authSocialDivider: {
    color: theme.colors.slate500,
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  authSocialButtonBase: {
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4
  },
  authSocialIconWrap: {
    width: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  authSocialIconText: {
    fontSize: 18,
    lineHeight: 18,
    marginBottom: 1,
    fontWeight: "700"
  },
  authSocialIconApple: {
    color: theme.colors.white
  },
  authSocialIconGoogle: {
    color: "#2f2f2f"
  },
  authSocialButtonTextBase: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: "Lucida Sans, Lucida Sans Regular, Lucida Grande, Lucida Sans Unicode, Geneva, Verdana, sans-serif"
  },
  authSocialButtonApple: {
    borderColor: "#000000",
    backgroundColor: "#000000"
  },
  authSocialButtonAppleText: {
    color: theme.colors.white
  },
  authSocialButtonGoogle: {
    borderColor: "#747474",
    backgroundColor: theme.colors.white
  },
  authSocialButtonGoogleText: {
    color: theme.colors.slate800
  },
  authSwitchLabel: {
    color: theme.colors.slate500,
    fontSize: 12,
    textAlign: "center"
  },
  authSwitchLink: {
    color: theme.colors.blue700,
    fontWeight: "800",
    textDecorationLine: "underline"
  },
  teamCard: {
    width: "48.5%",
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    alignItems: "center",
    padding: 12,
    gap: 6
  },
  teamLogo: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  teamName: {
    color: theme.colors.slate800,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center"
  },
  teamLeague: {
    color: theme.colors.slate500,
    fontSize: 11,
    textAlign: "center"
  },
  productCard: {
    width: "48.5%",
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    overflow: "hidden"
  },
  productImage: {
    width: "100%",
    height: 190
  },
  productTeam: {
    color: theme.colors.slate500,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  productName: {
    color: theme.colors.slate800,
    fontSize: 13,
    fontWeight: "700",
    minHeight: 34
  },
  productPrice: {
    color: theme.colors.blue700,
    fontSize: 14,
    fontWeight: "800"
  },
  productPriceOriginal: {
    color: theme.colors.slate500,
    fontSize: 12,
    textDecorationLine: "line-through"
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  detailImage: {
    width: "100%",
    height: 360,
    borderRadius: 14,
    marginTop: 6
  },
  personalizationPreviewImage: {
    width: "100%",
    height: 240
  },
  personalizationPreviewName: {
    color: theme.colors.white,
    fontWeight: "900",
    fontStyle: "italic",
    textTransform: "uppercase",
    textShadowColor: "rgba(15,23,42,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    maxWidth: "80%",
    textAlign: "center",
    lineHeight: 32
  },
  personalizationPreviewNumber: {
    color: theme.colors.white,
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(15,23,42,0.95)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },
  detailPrice: {
    color: theme.colors.blue700,
    fontSize: 24,
    fontWeight: "900"
  },
  detailPriceOriginal: {
    color: theme.colors.slate500,
    fontSize: 16,
    fontWeight: "700",
    textDecorationLine: "line-through"
  },
  sizePill: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  sizePillSelected: {
    backgroundColor: theme.colors.blue700,
    borderColor: theme.colors.blue700
  },
  sizePillDisabled: {
    opacity: 0.45
  },
  sizeText: {
    color: theme.colors.slate800,
    fontSize: 12,
    fontWeight: "700"
  },
  sizeTextSelected: {
    color: theme.colors.white
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: theme.colors.blue700,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryActionButtonDisabled: {
    opacity: 0.55
  },
  primaryActionButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  secondaryActionButton: {
    flex: 1,
    borderColor: theme.colors.blue300,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  secondaryActionButtonText: {
    color: theme.colors.blue700,
    fontSize: 12,
    fontWeight: "700"
  },
  cartItemImage: {
    width: 88,
    height: 88,
    borderRadius: 8
  },
  cartItemName: {
    color: theme.colors.slate800,
    fontSize: 14,
    fontWeight: "700"
  },
  cartItemMeta: {
    color: theme.colors.slate500,
    fontSize: 12
  },
  cartItemBreakdownLine: {
    color: theme.colors.slate600,
    fontSize: 12
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  qtyButtonText: {
    color: theme.colors.slate800,
    fontSize: 16,
    fontWeight: "700"
  },
  qtyText: {
    width: 22,
    textAlign: "center",
    color: theme.colors.slate800,
    fontWeight: "700"
  },
  cartLinePrice: {
    marginLeft: "auto",
    color: theme.colors.blue700,
    fontWeight: "800",
    fontSize: 13
  },
  dangerLink: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700"
  },
  filterChip: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  filterChipActive: {
    backgroundColor: theme.colors.blue700,
    borderColor: theme.colors.blue700
  },
  filterChipText: {
    color: theme.colors.slate800,
    fontSize: 12,
    fontWeight: "700"
  },
  filterChipTextActive: {
    color: theme.colors.white
  },
  dangerButton: {
    borderColor: theme.colors.blue300,
    borderWidth: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  dangerButtonText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "700"
  },
  summaryTitle: {
    color: theme.colors.slate800,
    fontSize: 15,
    fontWeight: "800"
  },
  couponCode: {
    color: theme.colors.blue700,
    fontSize: 13,
    fontWeight: "800"
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12
  },
  shippingOption: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 8,
    alignItems: "center"
  },
  pickerWrap: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    overflow: "hidden"
  },
  pickerControl: {
    height: 44,
    color: theme.colors.slate800
  },
  selectField: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  selectFieldValue: {
    color: theme.colors.slate800,
    fontSize: 13,
    fontWeight: "600"
  },
  selectDropdown: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    overflow: "hidden"
  },
  selectSearchInput: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
    borderRadius: 0
  },
  selectDropdownScroll: {
    maxHeight: 180
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSoft
  },
  selectOptionText: {
    color: theme.colors.slate800,
    fontSize: 13,
    fontWeight: "600"
  },
  adminProductCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  imageUrlInput: {
    flex: 1
  },
  adminImageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  adminImageItem: {
    width: "31%",
    gap: 4
  },
  adminImageThumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  shippingLabel: {
    color: theme.colors.slate800,
    fontSize: 11,
    fontWeight: "700"
  },
  shippingValue: {
    color: theme.colors.blue700,
    fontSize: 12,
    fontWeight: "800"
  },
  summaryKey: {
    color: theme.colors.slate500,
    fontSize: 12
  },
  summaryValue: {
    color: theme.colors.slate800,
    fontSize: 12,
    fontWeight: "700"
  },
  summaryTotalKey: {
    color: theme.colors.slate800,
    fontSize: 14,
    fontWeight: "800"
  },
  summaryTotalValue: {
    color: theme.colors.blue700,
    fontSize: 14,
    fontWeight: "900"
  },
  stepActive: {
    color: theme.colors.blue700,
    fontSize: 13,
    fontWeight: "800"
  },
  stepDone: {
    color: theme.colors.slate500,
    fontSize: 13,
    fontWeight: "600"
  },
  stepInactive: {
    color: theme.colors.slate400,
    fontSize: 13,
    fontWeight: "600"
  },
  adminMenuButton: {
    borderColor: theme.colors.blue300,
    borderWidth: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2
  },
  adminMenuButtonText: {
    color: theme.colors.slate800,
    fontSize: 13,
    fontWeight: "800"
  },
  adminMenuButtonMeta: {
    color: theme.colors.slate600,
    fontSize: 11
  },
  adminHeroTitle: {
    color: theme.colors.slate900,
    fontSize: 20,
    fontWeight: "900"
  },
  adminHeroSubtitle: {
    color: theme.colors.slate600,
    fontSize: 13,
    lineHeight: 18
  },
  adminKpiLabel: {
    color: theme.colors.slate600,
    fontSize: 11,
    fontWeight: "600"
  },
  adminKpiValue: {
    color: theme.colors.blue700,
    fontSize: 18,
    fontWeight: "900"
  },
  adminSectionTitle: {
    color: theme.colors.slate900,
    fontSize: 15,
    fontWeight: "900"
  },
  footerBrand: {
    color: theme.colors.slate800,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  footerText: {
    color: theme.colors.slate600,
    fontSize: 13
  },
  footerMeta: {
    color: theme.colors.slate500,
    fontSize: 11,
    marginTop: 8
  },
  bottomNavItemActive: {
    backgroundColor: theme.colors.blue700
  },
  bottomNavText: {
    color: theme.colors.slate700,
    fontSize: 11,
    fontWeight: "700"
  },
  bottomNavTextActive: {
    color: theme.colors.white
  },
  errorBannerContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 6
  },
  errorBannerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  errorBannerIcon: {
    fontSize: 14,
    fontWeight: "700"
  },
  errorBannerText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18
  },
  toastContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 10,
    pointerEvents: "none"
  },
  toastBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: "80%",
    maxWidth: "90%",
    shadowColor: theme.colors.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  toastSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.95)",
    borderColor: "#22c55e",
    borderWidth: 1
  },
  toastError: {
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    borderColor: theme.colors.danger,
    borderWidth: 1
  },
  toastInfo: {
    backgroundColor: "rgba(59, 130, 246, 0.95)",
    borderColor: theme.colors.blue700,
    borderWidth: 1
  },
  toastIcon: {
    fontSize: 16,
    fontWeight: "700"
  },
  toastMessage: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18
  }
};
