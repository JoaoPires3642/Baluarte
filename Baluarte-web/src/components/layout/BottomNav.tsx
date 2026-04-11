import { Pressable, Text, View } from "react-native";

import styles from "../../App.styles";

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

export function BottomNav({
  isDesktop = false,
  isAdminUser,
  isHomeActive,
  isCartActive,
  isOrdersActive,
  isAdminActive,
  isAdminProductsActive,
  isAdminOrdersActive,
  isAdminCouponsActive,
  cartCount,
  accountLabel,
  onPressHome,
  onPressCart,
  onPressOrders,
  onPressAccount,
  onPressAdminProducts,
  onPressAdminOrders,
  onPressAdminCoupons
}: BottomNavProps) {
  const navStyle = isDesktop ? styles.bottomNavDesktop : styles.bottomNav;
  
  if (isAdminUser) {
    return (
      <View style={navStyle}>
        <Pressable style={[styles.bottomNavItem, isAdminActive ? styles.bottomNavItemActive : null]} onPress={onPressAccount}>
          <Text style={[styles.bottomNavText, isAdminActive ? styles.bottomNavTextActive : null]}>Painel</Text>
        </Pressable>

        <Pressable style={[styles.bottomNavItem, isAdminProductsActive ? styles.bottomNavItemActive : null]} onPress={onPressAdminProducts}>
          <Text style={[styles.bottomNavText, isAdminProductsActive ? styles.bottomNavTextActive : null]}>Produtos</Text>
        </Pressable>

        <Pressable style={[styles.bottomNavItem, isAdminOrdersActive ? styles.bottomNavItemActive : null]} onPress={onPressAdminOrders}>
          <Text style={[styles.bottomNavText, isAdminOrdersActive ? styles.bottomNavTextActive : null]}>Pedidos</Text>
        </Pressable>

        <Pressable style={[styles.bottomNavItem, isAdminCouponsActive ? styles.bottomNavItemActive : null]} onPress={onPressAdminCoupons}>
          <Text style={[styles.bottomNavText, isAdminCouponsActive ? styles.bottomNavTextActive : null]}>Cupons</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={navStyle}>
      <Pressable style={[styles.bottomNavItem, isHomeActive ? styles.bottomNavItemActive : null]} onPress={onPressHome}>
        <Text style={[styles.bottomNavText, isHomeActive ? styles.bottomNavTextActive : null]}>Inicio</Text>
      </Pressable>

      <Pressable style={[styles.bottomNavItem, isCartActive ? styles.bottomNavItemActive : null]} onPress={onPressCart}>
        <Text style={[styles.bottomNavText, isCartActive ? styles.bottomNavTextActive : null]}>Carrinho{cartCount > 0 ? ` (${cartCount})` : ""}</Text>
      </Pressable>

      <Pressable style={[styles.bottomNavItem, isOrdersActive ? styles.bottomNavItemActive : null]} onPress={onPressOrders}>
        <Text style={[styles.bottomNavText, isOrdersActive ? styles.bottomNavTextActive : null]}>Pedidos</Text>
      </Pressable>

      <Pressable style={[styles.bottomNavItem, isAdminActive ? styles.bottomNavItemActive : null]} onPress={onPressAccount}>
        <Text style={[styles.bottomNavText, isAdminActive ? styles.bottomNavTextActive : null]}>{accountLabel}</Text>
      </Pressable>
    </View>
  );
}