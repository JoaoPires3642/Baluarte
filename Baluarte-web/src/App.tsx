import 'react-native-reanimated';

import { ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AppHeader } from "./components/layout/AppHeader";
import { BottomNav } from "./components/layout/BottomNav";
import { AppRouteContent } from "./pages/AppRouteContent";
import { useAppState } from "./hooks/useAppState";
import { ToastProvider } from "./hooks/useToast";
import { isDesktopViewport } from "./lib/responsive";
import styles from "./App.styles";
import { desktopStyles } from "./App.styles.layout";
export default function App() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isDesktopViewport(width);
  const state = useAppState();
  const { route, setRoute, user, handleLogout, inAdminArea, cartCount, accountLabel } = state;
  const isAdminUser = user?.role === "admin";

  return (
    <ToastProvider>
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        <StatusBar style="dark" translucent={false} backgroundColor="#ffffff" />
        <View style={[styles.appShell, isDesktop && styles.appShellDesktop, isDesktop && { flexDirection: "row" }]}>
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

          <View style={[styles.contentShell, isDesktop && styles.contentShellDesktop]}>
            <ScrollView 
              style={styles.scroll} 
              contentContainerStyle={[
                styles.container, 
                isDesktop && styles.containerDesktop
              ]}
            >
              <AppRouteContent 
                state={state} 
                isDesktop={isDesktop}
              />
            </ScrollView>

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
          </View>
        </View>
      </SafeAreaView>
    </ToastProvider>
  );
}