import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ImageStyle,
  type LayoutChangeEvent,
  type StyleProp
} from "react-native";

import styles from "../../App.styles";
import { detectCustomizationRegion } from "../../lib/personalization/detection";
import {
  buildCustomizationTemplateMetadata,
  extractFrontPoints,
  parseCustomizationTemplateMetadata,
  stringifyCustomizationTemplateMetadata,
  validateCustomizationPoints,
  type CustomizationPoint
} from "../../lib/personalization/template-metadata";

type TemplateMappingToolProps = {
  templateUri: string;
  metadataValue: string;
  onMetadataChange: (value: string) => void;
};

const HANDLE_SIZE = 24;

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const round = (value: number): string => value.toFixed(3);

export function TemplateMappingTool({ templateUri, metadataValue, onMetadataChange }: TemplateMappingToolProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [points, setPoints] = useState<CustomizationPoint[]>(() => {
    const parsed = parseCustomizationTemplateMetadata(metadataValue);
    return extractFrontPoints(parsed);
  });

  const pointsRef = useRef<CustomizationPoint[]>(points);
  const startPointRef = useRef<CustomizationPoint[]>(points);
  const autoDetectionSeedRef = useRef<string | null>(null);
  const detectionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    const parsed = parseCustomizationTemplateMetadata(metadataValue);
    const next = extractFrontPoints(parsed);
    setPoints(next);
    pointsRef.current = next;
    startPointRef.current = next;
  }, [metadataValue, templateUri]);

  const runAutoDetection = useCallback(async (force: boolean) => {
    if (!templateUri.trim()) {
      return;
    }

    if (!force && metadataValue.trim()) {
      return;
    }

    setIsDetecting(true);
    try {
      const result = await detectCustomizationRegion(templateUri);
      const nextPoints = result.points;
      setPoints(nextPoints);
      pointsRef.current = nextPoints;

      const metadata = buildCustomizationTemplateMetadata(nextPoints, result.source);
      onMetadataChange(stringifyCustomizationTemplateMetadata(metadata));
      setDetectionMessage(result.reason);
    } catch {
      setDetectionMessage("Nao foi possivel gerar sugestao automatica. Ajuste manualmente os pontos.");
    } finally {
      setIsDetecting(false);
    }
  }, [metadataValue, onMetadataChange, templateUri]);

  useEffect(() => {
    if (!templateUri.trim()) {
      autoDetectionSeedRef.current = null;
      setDetectionMessage(null);
      return;
    }

    if (metadataValue.trim()) {
      return;
    }

    if (autoDetectionSeedRef.current === templateUri) {
      return;
    }

    autoDetectionSeedRef.current = templateUri;
    detectionDebounceRef.current = setTimeout(() => {
      void runAutoDetection(false);
    }, 450);

    return () => {
      if (detectionDebounceRef.current) {
        clearTimeout(detectionDebounceRef.current);
        detectionDebounceRef.current = null;
      }
    };
  }, [metadataValue, runAutoDetection, templateUri]);

  useEffect(() => {
    return () => {
      if (detectionDebounceRef.current) {
        clearTimeout(detectionDebounceRef.current);
      }
    };
  }, []);

  const persistPoints = (nextPoints: CustomizationPoint[]) => {
    const metadata = buildCustomizationTemplateMetadata(nextPoints, "manual");
    onMetadataChange(stringifyCustomizationTemplateMetadata(metadata));
  };

  const updatePoint = (index: number, point: CustomizationPoint, shouldPersist: boolean) => {
    const nextPoints = pointsRef.current.map((current, currentIndex) => {
      if (currentIndex !== index) {
        return current;
      }
      return {
        x: clamp(point.x, 0, 1),
        y: clamp(point.y, 0, 1)
      };
    });

    setPoints(nextPoints);
    pointsRef.current = nextPoints;

    if (shouldPersist) {
      persistPoints(nextPoints);
    }
  };

  const createPanHandlers = (index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setSelectedIndex(index);
        startPointRef.current = pointsRef.current.map((point) => ({ ...point }));
      },
      onPanResponderMove: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (!containerWidth || !containerHeight) {
          return;
        }
        const startPoint = startPointRef.current[index];
        updatePoint(
          index,
          {
            x: startPoint.x + gestureState.dx / containerWidth,
            y: startPoint.y + gestureState.dy / containerHeight
          },
          false
        );
      },
      onPanResponderRelease: () => {
        setSelectedIndex(null);
        persistPoints(pointsRef.current);
      },
      onPanResponderTerminate: () => {
        setSelectedIndex(null);
        persistPoints(pointsRef.current);
      }
    });
  };

  const handlePanResponders = [0, 1, 2, 3].map((index) => createPanHandlers(index));

  const validationErrors = useMemo(() => validateCustomizationPoints(points), [points]);

  const onCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  const resetPoints = () => {
    const parsed = parseCustomizationTemplateMetadata("");
    const next = extractFrontPoints(parsed);
    setPoints(next);
    pointsRef.current = next;
    persistPoints(next);
    setDetectionMessage(null);
  };

  if (!templateUri.trim()) {
    return (
      <Text style={styles.screenDescription}>
        Informe o template PNG para habilitar o mapeamento da area util.
      </Text>
    );
  }

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Mapa da area util (4 pontos)</Text>
      <Text style={styles.screenDescription}>Arraste os pontos para ajustar onde nome/numero serao aplicados na camisa.</Text>

      <View style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#cbd5e1" }} onLayout={onCanvasLayout}>
        <Image source={{ uri: templateUri }} style={{ width: "100%", height: 300 } as StyleProp<ImageStyle>} resizeMode="cover" />

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          {points.map((point, index) => {
            const left = point.x * containerWidth - HANDLE_SIZE / 2;
            const top = point.y * containerHeight - HANDLE_SIZE / 2;

            return (
              <View
                key={`point-${index}`}
                {...handlePanResponders[index].panHandlers}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: HANDLE_SIZE / 2,
                  backgroundColor: selectedIndex === index ? "#0f172a" : "#1d4ed8",
                  borderWidth: 2,
                  borderColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 10 }}>{index + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 4 }}>
        {points.map((point, index) => (
          <Text key={`coords-${index}`} style={styles.summaryKey}>
            P{index + 1}: x={round(point.x)} y={round(point.y)}
          </Text>
        ))}
      </View>

      {validationErrors.length > 0 ? (
        <View style={{ gap: 4 }}>
          {validationErrors.map((error) => (
            <Text key={error} style={styles.dangerLink}>
              {error}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.summaryKey}>Area util valida.</Text>
      )}

      {detectionMessage ? <Text style={styles.screenDescription}>{detectionMessage}</Text> : null}

      <View style={styles.inlineActionRow}>
        <Pressable style={styles.secondaryActionButton} onPress={() => void runAutoDetection(true)}>
          <Text style={styles.secondaryActionButtonText}>{isDetecting ? "Detectando..." : "Sugerir automaticamente"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryActionButton} onPress={resetPoints}>
          <Text style={styles.secondaryActionButtonText}>Resetar pontos</Text>
        </Pressable>
      </View>
    </View>
  );
}
