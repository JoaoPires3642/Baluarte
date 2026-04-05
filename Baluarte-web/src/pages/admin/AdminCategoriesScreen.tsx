import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import { createCategory } from "../../lib/admin-creators";
import { validateCategoryInput } from "../../lib/admin-validation";
import { AdminBlockedScreen } from "./AdminBlockedScreen";
import { SimpleFormModal } from "../../components/admin/SimpleFormModal";
import type { AdminCategoriesScreenProps } from "./types";

export function AdminCategoriesScreen({ user, categories, teams, onBack, onUpdateCategories }: AdminCategoriesScreenProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [search, setSearch] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingLogo, setEditingLogo] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!user || user.role !== "admin") {
    return <AdminBlockedScreen onBack={onBack} message="Acesso admin necessario para categorias." />;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    if (!normalizedSearch) {
      return true;
    }

    const searchable = `${category.name} ${category.slug}`.toLowerCase();
    return searchable.includes(normalizedSearch);
  });

  const linkedTeamsCount = (categorySlug: string): number => {
    return teams.filter((team) => team.category === categorySlug).length;
  };

  const resetCreateForm = () => {
    setName("");
    setLogo("");
    setIsCreateModalOpen(false);
  };

  const resetEditForm = () => {
    setEditingSlug(null);
    setEditingName("");
    setEditingLogo("");
    setIsEditModalOpen(false);
  };

  const handleCreateCategory = () => {
    const result = validateCategoryInput(name, logo, categories);
    if (!result.ok) {
      Alert.alert("Campos invalidos", result.message);
      return;
    }

    const newCategory = createCategory(name, logo);
    onUpdateCategories([newCategory, ...categories]);
    resetCreateForm();
  };

  const startEditing = (categorySlug: string) => {
    const category = categories.find((item) => item.slug === categorySlug);
    if (!category) {
      return;
    }

    setEditingSlug(category.slug);
    setEditingName(category.name);
    setEditingLogo(category.logo);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSlug) {
      return;
    }

    const trimmedName = editingName.trim();
    const trimmedLogo = editingLogo.trim();
    if (!trimmedName || !trimmedLogo) {
      Alert.alert("Campos invalidos", "Preencha nome e logo da categoria.");
      return;
    }

    onUpdateCategories(
      categories.map((category) =>
        category.slug === editingSlug
          ? {
              ...category,
              name: trimmedName,
              logo: trimmedLogo
            }
          : category
      )
    );
    resetEditForm();
  };

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar ao dashboard</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Categorias</Text>

      <View style={[styles.summaryCard, styles.adminProductCard]}>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryTitle}>Resumo</Text>
          <Text style={styles.summaryValue}>{categories.length} categoria(s)</Text>
        </View>
        <TextInput
          style={styles.formInput}
          value={search}
          onChangeText={() => {
            setSearch(arguments[0]);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nome ou slug"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={[styles.summaryCard, styles.adminProductCard]}>
        <Pressable style={styles.primaryActionButton} onPress={() => setIsCreateModalOpen(true)}>
          <Text style={styles.primaryActionButtonText}>Adicionar categoria</Text>
        </Pressable>
      </View>

      {(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);
        const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));

        return (
          <>
            {paginatedCategories.map((category) => {
              const usage = linkedTeamsCount(category.slug);

              return (
                <View key={category.slug} style={[styles.summaryCard, styles.adminProductCard]}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryTitle}>{category.name}</Text>
                    <Text style={styles.summaryValue}>{usage} time(s)</Text>
                  </View>
                  <Text style={styles.screenDescription}>{category.slug}</Text>
                  <Text style={styles.screenDescription} numberOfLines={1}>
                    {category.logo}
                  </Text>
                  <View style={styles.inlineActionRow}>
                    <Pressable style={styles.secondaryActionButton} onPress={() => startEditing(category.slug)}>
                      <Text style={styles.secondaryActionButtonText}>Editar</Text>
                    </Pressable>
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
                </View>
              );
            })}

            {filteredCategories.length === 0 ? (
              <View style={[styles.summaryCard, styles.adminProductCard]}>
                <Text style={styles.screenDescription}>Nenhuma categoria encontrada para o filtro informado.</Text>
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
          </>
        );
      })()}

      <SimpleFormModal
        visible={isCreateModalOpen}
        title="Adicionar categoria"
        errors={[]}
        submitLabel="Adicionar"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCategory}
      >
        <TextInput
          style={styles.formInput}
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.formInput}
          value={logo}
          onChangeText={setLogo}
          placeholder="URL do logo"
          placeholderTextColor="#9ca3af"
        />
      </SimpleFormModal>

      <SimpleFormModal
        visible={isEditModalOpen}
        title="Editar categoria"
        errors={[]}
        submitLabel="Salvar"
        onClose={resetEditForm}
        onSubmit={handleSaveEdit}
      >
        <TextInput
          style={styles.formInput}
          value={editingName}
          onChangeText={setEditingName}
          placeholder="Nome da categoria"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.formInput}
          value={editingLogo}
          onChangeText={setEditingLogo}
          placeholder="URL do logo"
          placeholderTextColor="#9ca3af"
        />
      </SimpleFormModal>
    </View>
  );
}
