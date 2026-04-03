import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import { createTeam } from "../../lib/admin-creators";
import { slugifyEntity } from "../../lib/admin-utils";
import { validateTeamInput } from "../../lib/admin-validation";
import { AdminBlockedScreen } from "./AdminBlockedScreen";
import type { AdminTeamsScreenProps, CategoryValue } from "./types";

export function AdminTeamsScreen({ user, categories, teams, products, onBack, onUpdateTeams }: AdminTeamsScreenProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [league, setLeague] = useState("");
  const [category, setCategory] = useState<CategoryValue>(categories[0]?.slug ?? "nacionais");

  if (!user || user.role !== "admin") {
    return <AdminBlockedScreen onBack={onBack} message="Acesso admin necessario para times." />;
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar ao dashboard</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Times</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Novo time</Text>
        <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="Nome do time" placeholderTextColor="#9ca3af" />
        <TextInput style={styles.formInput} value={league} onChangeText={setLeague} placeholder="Liga (opcional)" placeholderTextColor="#9ca3af" />
        <TextInput style={styles.formInput} value={logo} onChangeText={setLogo} placeholder="URL do escudo" placeholderTextColor="#9ca3af" />
        <View style={styles.chipsRowWrap}>
          {categories.map((item) => (
            <Pressable key={item.slug} style={[styles.filterChip, category === item.slug ? styles.filterChipActive : null]} onPress={() => setCategory(item.slug)}>
              <Text style={[styles.filterChipText, category === item.slug ? styles.filterChipTextActive : null]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => {
            const id = slugifyEntity(name);
            const result = validateTeamInput(name, logo, id, teams);
            if (!result.ok) {
              Alert.alert("Campos invalidos", result.message);
              return;
            }

            const newTeam = createTeam(name, logo, league, category);
            onUpdateTeams([
              newTeam,
              ...teams
            ]);
            setName("");
            setLeague("");
            setLogo("");
          }}
        >
          <Text style={styles.primaryActionButtonText}>Adicionar time</Text>
        </Pressable>
      </View>

      {teams.map((team) => {
        const linkedProducts = products.filter((product) => product.teamId === team.id).length;
        return (
          <View key={team.id} style={styles.summaryCard}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryTitle}>{team.name}</Text>
              <Text style={styles.summaryValue}>{linkedProducts} produto(s)</Text>
            </View>
            <Text style={styles.screenDescription}>ID: {team.id}</Text>
            <Text style={styles.screenDescription}>Categoria: {team.category}</Text>
            <Text style={styles.screenDescription}>{team.league ?? "Sem liga"}</Text>
            <Pressable
              style={styles.dangerButton}
              onPress={() => {
                if (linkedProducts > 0) {
                  Alert.alert("Nao permitido", `Existem ${linkedProducts} produto(s) vinculados ao time.`);
                  return;
                }
                onUpdateTeams(teams.filter((item) => item.id !== team.id));
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
