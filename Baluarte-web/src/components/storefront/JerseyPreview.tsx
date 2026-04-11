import { useImage, Canvas, Image, Text, Group, vec, LinearGradient, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";

export interface JerseyPreviewProps {
  templateUri: string;
  name: string;
  number: string | null;
  width: number;
  height: number;
  fontSize?: number;
  numberFontSize?: number;
}

const getNameFontSize = (value: string): number => {
  const normalizedLength = value.replace(/\s+/g, "").length;
  if (normalizedLength <= 8) return 28;
  if (normalizedLength <= 12) return 24;
  if (normalizedLength <= 16) return 20;
  if (normalizedLength <= 20) return 17;
  return 15;
};

const getNumberFontSize = (value: string): number => {
  return value.length === 1 ? 48 : 42;
};

export function JerseyPreview({
  templateUri,
  name,
  number,
  width,
  height,
  fontSize,
  numberFontSize,
}: JerseyPreviewProps) {
  const templateImage = useImage(templateUri);

  const actualNameFontSize = fontSize ?? getNameFontSize(name);
  const actualNumberFontSize = numberFontSize ?? getNumberFontSize(number ?? "1");

  const nameFont = useMemo(() => {
    return Skia.Font(undefined, actualNameFontSize);
  }, [actualNameFontSize]);

  const numberFont = useMemo(() => {
    return Skia.Font(undefined, actualNumberFontSize);
  }, [actualNumberFontSize]);

  const centerX = width / 2;
  const nameY = height * 0.45;
  const numberY = height * 0.72;

  const hasName = name.trim().length > 0;
  const hasNumber = number && number.length > 0;

  if (!templateImage || !nameFont || !numberFont) {
    return null;
  }

  return (
    <Canvas style={{ width, height }}>
      <Image
        image={templateImage}
        fit="contain"
        x={0}
        y={0}
        width={width}
        height={height}
      />

      <Group blendMode="overlay">
        {hasName && (
          <Group>
            <Text
              x={centerX - nameFont.measureText(name.toUpperCase()).width / 2}
              y={nameY + 1}
              text={name.toUpperCase()}
              font={nameFont}
              color="rgba(0,0,0,0.25)"
            />
            <Text
              x={centerX - nameFont.measureText(name.toUpperCase()).width / 2}
              y={nameY}
              text={name.toUpperCase()}
              font={nameFont}
              color="white"
            />
          </Group>
        )}

        {hasNumber && (
          <Group>
            <Text
              x={centerX - numberFont.measureText(number).width / 2}
              y={numberY + 1}
              text={number ?? ""}
              font={numberFont}
              color="rgba(0,0,0,0.25)"
            />
            <Text
              x={centerX - numberFont.measureText(number).width / 2}
              y={numberY}
              text={number ?? ""}
              font={numberFont}
              color="white"
            />
          </Group>
        )}
      </Group>

      <Group blendMode="softLight" opacity={0.1}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={[
            "rgba(255,255,255,0.1)",
            "rgba(200,200,200,0.03)",
            "rgba(255,255,255,0.08)",
          ]}
          positions={[0, 0.5, 1]}
        />
      </Group>
    </Canvas>
  );
}
