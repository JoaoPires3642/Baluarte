# Web Responsive Shadcn Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Baluarte web app responsive across mobile, tablet, and desktop while preserving current business flows and migrating the presentation layer to shared shadcn-inspired primitives.

**Architecture:** Keep business logic, routing state, and screen flow shared in the existing Expo + react-native-web app. Introduce a small responsive foundation plus shared UI primitives styled after shadcn/ui, then refactor the app shell and key screens to use adaptive layout composition instead of mobile-only structure. Use platform and viewport branching only at layout boundaries, not in business logic.

**Tech Stack:** Expo SDK 54, React 19, React Native 0.81, react-native-web, TypeScript, Jest, @testing-library/react-native

---

## Scope and implementation note

Context7 confirms two important constraints that shape this plan:
- `shadcn/ui` assumes web React with Tailwind CSS and Radix primitives, so it cannot be dropped directly into the shared Expo + React Native code as-is.
- Expo and react-native-web support shared code plus layout branching with viewport/platform checks, so the safest path is a **shared shadcn-inspired component layer** built on React Native primitives.

That means this plan uses the **visual language and component ergonomics** of shadcn/ui, but implements them as shared React Native components so mobile and web can keep maximum reuse.

## File structure

### Create
- `src/lib/responsive.ts` — shared viewport breakpoints and helper functions
- `src/lib/__tests__/responsive.test.ts` — unit tests for viewport helpers
- `src/components/ui/AppButton.tsx` — shared button primitive with primary/secondary/ghost variants
- `src/components/ui/AppCard.tsx` — shared surface/card primitive
- `src/components/ui/AppField.tsx` — shared labeled input wrapper for forms
- `src/components/ui/PageContainer.tsx` — shared page width and spacing wrapper
- `src/components/layout/__tests__/BottomNav.test.tsx` — desktop/mobile navigation layout behavior
- `src/pages/storefront/__tests__/HomeScreen.test.tsx` — storefront responsive structure smoke test
- `src/pages/admin/__tests__/AdminDashboardScreen.test.tsx` — admin dashboard responsive structure smoke test

### Modify
- `src/App.tsx` — compute viewport mode and pass shell layout props
- `src/App.styles.layout.ts` — add app-shell, container, grid, and desktop navigation styles
- `src/App.styles.components.ts` — add shadcn-inspired visual tokens for shared controls and cards
- `src/components/layout/AppHeader.tsx` — adapt header actions and desktop spacing
- `src/components/layout/BottomNav.tsx` — support fixed mobile bottom nav and static desktop nav rail
- `src/pages/storefront/HomeScreen.tsx` — responsive hero, categories, and featured grid
- `src/pages/storefront/ProductScreen.tsx` — responsive media/details/personalization layout
- `src/pages/storefront/CartScreen.tsx` — responsive cart items and summary composition
- `src/pages/storefront/CheckoutScreen.tsx` — responsive checkout steps, address section, and summary section
- `src/pages/storefront/__tests__/CartScreen.test.tsx` — preserve cart behavior through UI refactor
- `src/pages/storefront/__tests__/CheckoutScreen.test.tsx` — preserve checkout flow through UI refactor
- `src/pages/admin/AdminDashboardScreen.tsx` — responsive KPI, chart, and quick-action layout
- `src/pages/admin/AdminProductsScreen.tsx` — responsive filters, list, and form modal layout
- `__tests__/app.smoke.test.tsx` — keep app boot regression coverage after shell refactor

---

### Task 1: Add shared responsive foundation

**Files:**
- Create: `src/lib/responsive.ts`
- Test: `src/lib/__tests__/responsive.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/lib/__tests__/responsive.test.ts`
Expected: FAIL with `Cannot find module '../responsive'`

- [ ] **Step 3: Write minimal implementation**

