import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import { AddressManager } from "../../components/storefront/AddressManager";
import type { Address } from "../../lib/types";
import type { ProfileScreenProps } from "./types";

export function ProfileScreen({ user, ordersCount, onBack, onLogin, onUpdateAddress, onOpenOrders }: ProfileScreenProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultAddressId, setDefaultAddressId] = useState<string | undefined>();

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      setAddresses(user.addresses);
      setDefaultAddressId(user.defaultAddressId);
    } else if (user?.defaultAddress) {
      // Migration: user has old single address format
      const migratedAddr: Address = {
        id: "addr-default",
        label: "Principal",
        ...user.defaultAddress
      };
      setAddresses([migratedAddr]);
      setDefaultAddressId("addr-default");
    }
  }, [user]);

  const handleAddAddress = (address: Address) => {
    const newAddresses = [...addresses, address];
    setAddresses(newAddresses);
    // Persist to parent via onUpdateAddress with first address
    onUpdateAddress(newAddresses[0]);
  };

  const handleUpdateAddress = (address: Address) => {
    const updated = addresses.map((a) => (a.id === address.id ? address : a));
    setAddresses(updated);
    onUpdateAddress(updated[0]);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (defaultAddressId === id && updated.length > 0) {
      setDefaultAddressId(updated[0].id);
    }
    if (updated.length > 0) {
      onUpdateAddress(updated[0]);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddressId(id);
    const defaultAddr = addresses.find((a) => a.id === id);
    if (defaultAddr) {
      onUpdateAddress(defaultAddr);
    }
  };

  if (!user) {
    return (
      <View style={styles.stackScreen}>
        <Text style={styles.screenTitle}>Perfil</Text>
        <Text style={styles.screenDescription}>Faca login para acessar seus dados.</Text>
        <Pressable style={styles.primaryActionButton} onPress={onLogin}>
          <Text style={styles.primaryActionButtonText}>Entrar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Meu Perfil</Text>
      <Text style={styles.screenDescription}>Gerencie seus dados e endereco de entrega.</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Dados da conta</Text>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryKey}>Nome</Text>
          <Text style={styles.summaryValue}>{user.name}</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryKey}>Email</Text>
          <Text style={styles.summaryValue}>{user.email}</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryKey}>Pedidos</Text>
          <Text style={styles.summaryValue}>{ordersCount}</Text>
        </View>
        <Pressable style={styles.secondaryActionButton} onPress={onOpenOrders}>
          <Text style={styles.secondaryActionButtonText}>Ver meus pedidos</Text>
        </Pressable>
      </View>

      <AddressManager
        addresses={addresses}
        defaultAddressId={defaultAddressId}
        onAddAddress={handleAddAddress}
        onUpdateAddress={handleUpdateAddress}
        onDeleteAddress={handleDeleteAddress}
        onSetDefault={handleSetDefault}
      />
    </View>
  );
}
