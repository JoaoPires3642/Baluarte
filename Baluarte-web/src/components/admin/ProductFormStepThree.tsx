import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import type { Dispatch, SetStateAction } from "react";
import type { ImageStyle, StyleProp } from "react-native";

import styles from "../../App.styles";
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
