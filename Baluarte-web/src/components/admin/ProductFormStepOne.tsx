import { Text, TextInput } from "react-native";
import type { Dispatch, SetStateAction } from "react";

import styles from "../../App.styles";
import { SelectField } from "../form/SelectField";
import type { ProductFormDraft, ProductOption } from "./ProductFormTypes";

type ProductFormStepOneProps = {
  draft: ProductFormDraft;
  setDraft: Dispatch<SetStateAction<ProductFormDraft>>;
  categories: ProductOption[];
  teams: ProductOption[];
  categoryLabel: string;
  teamLabel: string;
  selectPrefix: "create" | "edit";
  openSelectKey: string | null;
  setOpenSelectKey: Dispatch<SetStateAction<string | null>>;
  selectSearch: Record<string, string>;
  setSelectSearch: Dispatch<SetStateAction<Record<string, string>>>;
  onSelectCategory: (value: string) => void;
};

export function ProductFormStepOne({
  draft,
  setDraft,
  categories,
  teams,
  categoryLabel,
  teamLabel,
  selectPrefix,
  openSelectKey,
  setOpenSelectKey,
  selectSearch,
  setSelectSearch,
  onSelectCategory
}: ProductFormStepOneProps) {
  return (
    <>
      <Text style={styles.summaryKey}>Nome</Text>
      <TextInput
        style={styles.formInput}
        value={draft.name}
        onChangeText={(value) => setDraft((prev) => ({ ...prev, name: value }))}
        placeholder="Nome"
        placeholderTextColor="#9ca3af"
        autoFocus={selectPrefix === "create"}
      />

      <Text style={styles.summaryKey}>Descricao</Text>
      <TextInput
        style={styles.formInput}
        value={draft.description}
        onChangeText={(value) => setDraft((prev) => ({ ...prev, description: value }))}
        placeholder="Descricao"
        placeholderTextColor="#9ca3af"
      />

      <SelectField
        label="Categoria"
        valueLabel={categoryLabel}
        selectKey={`${selectPrefix}-category`}
        options={categories}
        onSelect={onSelectCategory}
        openSelectKey={openSelectKey}
        setOpenSelectKey={setOpenSelectKey}
        selectSearch={selectSearch}
        setSelectSearch={setSelectSearch}
      />

      <SelectField
        label="Time (subcategoria)"
        valueLabel={teamLabel}
        selectKey={`${selectPrefix}-team`}
        options={teams}
        onSelect={(value) => setDraft((prev) => ({ ...prev, teamId: value }))}
        openSelectKey={openSelectKey}
        setOpenSelectKey={setOpenSelectKey}
        selectSearch={selectSearch}
        setSelectSearch={setSelectSearch}
      />
    </>
  );
}
