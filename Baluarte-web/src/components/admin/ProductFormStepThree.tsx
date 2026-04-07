import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import type { Dispatch, SetStateAction } from "react";
import type { ImageStyle, StyleProp } from "react-native";

import styles from "../../App.styles";
import { TemplateMappingTool } from "./TemplateMappingTool";
import type { ProductFormDraft } from "./ProductFormTypes";

type ProductFormStepThreeProps = {
  draft: ProductFormDraft;
  setDraft: Dispatch<SetStateAction<ProductFormDraft>>;
  imageUrl: string;
  setImageUrl: Dispatch<SetStateAction<string>>;
  onAddImages: (uris: string[]) => void;
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
  onPickFromFiles: () => void;
};

export function ProductFormStepThree({
  draft,
  setDraft,
  imageUrl,
  setImageUrl,
  onAddImages,
  onPickFromGallery,
  onTakePhoto,
  onPickFromFiles
}: ProductFormStepThreeProps) {
  return (
    <>
      <Text style={styles.summaryKey}>Personalizacao</Text>
      <View style={styles.inlineActionRow}>
        <Pressable
          style={draft.customizationEnabled ? styles.primaryActionButton : styles.secondaryActionButton}
          onPress={() =>
            setDraft((prev) => ({
              ...prev,
              customizationEnabled: !prev.customizationEnabled,
              customizationTemplateMetadata: prev.customizationEnabled ? "" : prev.customizationTemplateMetadata
            }))
          }
        >
          <Text style={draft.customizationEnabled ? styles.primaryActionButtonText : styles.secondaryActionButtonText}>
            {draft.customizationEnabled ? "Personalizacao habilitada" : "Habilitar personalizacao"}
          </Text>
        </Pressable>
      </View>

      {draft.customizationEnabled ? (
        <>
          <Text style={styles.summaryKey}>Template base (URL de imagem, PNG recomendado)</Text>
          <View style={styles.inlineActionRow}>
            <TextInput
              style={[styles.formInput, styles.imageUrlInput]}
              value={draft.customizationTemplatePng}
              onChangeText={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  customizationTemplatePng: value,
                  customizationTemplateMetadata: value.trim() ? prev.customizationTemplateMetadata : ""
                }))
              }
              placeholder="https://...template"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
          </View>

          {draft.customizationTemplatePng.trim() ? (
            <TemplateMappingTool
              templateUri={draft.customizationTemplatePng}
              metadataValue={draft.customizationTemplateMetadata}
              onMetadataChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  customizationTemplateMetadata: value
                }))
              }
            />
          ) : (
            <Text style={styles.screenDescription}>
              Defina o template PNG para ajustar os 4 pontos da area util de personalizacao.
            </Text>
          )}
        </>
      ) : null}

      <Text style={styles.summaryKey}>Adicionar por URL</Text>
      <View style={styles.inlineActionRow}>
        <TextInput
          style={[styles.formInput, styles.imageUrlInput]}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />
        <Pressable
          style={styles.secondaryActionButton}
          onPress={() => {
            const value = imageUrl.trim();
            if (!value) {
              Alert.alert("Imagem", "Informe uma URL valida.");
              return;
            }
            onAddImages([value]);
            setImageUrl("");
          }}
        >
          <Text style={styles.secondaryActionButtonText}>Adicionar URL</Text>
        </Pressable>
      </View>

      <Text style={styles.summaryKey}>Ou adicionar do dispositivo</Text>
      <View style={styles.inlineActionRow}>
        <Pressable style={styles.secondaryActionButton} onPress={onPickFromGallery}>
          <Text style={styles.secondaryActionButtonText}>Galeria</Text>
        </Pressable>
        <Pressable style={styles.secondaryActionButton} onPress={onTakePhoto}>
          <Text style={styles.secondaryActionButtonText}>Camera</Text>
        </Pressable>
        <Pressable style={styles.secondaryActionButton} onPress={onPickFromFiles}>
          <Text style={styles.secondaryActionButtonText}>Arquivos</Text>
        </Pressable>
      </View>

      <Text style={styles.summaryKey}>Imagens selecionadas ({draft.images.length})</Text>
      <View style={styles.adminImageGrid}>
        {draft.images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.adminImageItem}>
            <Image source={{ uri }} style={styles.adminImageThumb as StyleProp<ImageStyle>} resizeMode="cover" />
            <Pressable onPress={() => setDraft((prev) => ({ ...prev, images: prev.images.filter((item) => item !== uri) }))}>
              <Text style={styles.dangerLink}>Remover</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </>
  );
}
