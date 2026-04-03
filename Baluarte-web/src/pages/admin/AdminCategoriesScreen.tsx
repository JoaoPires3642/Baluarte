import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import { createCategory } from "../../lib/admin-creators";
import { validateCategoryInput } from "../../lib/admin-validation";
import { AdminBlockedScreen } from "./AdminBlockedScreen";
import type { AdminCategoriesScreenProps } from "./types";

export function AdminCategoriesScreen({ user, categories, teams, onBack, onUpdateCategories }: AdminCategoriesScreenProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");

  if (!user || user.role !== "admin") {
    return <AdminBlockedScreen onBack={onBack} message="Acesso admin necessario para categorias." />;
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar ao dashboard</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Categorias</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Nova categoria</Text>
        <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor="#9ca3af" />
        <TextInput style={styles.formInput} value={logo} onChangeText={setLogo} placeholder="URL do logo" placeholderTextColor="#9ca3af" />
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => {
            const result = validateCategoryInput(name, logo, categories);
            if (!result.ok) {
              Alert.alert("Campos invalidos", result.message);
              return;
            }

            const newCategory = createCategory(name, logo);
            onUpdateCategories([...categories, newCategory]);
            setName("");
            setLogo("");
          }}
        >
          <Text style={styles.primaryActionButtonText}>Adicionar categoria</Text>
        </Pressable>
      </View>

      {categories.map((category) => {
        const usage = teams.filter((team) => team.category === category.slug).length;
        return (
          <View key={category.slug} style={styles.summaryCard}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryTitle}>{category.name}</Text>
              <Text style={styles.summaryValue}>{usage} time(s)</Text>
            </View>
            <Text style={styles.screenDescription}>{category.slug}</Text>
            <Text style={styles.screenDescription} numberOfLines={1}>{category.logo}</Text>
            <Pressable
              style={styles.dangerButton}
              onPress={() => {
                if (usage > 0) {
                  Alert.alert("Nao permitido", `Existem ${usage} time(s) nessa categoria.`);
                  return;
                }
                onUpdateCategories(categories.filter((item) => item.slug !== category.slug));
              }}
            >
              <Text style={styles.dangerButtonText}>Remover</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
