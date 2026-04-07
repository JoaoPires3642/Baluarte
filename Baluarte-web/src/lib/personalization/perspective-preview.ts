import {
  extractFrontPoints,
  parseCustomizationTemplateMetadata,
  type CustomizationPoint
} from "./template-metadata";

export type PerspectiveOverlayLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotateDeg: number;
  skewXDeg: number;
};

const distance = (a: CustomizationPoint, b: CustomizationPoint): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const midpoint = (a: CustomizationPoint, b: CustomizationPoint): CustomizationPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2
});

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const resolveFrontPointsFromRawMetadata = (rawMetadata?: string): CustomizationPoint[] | null => {
  const parsed = parseCustomizationTemplateMetadata(rawMetadata);
  if (!parsed) {
    return null;
  }
  return extractFrontPoints(parsed);
};

export const buildPerspectiveOverlayLayout = (
  points: CustomizationPoint[],
  containerWidth: number,
  containerHeight: number
): PerspectiveOverlayLayout | null => {
  if (!containerWidth || !containerHeight || points.length !== 4) {
    return null;
  }

  const [p0, p1, p2, p3] = points.map((point) => ({
    x: point.x * containerWidth,
    y: point.y * containerHeight
  }));

  const topWidth = distance(p0, p1);
  const bottomWidth = distance(p3, p2);
  const leftHeight = distance(p0, p3);
  const rightHeight = distance(p1, p2);

  const topMid = midpoint(p0, p1);
  const bottomMid = midpoint(p3, p2);
  const horizontalDelta = topMid.x - bottomMid.x;
  const verticalDelta = Math.max(1, bottomMid.y - topMid.y);

  const width = Math.max(24, Math.max(topWidth, bottomWidth));
  const height = Math.max(24, (leftHeight + rightHeight) / 2);
  const centerX = (topMid.x + bottomMid.x) / 2;
  const centerY = (topMid.y + bottomMid.y) / 2;

  const left = clamp(centerX - width / 2, 0, Math.max(0, containerWidth - width));
  const top = clamp(centerY - height / 2, 0, Math.max(0, containerHeight - height));

  const rotateDeg = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
  const skewXDeg = (Math.atan2(horizontalDelta, verticalDelta) * 180) / Math.PI;

  return {
    left,
    top,
    width,
    height,
    rotateDeg,
    skewXDeg
  };
};
