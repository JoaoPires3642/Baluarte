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

type NavItem = {
  active: boolean;
  label: string;
  onPress: () => void;
};

function NavButton({ active, label, onPress }: NavItem) {
  return (
    <Pressable style={[styles.bottomNavItem, active ? styles.bottomNavItemActive : null]} onPress={onPress}>
      <Text style={[styles.bottomNavText, active ? styles.bottomNavTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

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
    const items: NavItem[] = [
      { active: isAdminActive, label: "Painel", onPress: onPressAccount },
      { active: isAdminProductsActive, label: "Produtos", onPress: onPressAdminProducts },
      { active: isAdminOrdersActive, label: "Pedidos", onPress: onPressAdminOrders },
      { active: isAdminCouponsActive, label: "Cupons", onPress: onPressAdminCoupons }
    ];

    return (
      <View style={navStyle}>
        {items.map((item) => (
          <NavButton key={item.label} active={item.active} label={item.label} onPress={item.onPress} />
        ))}
      </View>
    );
  }

  const items: NavItem[] = [
    { active: isHomeActive, label: "Inicio", onPress: onPressHome },
    { active: isCartActive, label: `Carrinho${cartCount > 0 ? ` (${cartCount})` : ""}`, onPress: onPressCart },
    { active: isOrdersActive, label: "Pedidos", onPress: onPressOrders },
    { active: isAdminActive, label: accountLabel, onPress: onPressAccount }
  ];

  return (
    <View style={navStyle}>
      {items.map((item) => (
        <NavButton key={item.label} active={item.active} label={item.label} onPress={item.onPress} />
      ))}
    </View>
  );
}