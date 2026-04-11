import { Image, Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import type { User } from "../../lib/types";

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
      <View style={[styles.header, { paddingTop: Math.max(8, topInset + 6) }, isDesktop && styles.headerDesktop]}>
        <Pressable style={styles.headerBrand} onPress={onGoHome}>
          <Image source={require("../../../public/logo.png")} style={styles.brandLogo} resizeMode="contain" />
          <View style={styles.headerBrandTextWrap}>
            <Text style={styles.headerBrandName}>Baluarte</Text>
            <Text style={styles.headerBrandTagline}>futebol premium</Text>
          </View>
        </Pressable>

        <View style={[styles.headerActions, isDesktop && styles.headerActionsDesktop]}>
          {user ? (
            <>
              <Text style={styles.headerUserName} numberOfLines={1}>{user.name}</Text>
              <Pressable style={styles.navChip} onPress={onLogout}>
                <Text style={styles.navChipText}>Sair</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.navChip} onPress={onOpenLogin}>
                <Text style={styles.navChipText}>Entrar</Text>
              </Pressable>
              <Pressable style={styles.navChipPrimary} onPress={onOpenRegister}>
                <Text style={styles.navChipPrimaryText}>Cadastrar</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}