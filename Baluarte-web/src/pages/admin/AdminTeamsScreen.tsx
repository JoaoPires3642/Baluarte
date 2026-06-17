import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import { createTeam } from "../../lib/admin-creators";
import { slugifyEntity } from "../../lib/admin-utils";
import { validateTeamInput } from "../../lib/admin-validation";
import { AdminBlockedScreen } from "./AdminBlockedScreen";
import { SimpleFormModal } from "../../components/admin/SimpleFormModal";
import type { AdminTeamsScreenProps, CategoryValue } from "./types";

export function AdminTeamsScreen({ user, categories, teams, products, onBack, onUpdateTeams }: AdminTeamsScreenProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [league, setLeague] = useState("");
  const [category, setCategory] = useState<CategoryValue>(categories[0]?.slug ?? "nacionais");
  const [search, setSearch] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingLogo, setEditingLogo] = useState("");
  const [editingLeague, setEditingLeague] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryValue>(categories[0]?.slug ?? "nacionais");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!user || user.role !== "admin") {
    return <AdminBlockedScreen onBack={onBack} message="Acesso admin necessario para times." />;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTeams = teams.filter((team) => {
    if (!normalizedSearch) {
      return true;
    }

    const searchable = `${team.name} ${team.id} ${team.league ?? ""} ${team.category}`.toLowerCase();
    return searchable.includes(normalizedSearch);
  });

  const linkedProductsCount = (teamId: string): number => {
    return products.filter((product) => product.teamId === teamId).length;
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / itemsPerPage));

  const resetCreateForm = () => {
    setName("");
    setLeague("");
    setLogo("");
    setCategory(categories[0]?.slug ?? "nacionais");
    setIsCreateModalOpen(false);
  };

  const resetEditForm = () => {
    setEditingTeamId(null);
    setEditingName("");
    setEditingLogo("");
    setEditingLeague("");
    setEditingCategory(categories[0]?.slug ?? "nacionais");
    setIsEditModalOpen(false);
  };

  const handleCreateTeam = () => {
    const id = slugifyEntity(name);
    const result = validateTeamInput(name, logo, id, teams);
    if (!result.ok) {
      Alert.alert("Campos invalidos", result.message);
      return;
    }

    const newTeam = createTeam(name, logo, league, category);
    onUpdateTeams([newTeam, ...teams]);
    resetCreateForm();
  };

  const startEditing = (teamId: string) => {
    const team = teams.find((item) => item.id === teamId);
    if (!team) {
      return;
    }

    setEditingTeamId(team.id);
    setEditingName(team.name);
    setEditingLogo(team.logo);
    setEditingLeague(team.league ?? "");
    setEditingCategory(team.category);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTeamId) {
      return;
    }

    const result = validateTeamInput(
      editingName,
      editingLogo,
      editingTeamId,
      teams.filter((team) => team.id !== editingTeamId)
    );
    if (!result.ok) {
      Alert.alert("Campos invalidos", result.message);
      return;
    }

    onUpdateTeams(
      teams.map((team) =>
        team.id === editingTeamId
          ? {
              ...team,
              name: editingName.trim(),
              logo: editingLogo.trim(),
              league: editingLeague.trim() || undefined,
              category: editingCategory
            }
          : team
      )
    );
    resetEditForm();
  };

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar ao dashboard</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Times</Text>

      <View style={[styles.summaryCard, styles.adminProductCard]}>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryTitle}>Resumo</Text>
          <Text style={styles.summaryValue}>{teams.length} time(s)</Text>
        </View>
        <TextInput
          style={styles.formInput}
          value={search}
          onChangeText={() => {
            setSearch(arguments[0]);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nome, id, liga ou categoria"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={[styles.summaryCard, styles.adminProductCard]}>
        <Pressable style={styles.primaryActionButton} onPress={() => setIsCreateModalOpen(true)}>
          <Text style={styles.primaryActionButtonText}>Adicionar time</Text>
        </Pressable>
      </View>

      {paginatedTeams.map((team) => {
        const linkedProducts = linkedProductsCount(team.id);

        return (
          <View key={team.id} style={[styles.summaryCard, styles.adminProductCard]}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryTitle}>{team.name}</Text>
              <Text style={styles.summaryValue}>{linkedProducts} produto(s)</Text>
            </View>
            <Text style={styles.screenDescription}>ID: {team.id}</Text>
            <Text style={styles.screenDescription}>Categoria: {team.category}</Text>
            <Text style={styles.screenDescription}>{team.league ?? "Sem liga"}</Text>
            <View style={styles.inlineActionRow}>
              <Pressable style={styles.secondaryActionButton} onPress={() => startEditing(team.id)}>
                <Text style={styles.secondaryActionButtonText}>Editar</Text>
              </Pressable>
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
          </View>
        );
      })}

      {filteredTeams.length === 0 ? (
              <View style={[styles.summaryCard, styles.adminProductCard]}>
                <Text style={styles.screenDescription}>Nenhum time encontrado para o filtro informado.</Text>
              </View>
            ) : null}

            {totalPages > 1 ? (
              <View style={[styles.summaryCard, styles.adminProductCard]}>
                <View style={styles.inlineActionRow}>
                  <Pressable
                    style={[styles.secondaryActionButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <Text style={styles.secondaryActionButtonText}>← Anterior</Text>
                  </Pressable>
                  <Text style={styles.summaryValue}>
                    Página {currentPage} de {totalPages}
                  </Text>
                  <Pressable
                    style={[styles.secondaryActionButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]}
                    onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={styles.secondaryActionButtonText}>Próxima →</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

      <SimpleFormModal
        visible={isCreateModalOpen}
        title="Adicionar time"
        errors={[]}
        submitLabel="Adicionar"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTeam}
      >
        <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="Nome do time" placeholderTextColor="#9ca3af" />
        <TextInput style={styles.formInput} value={league} onChangeText={setLeague} placeholder="Liga (opcional)" placeholderTextColor="#9ca3af" />
        <TextInput style={styles.formInput} value={logo} onChangeText={setLogo} placeholder="URL do escudo" placeholderTextColor="#9ca3af" />
        <View style={styles.chipsRowWrap}>
          {categories.map((item) => (
            <Pressable
              key={item.slug}
              style={[styles.filterChip, category === item.slug ? styles.filterChipActive : null]}
              onPress={() => setCategory(item.slug)}
            >
              <Text style={[styles.filterChipText, category === item.slug ? styles.filterChipTextActive : null]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      </SimpleFormModal>

      <SimpleFormModal
        visible={isEditModalOpen}
        title="Editar time"
        errors={[]}
        submitLabel="Salvar"
        onClose={resetEditForm}
        onSubmit={handleSaveEdit}
      >
        <TextInput
          style={styles.formInput}
          value={editingName}
          onChangeText={setEditingName}
          placeholder="Nome do time"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.formInput}
          value={editingLeague}
          onChangeText={setEditingLeague}
          placeholder="Liga (opcional)"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.formInput}
          value={editingLogo}
          onChangeText={setEditingLogo}
          placeholder="URL do escudo"
          placeholderTextColor="#9ca3af"
        />
        <View style={styles.chipsRowWrap}>
          {categories.map((item) => (
            <Pressable
              key={`${editingTeamId}-${item.slug}`}
              style={[styles.filterChip, editingCategory === item.slug ? styles.filterChipActive : null]}
              onPress={() => setEditingCategory(item.slug)}
            >
              <Text style={[styles.filterChipText, editingCategory === item.slug ? styles.filterChipTextActive : null]}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      </SimpleFormModal>
    </View>
  );
}
