export type CustomizationPoint = {
  x: number;
  y: number;
};

export type CustomizationTemplateMetadata = {
  version: number;
  detection: {
    source: "manual" | "legacy" | "mediapipe" | "heuristic";
  };
  faces: {
    front: {
      points: [CustomizationPoint, CustomizationPoint, CustomizationPoint, CustomizationPoint];
    };
    back?: {
      points: [CustomizationPoint, CustomizationPoint, CustomizationPoint, CustomizationPoint];
    };
  };
};

export const DEFAULT_FRONT_POINTS: [CustomizationPoint, CustomizationPoint, CustomizationPoint, CustomizationPoint] = [
  { x: 0.24, y: 0.2 },
  { x: 0.76, y: 0.2 },
  { x: 0.72, y: 0.76 },
  { x: 0.28, y: 0.76 }
];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const cross = (a: CustomizationPoint, b: CustomizationPoint, c: CustomizationPoint): number => {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

const segmentsIntersect = (
  p1: CustomizationPoint,
  p2: CustomizationPoint,
  p3: CustomizationPoint,
  p4: CustomizationPoint
): boolean => {
  const d1 = cross(p1, p2, p3);
  const d2 = cross(p1, p2, p4);
  const d3 = cross(p3, p4, p1);
  const d4 = cross(p3, p4, p2);

  return d1 * d2 < 0 && d3 * d4 < 0;
};

const polygonArea = (points: CustomizationPoint[]): number => {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    area += points[index].x * points[next].y - points[next].x * points[index].y;
  }
  return Math.abs(area) / 2;
};

export const normalizePoint = (point: CustomizationPoint): CustomizationPoint => ({
  x: clamp01(point.x),
  y: clamp01(point.y)
});

export const normalizePoints = (points: CustomizationPoint[]): CustomizationPoint[] => {
  return points.map(normalizePoint);
};

export const buildCustomizationTemplateMetadata = (
  points: CustomizationPoint[],
  source: CustomizationTemplateMetadata["detection"]["source"] = "manual"
): CustomizationTemplateMetadata => {
  const normalized = normalizePoints(points);
  return {
    version: 1,
    detection: { source },
    faces: {
      front: {
        points: [normalized[0], normalized[1], normalized[2], normalized[3]] as [
          CustomizationPoint,
          CustomizationPoint,
          CustomizationPoint,
          CustomizationPoint
        ]
      }
    }
  };
};

export const parseCustomizationTemplateMetadata = (value?: string): CustomizationTemplateMetadata | null => {
  if (!value?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as CustomizationTemplateMetadata;
    if (!parsed?.faces?.front?.points || parsed.faces.front.points.length !== 4) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const extractFrontPoints = (metadata?: CustomizationTemplateMetadata | null): CustomizationPoint[] => {
  if (!metadata?.faces?.front?.points || metadata.faces.front.points.length !== 4) {
    return DEFAULT_FRONT_POINTS.map((point) => ({ ...point }));
  }
  return normalizePoints(metadata.faces.front.points).map((point) => ({ ...point }));
};

export const validateCustomizationPoints = (points: CustomizationPoint[]): string[] => {
  const errors: string[] = [];

  if (points.length !== 4) {
    return ["A area util precisa de exatamente 4 pontos."];
  }

  if (points.some((point) => point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)) {
    errors.push("Os pontos devem ficar entre 0 e 1.");
  }

  const area = polygonArea(points);
  if (area < 0.02) {
    errors.push("A area selecionada esta muito pequena.");
  }

  if (segmentsIntersect(points[0], points[1], points[2], points[3]) || segmentsIntersect(points[1], points[2], points[3], points[0])) {
    errors.push("Os pontos nao podem cruzar as arestas do quadrilatero.");
  }

  return errors;
};

export const validateCustomizationTemplateMetadata = (metadata: CustomizationTemplateMetadata): string[] => {
  return validateCustomizationPoints(extractFrontPoints(metadata));
};

export const stringifyCustomizationTemplateMetadata = (metadata: CustomizationTemplateMetadata): string => {
  return JSON.stringify(metadata);
};