```ts
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024
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

export function resolveResponsiveColumns(
  width: number,
  values: { mobile: number; tablet?: number; desktop?: number }
): number {
  const kind = getViewportKind(width);
  if (kind === "desktop") {
    return values.desktop ?? values.tablet ?? values.mobile;
  }
  if (kind === "tablet") {
    return values.tablet ?? values.mobile;
  }
  return values.mobile;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand src/lib/__tests__/responsive.test.ts`
Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/responsive.ts src/lib/__tests__/responsive.test.ts
git commit -m "feat(ui): add shared responsive viewport helpers"
```

### Task 2: Refactor the app shell for mobile and desktop navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.styles.layout.ts`
- Modify: `src/components/layout/AppHeader.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `__tests__/app.smoke.test.tsx`
- Test: `src/components/layout/__tests__/BottomNav.test.tsx`

- [ ] **Step 1: Write the failing navigation layout test**

```ts
import { render, screen } from "@testing-library/react-native";

import { BottomNav } from "../BottomNav";

describe("BottomNav", () => {
  const commonProps = {
    isAdminUser: false,
    isHomeActive: true,
    isCartActive: false,
    isOrdersActive: false,
    isAdminActive: false,
    isAdminProductsActive: false,
    isAdminOrdersActive: false,
    isAdminCouponsActive: false,
    cartCount: 1,
    accountLabel: "Perfil",
    onPressHome: jest.fn(),
    onPressCart: jest.fn(),
    onPressOrders: jest.fn(),
    onPressAccount: jest.fn(),
    onPressAdminProducts: jest.fn(),
    onPressAdminOrders: jest.fn(),
    onPressAdminCoupons: jest.fn()
  };

  it("renders a desktop navigation shell when isDesktop is true", () => {
    const { getByTestId } = render(<BottomNav {...commonProps} isDesktop />);

    expect(getByTestId("bottom-nav")).toHaveStyle({ position: "static" });
    expect(screen.getByText("Inicio")).toBeTruthy();
    expect(screen.getByText("Carrinho (1)")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/components/layout/__tests__/BottomNav.test.tsx`
Expected: FAIL because `isDesktop` and `testID="bottom-nav"` do not exist yet

- [ ] **Step 3: Implement the adaptive app shell**

`src/App.tsx`
```tsx
import { ScrollView, View, useWindowDimensions } from "react-native";
import { isDesktopViewport } from "./lib/responsive";

export default function App() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isDesktopViewport(width);
  const state = useAppState();

  return (
    <ToastProvider>
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        <StatusBar style="dark" translucent={false} backgroundColor="#ffffff" />
        <View style={[styles.appShell, isDesktop ? styles.appShellDesktop : null]}>
          <AppHeader
            user={user}
            topInset={insets.top}
            isDesktop={isDesktop}
            onGoHome={() => setRoute({ name: "home" })}
            onOpenLogin={() => setRoute({ name: "login", redirectAfterLogin: "orders", authMode: "login" })}
            onOpenRegister={() => setRoute({ name: "login", redirectAfterLogin: "orders", authMode: "register" })}
            onLogout={() => {
              handleLogout();
              setRoute({ name: "home" });
            }}
          />

          <View style={[styles.contentShell, isDesktop ? styles.contentShellDesktop : null]}>
            <BottomNav
              isDesktop={isDesktop}
              isAdminUser={isAdminUser}
              isHomeActive={route.name === "home"}
              isCartActive={route.name === "cart"}
              isOrdersActive={route.name === "orders"}
              isAdminActive={inAdminArea || route.name === "login" || route.name === "profile"}
              isAdminProductsActive={route.name === "admin-products"}
              isAdminOrdersActive={route.name === "admin-orders"}
              isAdminCouponsActive={route.name === "admin-coupons"}
              cartCount={cartCount}
              accountLabel={accountLabel}
              onPressHome={() => setRoute({ name: "home" })}
              onPressCart={() => setRoute({ name: "cart" })}
              onPressOrders={() => {
                if (user) {
                  setRoute({ name: "orders" });
                  return;
                }
                setRoute({ name: "login", redirectAfterLogin: "orders" });
              }}
              onPressAccount={() => {
                if (!user) {
                  setRoute({ name: "login", redirectAfterLogin: "profile" });
                  return;
                }
                if (user.role === "admin") {
                  setRoute({ name: "admin" });
                  return;
                }
                setRoute({ name: "profile" });
              }}
              onPressAdminProducts={() => setRoute({ name: "admin-products" })}
              onPressAdminOrders={() => setRoute({ name: "admin-orders" })}
              onPressAdminCoupons={() => setRoute({ name: "admin-coupons" })}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, isDesktop ? styles.containerDesktop : null]}>
              <AppRouteContent state={state} />
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </ToastProvider>
  );
}
```

`src/components/layout/AppHeader.tsx`
```tsx
type AppHeaderProps = {
  user: User | null;
  topInset: number;
  isDesktop?: boolean;
  onGoHome: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onLogout: () => void;
};

export function AppHeader({ user, topInset, isDesktop = false, onGoHome, onOpenLogin, onOpenRegister, onLogout }: AppHeaderProps) {
  return (
    <View style={styles.headerShell}>
      <View style={[styles.header, isDesktop ? styles.headerDesktop : null, { paddingTop: Math.max(8, topInset + 6) }]}>
        <Pressable style={styles.headerBrand} onPress={onGoHome}>
          <Image source={require("../../../public/logo.png")} style={styles.brandLogo} resizeMode="contain" />
          <View style={styles.headerBrandTextWrap}>
            <Text style={styles.headerBrandName}>Baluarte</Text>
            <Text style={styles.headerBrandTagline}>futebol premium</Text>
          </View>
        </Pressable>

        <View style={[styles.headerActions, isDesktop ? styles.headerActionsDesktop : null]}>
          {user ? <Text style={styles.headerUserName} numberOfLines={1}>{user.name}</Text> : null}
          {user ? (
            <Pressable style={styles.navChip} onPress={onLogout}><Text style={styles.navChipText}>Sair</Text></Pressable>
          ) : (
            <>
              <Pressable style={styles.navChip} onPress={onOpenLogin}><Text style={styles.navChipText}>Entrar</Text></Pressable>
              <Pressable style={styles.navChipPrimary} onPress={onOpenRegister}><Text style={styles.navChipPrimaryText}>Cadastrar</Text></Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
```

`src/components/layout/BottomNav.tsx`
```tsx
type BottomNavProps = {
  isDesktop?: boolean;
  isAdminUser: boolean;
  isHomeActive: boolean;
  isCartActive: boolean;
  isOrdersActive: boolean;
  isAdminActive: boolean;
  isAdminProductsActive: boolean;
  isAdminOrdersActive: boolean;
  isAdminCouponsActive: boolean;
  cartCount: number;
  accountLabel: string;
  onPressHome: () => void;
  onPressCart: () => void;
  onPressOrders: () => void;
  onPressAccount: () => void;
  onPressAdminProducts: () => void;
  onPressAdminOrders: () => void;
  onPressAdminCoupons: () => void;
};

export function BottomNav({ isDesktop = false, isAdminUser, ...props }: BottomNavProps) {
  return (
    <View testID="bottom-nav" style={[styles.bottomNav, isDesktop ? styles.bottomNavDesktop : null]}>
      {/* keep existing menu items, but allow desktop to render in a static block */}
    </View>
  );
}
```

`src/App.styles.layout.ts`
```ts
contentShell: {
  flex: 1
},
contentShellDesktop: {
  flexDirection: "row",
  alignItems: "stretch"
},
containerDesktop: {
  width: "100%",
  maxWidth: 1280,
  alignSelf: "center",
  paddingBottom: 48,
  paddingHorizontal: 24
},
headerDesktop: {
  paddingHorizontal: 24,
  minHeight: 80
},
headerActionsDesktop: {
  maxWidth: "none",
  gap: 12
},
bottomNavDesktop: {
  position: "static",
  left: undefined,
  right: undefined,
  bottom: undefined,
  width: 240,
  minHeight: "100%",
  borderRadius: 24,
  flexDirection: "column",
  alignSelf: "flex-start",
  margin: 24,
  padding: 16
}
```

- [ ] **Step 4: Run targeted tests**

Run: `npm test -- --runInBand src/components/layout/__tests__/BottomNav.test.tsx __tests__/app.smoke.test.tsx`
Expected: PASS with navigation test green and app smoke still rendering storefront sections

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.styles.layout.ts src/components/layout/AppHeader.tsx src/components/layout/BottomNav.tsx src/components/layout/__tests__/BottomNav.test.tsx __tests__/app.smoke.test.tsx
git commit -m "feat(shell): add adaptive mobile and desktop navigation"
```

### Task 3: Introduce shared shadcn-inspired UI primitives

**Files:**
- Create: `src/components/ui/AppButton.tsx`
- Create: `src/components/ui/AppCard.tsx`
- Create: `src/components/ui/AppField.tsx`
- Create: `src/components/ui/PageContainer.tsx`
- Modify: `src/App.styles.components.ts`
- Test: `src/pages/storefront/__tests__/HomeScreen.test.tsx`

- [ ] **Step 1: Write the failing UI primitive consumer test**

```ts
import { render, screen } from "@testing-library/react-native";

import { HomeScreen } from "../HomeScreen";

describe("HomeScreen", () => {
  it("renders the storefront hero and featured sections through shared UI primitives", () => {
    render(
      <HomeScreen
        isLoading={false}
        featuredProducts={[]}
        onOpenCategory={jest.fn()}
        onOpenProduct={jest.fn()}
      />
    );

    expect(screen.getByText("Categorias")).toBeTruthy();
    expect(screen.getByText("Mais Vendidos")).toBeTruthy();
    expect(screen.getByText("Comprar Agora")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails after swapping imports**

Run: `npm test -- --runInBand src/pages/storefront/__tests__/HomeScreen.test.tsx`
Expected: FAIL once `HomeScreen` imports `AppButton` or `AppCard` before those files exist

- [ ] **Step 3: Implement the primitives and shared visual styles**

`src/components/ui/AppButton.tsx`
```tsx
import { Pressable, Text } from "react-native";

import styles from "../../App.styles";

type AppButtonProps = {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  onPress: () => void;
  disabled?: boolean;
};

export function AppButton({ label, variant = "primary", onPress, disabled = false }: AppButtonProps) {
  const buttonStyle =
    variant === "primary"
      ? styles.primaryActionButton
      : variant === "secondary"
        ? styles.secondaryActionButton
        : styles.ghostActionButton;

  const textStyle =
    variant === "primary"
      ? styles.primaryActionButtonText
      : variant === "secondary"
        ? styles.secondaryActionButtonText
        : styles.ghostActionButtonText;

  return (
    <Pressable disabled={disabled} style={[buttonStyle, disabled ? styles.actionButtonDisabled : null]} onPress={onPress}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}
```

`src/components/ui/AppCard.tsx`
```tsx
import type { PropsWithChildren } from "react";
import { View } from "react-native";

import styles from "../../App.styles";

export function AppCard({ children }: PropsWithChildren) {
  return <View style={styles.summaryCard}>{children}</View>;
}
```

`src/components/ui/AppField.tsx`
```tsx
import { Text, TextInput, View } from "react-native";

import styles from "../../App.styles";

type AppFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export function AppField({ label, value, onChangeText, placeholder }: AppFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}
```

`src/components/ui/PageContainer.tsx`
```tsx
import type { PropsWithChildren } from "react";
import { View, useWindowDimensions } from "react-native";

import styles from "../../App.styles";
import { isDesktopViewport } from "../../lib/responsive";

export function PageContainer({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const isDesktop = isDesktopViewport(width);

  return <View style={[styles.stackScreen, isDesktop ? styles.stackScreenDesktop : null]}>{children}</View>;
}
```

`src/App.styles.components.ts`
```ts
fieldGroup: {
  gap: 6
},
fieldLabel: {
  color: theme.colors.slate700,
  fontSize: 13,
  fontWeight: "600"
},
ghostActionButton: {
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 10,
  backgroundColor: theme.colors.surfaceMuted,
  borderWidth: 1,
  borderColor: theme.colors.borderSoft,
  alignItems: "center"
},
ghostActionButtonText: {
  color: theme.colors.slate800,
  fontSize: 13,
  fontWeight: "700"
},
actionButtonDisabled: {
  opacity: 0.6
},
stackScreenDesktop: {
  maxWidth: 1200,
  width: "100%",
  alignSelf: "center",
  paddingHorizontal: 24,
  paddingTop: 24
}
```

- [ ] **Step 4: Run targeted tests**

Run: `npm test -- --runInBand src/pages/storefront/__tests__/HomeScreen.test.tsx __tests__/app.smoke.test.tsx`
Expected: PASS with storefront hero and section labels still present

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/AppButton.tsx src/components/ui/AppCard.tsx src/components/ui/AppField.tsx src/components/ui/PageContainer.tsx src/App.styles.components.ts src/pages/storefront/__tests__/HomeScreen.test.tsx __tests__/app.smoke.test.tsx
git commit -m "feat(ui): add shared shadcn-inspired presentation primitives"
```

### Task 4: Refactor storefront screens for responsive layout

**Files:**
- Modify: `src/pages/storefront/HomeScreen.tsx`
- Modify: `src/pages/storefront/ProductScreen.tsx`
- Modify: `src/pages/storefront/CartScreen.tsx`
- Modify: `src/pages/storefront/CheckoutScreen.tsx`
- Modify: `src/App.styles.layout.ts`
- Modify: `src/pages/storefront/__tests__/CartScreen.test.tsx`
- Modify: `src/pages/storefront/__tests__/CheckoutScreen.test.tsx`
- Modify: `src/pages/storefront/__tests__/ProductScreen.test.tsx`

- [ ] **Step 1: Extend the failing storefront tests before the refactor**

```ts
// CartScreen.test.tsx
expect(screen.getByText("Resumo do pedido")).toBeTruthy();
expect(screen.getByText("Cupom de Desconto")).toBeTruthy();

// CheckoutScreen.test.tsx
expect(screen.getByText("Finalizar Compra")).toBeTruthy();
expect(screen.getByText("Revisar pedido")).toBeTruthy();

// ProductScreen.test.tsx
expect(screen.getByText("Personalizacao disponivel")).toBeTruthy();
expect(screen.getByText("Adicionar nome")).toBeTruthy();
```

- [ ] **Step 2: Run storefront tests to verify the baseline**

Run: `npm test -- --runInBand src/pages/storefront/__tests__/CartScreen.test.tsx src/pages/storefront/__tests__/CheckoutScreen.test.tsx src/pages/storefront/__tests__/ProductScreen.test.tsx`
Expected: At least one FAIL after the screen markup is updated to use the new responsive wrappers

- [ ] **Step 3: Implement the responsive storefront layouts**

`src/pages/storefront/HomeScreen.tsx`
```tsx
import { useWindowDimensions } from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { PageContainer } from "../../components/ui/PageContainer";
import { resolveResponsiveColumns } from "../../lib/responsive";

export function HomeScreen({ isLoading, featuredProducts, onOpenCategory, onOpenProduct }: HomeScreenProps & { isLoading?: boolean }) {
  const { width } = useWindowDimensions();
  const featuredColumns = resolveResponsiveColumns(width, { mobile: 1, tablet: 2, desktop: 4 });

  return (
    <PageContainer>
      <View style={[styles.heroSection, width >= 1024 ? styles.heroSectionDesktop : null]}>
        {/* existing hero image and copy */}
        <View style={[styles.heroButtons, width >= 768 ? styles.heroButtonsDesktop : null]}>
          <AppButton label="Comprar Agora" onPress={() => onOpenCategory("nacionais")} />
          <AppButton label="Ver Selecoes" variant="secondary" onPress={() => onOpenCategory("selecoes")} />
        </View>
      </View>

      <View style={[styles.productGrid, { gap: 16 }]}> 
        {featuredProducts.map((product) => (
          <Pressable key={product.id} style={[styles.productCard, { width: `${100 / featuredColumns - 2}%` }]} onPress={() => onOpenProduct(product.id)}>
            {/* existing product card body */}
          </Pressable>
        ))}
      </View>
    </PageContainer>
  );
}
```

`src/pages/storefront/ProductScreen.tsx`
```tsx
import { useWindowDimensions } from "react-native";
import { PageContainer } from "../../components/ui/PageContainer";
import { AppButton } from "../../components/ui/AppButton";

const { width } = useWindowDimensions();
const isDesktop = width >= 1024;

return (
  <PageContainer>
    <View style={[styles.productDetailLayout, isDesktop ? styles.productDetailLayoutDesktop : null]}>
      <View style={styles.productGalleryColumn}>{/* existing images */}</View>
      <View style={styles.productInfoColumn}>{/* existing pricing, size, personalization */}</View>
    </View>
    <AppButton label="Adicionar ao carrinho" onPress={handleAddToCart} />
  </PageContainer>
);
```

`src/pages/storefront/CartScreen.tsx`
```tsx
import { useWindowDimensions } from "react-native";
import { AppCard } from "../../components/ui/AppCard";
import { AppButton } from "../../components/ui/AppButton";
import { PageContainer } from "../../components/ui/PageContainer";

const { width } = useWindowDimensions();
const isDesktop = width >= 1024;

return (
  <PageContainer>
    <View style={[styles.cartLayout, isDesktop ? styles.cartLayoutDesktop : null]}>
      <View style={styles.cartItemsColumn}>{/* existing item rows */}</View>
      <View style={styles.cartSummaryColumn}>
        <AppCard>
          <Text style={styles.summaryTitle}>Resumo do pedido</Text>
          {/* existing subtotal, shipping, discount, total */}
        </AppCard>
      </View>
    </View>
  </PageContainer>
);
```

`src/pages/storefront/CheckoutScreen.tsx`
```tsx
import { useWindowDimensions } from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { AppField } from "../../components/ui/AppField";
import { PageContainer } from "../../components/ui/PageContainer";

const { width } = useWindowDimensions();
const isDesktop = width >= 1024;

return (
  <PageContainer>
    <View style={[styles.checkoutLayout, isDesktop ? styles.checkoutLayoutDesktop : null]}>
      <View style={styles.checkoutMainColumn}>
        {/* existing steps */}
        {!user && !needsSavedAddressFromProfile ? (
          <>
            <AppField label="CEP" value={guestAddress.cep} onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, cep: value }))} placeholder="CEP" />
            <AppField label="Rua" value={guestAddress.street} onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, street: value }))} placeholder="Rua" />
          </>
        ) : null}
      </View>
      <View style={styles.checkoutSummaryColumn}>
        <AppCard>
          <Text style={styles.summaryTitle}>Revisar pedido</Text>
          {/* existing totals and action buttons */}
        </AppCard>
      </View>
    </View>
  </PageContainer>
);
```

`src/App.styles.layout.ts`
```ts
heroSectionDesktop: {
  minHeight: 520,
  marginTop: 24
},
heroButtonsDesktop: {
  flexDirection: "row",
  alignItems: "center"
},
productDetailLayout: {
  gap: 16
},
productDetailLayoutDesktop: {
  flexDirection: "row",
  alignItems: "flex-start"
},
productGalleryColumn: {
  flex: 1,
  gap: 12
},
productInfoColumn: {
  flex: 1,
  gap: 12
},
cartLayout: {
  gap: 16
},
cartLayoutDesktop: {
  flexDirection: "row",
  alignItems: "flex-start"
},
cartItemsColumn: {
  flex: 2,
  gap: 16
},
cartSummaryColumn: {
  flex: 1,
  gap: 16
},
checkoutLayout: {
  gap: 16
},
checkoutLayoutDesktop: {
  flexDirection: "row",
  alignItems: "flex-start"
},
checkoutMainColumn: {
  flex: 2,
  gap: 16
},
checkoutSummaryColumn: {
  flex: 1,
  gap: 16
}
```

- [ ] **Step 4: Run storefront tests to verify they pass**

Run: `npm test -- --runInBand src/pages/storefront/__tests__/CartScreen.test.tsx src/pages/storefront/__tests__/CheckoutScreen.test.tsx src/pages/storefront/__tests__/ProductScreen.test.tsx src/pages/storefront/__tests__/HomeScreen.test.tsx`
Expected: PASS with storefront flows preserved and new summary headings present

- [ ] **Step 5: Commit**

```bash
git add src/pages/storefront/HomeScreen.tsx src/pages/storefront/ProductScreen.tsx src/pages/storefront/CartScreen.tsx src/pages/storefront/CheckoutScreen.tsx src/App.styles.layout.ts src/pages/storefront/__tests__/CartScreen.test.tsx src/pages/storefront/__tests__/CheckoutScreen.test.tsx src/pages/storefront/__tests__/ProductScreen.test.tsx src/pages/storefront/__tests__/HomeScreen.test.tsx
git commit -m "feat(storefront): make key shopping flows responsive"
```

### Task 5: Refactor admin screens for desktop-first web layout without breaking mobile

**Files:**
- Modify: `src/pages/admin/AdminDashboardScreen.tsx`
- Modify: `src/pages/admin/AdminProductsScreen.tsx`
- Modify: `src/App.styles.layout.ts`
- Test: `src/pages/admin/__tests__/AdminDashboardScreen.test.tsx`

- [ ] **Step 1: Write the failing admin dashboard test**

```ts
import { render, screen } from "@testing-library/react-native";

import { AdminDashboardScreen } from "../AdminDashboardScreen";

describe("AdminDashboardScreen", () => {
  it("renders dashboard KPI cards and quick actions", () => {
    render(
      <AdminDashboardScreen
        onBack={jest.fn()}
        onOpenOrders={jest.fn()}
        onOpenProducts={jest.fn()}
        products={[]}
      />
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Ações Rápidas")).toBeTruthy();
    expect(screen.getByText("Ver Pedidos")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails once layout extraction starts**

Run: `npm test -- --runInBand src/pages/admin/__tests__/AdminDashboardScreen.test.tsx`
Expected: FAIL after `AdminDashboardScreen` is updated to import new responsive wrappers before the test is aligned

- [ ] **Step 3: Implement the responsive admin composition**

`src/pages/admin/AdminDashboardScreen.tsx`
```tsx
import { useWindowDimensions, View, Text, ScrollView, Pressable } from "react-native";
import { AppCard } from "../../components/ui/AppCard";
import { AppButton } from "../../components/ui/AppButton";
import { PageContainer } from "../../components/ui/PageContainer";

export function AdminDashboardScreen({ onBack, onOpenOrders, onOpenProducts, products }: AdminDashboardScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <PageContainer>
      <Pressable onPress={onBack}><Text style={styles.backLink}>Voltar</Text></Pressable>
      <Text style={styles.screenTitle}>Dashboard</Text>
      <ScrollView>
        <View style={[styles.adminDashboardGrid, isDesktop ? styles.adminDashboardGridDesktop : null]}>
          <AppCard>{/* KPI 1 */}</AppCard>
          <AppCard>{/* KPI 2 */}</AppCard>
          <AppCard>{/* KPI 3 */}</AppCard>
          <AppCard>{/* KPI 4 */}</AppCard>
        </View>
        <View style={[styles.adminInsightsLayout, isDesktop ? styles.adminInsightsLayoutDesktop : null]}>
          <AppCard>{/* receita */}</AppCard>
          <AppCard>{/* pedidos */}</AppCard>
        </View>
        <AppCard>
          <Text style={styles.summaryTitle}>Ações Rápidas</Text>
          <AppButton label="Ver Pedidos" onPress={onOpenOrders} />
          <AppButton label="Gerenciar Produtos" variant="secondary" onPress={onOpenProducts} />
        </AppCard>
      </ScrollView>
    </PageContainer>
  );
}
```

`src/pages/admin/AdminProductsScreen.tsx`
```tsx
const { width } = useWindowDimensions();
const isDesktop = width >= 1024;

return (
  <View style={[styles.adminProductsLayout, isDesktop ? styles.adminProductsLayoutDesktop : null]}>
    <View style={styles.adminProductsListColumn}>{/* search, filters, product list */}</View>
    <View style={styles.adminProductsFormColumn}>{/* create/edit modal content when open */}</View>
  </View>
);
```

`src/App.styles.layout.ts`
```ts
adminDashboardGrid: {
  gap: 12,
  flexDirection: "row",
  flexWrap: "wrap"
},
adminDashboardGridDesktop: {
  justifyContent: "space-between"
},
adminInsightsLayout: {
  gap: 16,
  marginTop: 16
},
adminInsightsLayoutDesktop: {
  flexDirection: "row",
  alignItems: "flex-start"
},
adminProductsLayout: {
  gap: 16
},
adminProductsLayoutDesktop: {
  flexDirection: "row",
  alignItems: "flex-start"
},
adminProductsListColumn: {
  flex: 2,
  gap: 16
},
adminProductsFormColumn: {
  flex: 1,
  gap: 16
}
```

- [ ] **Step 4: Run admin tests plus app route coverage**

Run: `npm test -- --runInBand src/pages/admin/__tests__/AdminDashboardScreen.test.tsx src/pages/__tests__/AppRouteContent.test.ts`
Expected: PASS with admin dashboard still rendering and route logic unchanged

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminDashboardScreen.tsx src/pages/admin/AdminProductsScreen.tsx src/App.styles.layout.ts src/pages/admin/__tests__/AdminDashboardScreen.test.tsx src/pages/__tests__/AppRouteContent.test.ts
git commit -m "feat(admin): make dashboard and product management responsive"
```

### Task 6: Verify the full refactor and fix regressions before claiming done

**Files:**
- Modify: any file required to fix regressions uncovered by verification
- Test: `__tests__/app.smoke.test.tsx`
- Test: `src/pages/__tests__/AppRouteContent.test.ts`
- Test: `src/pages/storefront/__tests__/CartScreen.test.tsx`
- Test: `src/pages/storefront/__tests__/CheckoutScreen.test.tsx`
- Test: `src/pages/storefront/__tests__/ProductScreen.test.tsx`
- Test: `src/pages/storefront/__tests__/HomeScreen.test.tsx`
- Test: `src/pages/admin/__tests__/AdminDashboardScreen.test.tsx`
- Test: `src/lib/__tests__/responsive.test.ts`

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test -- --runInBand`
Expected: PASS with all existing and newly added tests green

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS with no new ESLint errors

- [ ] **Step 3: Run the app in web mode and manually verify breakpoints**

Run: `npm run dev`
Expected: Expo starts web server successfully and prints a local URL

Manual checklist:
```txt
- 390px: header, bottom nav, cart, checkout, and admin remain usable without clipped actions
- 768px: grids reflow cleanly and forms do not collapse awkwardly
- 1280px: desktop shell, storefront grids, checkout summary, and admin panels use width efficiently
- Home, Product, Cart, Checkout, Dashboard, and Admin Products preserve their current flows
```

- [ ] **Step 4: Fix any regressions found during verification and rerun the exact failing command**

```bash
# Example loop
npm test -- --runInBand src/pages/storefront/__tests__/CheckoutScreen.test.tsx
npm run lint
```

Expected: each previously failing command turns green before moving on

- [ ] **Step 5: Commit the verified final state**

```bash
git add src/App.tsx src/App.styles.layout.ts src/App.styles.components.ts src/lib/responsive.ts src/lib/__tests__/responsive.test.ts src/components/layout/AppHeader.tsx src/components/layout/BottomNav.tsx src/components/layout/__tests__/BottomNav.test.tsx src/components/ui/AppButton.tsx src/components/ui/AppCard.tsx src/components/ui/AppField.tsx src/components/ui/PageContainer.tsx src/pages/storefront/HomeScreen.tsx src/pages/storefront/ProductScreen.tsx src/pages/storefront/CartScreen.tsx src/pages/storefront/CheckoutScreen.tsx src/pages/admin/AdminDashboardScreen.tsx src/pages/admin/AdminProductsScreen.tsx src/pages/storefront/__tests__/HomeScreen.test.tsx src/pages/storefront/__tests__/CartScreen.test.tsx src/pages/storefront/__tests__/CheckoutScreen.test.tsx src/pages/storefront/__tests__/ProductScreen.test.tsx src/pages/admin/__tests__/AdminDashboardScreen.test.tsx __tests__/app.smoke.test.tsx src/pages/__tests__/AppRouteContent.test.ts
git commit -m "feat(web): refactor shared ui for responsive web layouts"
```

## Spec coverage check
- Shared responsive foundation: Task 1
- Shared app shell and adaptive navigation: Task 2
- Shared shadcn-inspired component layer: Task 3
- Storefront coverage for catálogo, customização, cart, and checkout: Task 4
- Admin coverage for dashboard and product management patterns: Task 5
- Validation across mobile, tablet, desktop, tests, and manual review: Task 6

## Placeholder scan
- No `TODO`, `TBD`, or “similar to task N” placeholders remain.
- Each task names exact files and exact commands.
- Each code step includes concrete code to add or shape the change.
