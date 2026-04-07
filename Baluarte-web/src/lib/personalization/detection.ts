import {
  DEFAULT_FRONT_POINTS,
  normalizePoints,
  type CustomizationPoint,
  type CustomizationTemplateMetadata
} from "./template-metadata";

export type DetectionResult = {
  points: CustomizationPoint[];
  source: CustomizationTemplateMetadata["detection"]["source"];
  reason: string;
};

const WASM_BASE_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const POSE_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
const MAX_DETECTION_WIDTH = 960;

let detectionAttempts = 0;
let detectionSuccess = 0;
let detectionFallback = 0;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const dynamicImport = async (moduleName: string): Promise<any> => {
  const importer = new Function("moduleName", "return import(moduleName);") as (moduleName: string) => Promise<any>;
  return importer(moduleName);
};

const canUseBrowserVision = (): boolean => {
  return typeof window !== "undefined" && typeof document !== "undefined";
};

const loadHtmlImage = async (uri: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao carregar template para deteccao."));
    image.src = uri;
  });
};

const toDetectionInput = (imageElement: HTMLImageElement): HTMLImageElement | HTMLCanvasElement => {
  if (!canUseBrowserVision()) {
    return imageElement;
  }

  const originalWidth = imageElement.naturalWidth || imageElement.width;
  const originalHeight = imageElement.naturalHeight || imageElement.height;
  if (!originalWidth || !originalHeight || originalWidth <= MAX_DETECTION_WIDTH) {
    return imageElement;
  }

  const nextWidth = MAX_DETECTION_WIDTH;
  const nextHeight = Math.max(1, Math.round((originalHeight * nextWidth) / originalWidth));
  const canvas = document.createElement("canvas");
  canvas.width = nextWidth;
  canvas.height = nextHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return imageElement;
  }

  context.drawImage(imageElement, 0, 0, nextWidth, nextHeight);
  return canvas;
};

const reportDetectionMetrics = (source: DetectionResult["source"], durationMs: number) => {
  const payload = {
    source,
    durationMs,
    attempts: detectionAttempts,
    successRate: detectionAttempts > 0 ? Number((detectionSuccess / detectionAttempts).toFixed(3)) : 0,
    fallbackRate: detectionAttempts > 0 ? Number((detectionFallback / detectionAttempts).toFixed(3)) : 0
  };

  if (source === "mediapipe") {
    console.info("[personalization:detection]", payload);
    return;
  }

  console.warn("[personalization:detection:fallback]", payload);
};

const detectWithMediaPipe = async (templateUri: string): Promise<CustomizationPoint[] | null> => {
  if (!canUseBrowserVision()) {
    return null;
  }

  let visionModule: any;
  try {
    visionModule = await dynamicImport("@mediapipe/tasks-vision");
  } catch {
    return null;
  }

  const { FilesetResolver, PoseLandmarker } = visionModule ?? {};
  if (!FilesetResolver || !PoseLandmarker) {
    return null;
  }

  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
  const poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: POSE_MODEL_PATH
    },
    runningMode: "IMAGE",
    numPoses: 1
  });

  try {
    const imageElement = await loadHtmlImage(templateUri);
    const detectionInput = toDetectionInput(imageElement);
    const result = poseLandmarker.detect(detectionInput);
    const landmarks = result?.landmarks?.[0];
    if (!landmarks || landmarks.length < 25) {
      return null;
    }

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return null;
    }

    const topY = clamp01(Math.min(leftShoulder.y, rightShoulder.y) + 0.03);
    const bottomY = clamp01(Math.max(leftHip.y, rightHip.y) - 0.03);

    const points: CustomizationPoint[] = [
      { x: clamp01(leftShoulder.x - 0.05), y: topY },
      { x: clamp01(rightShoulder.x + 0.05), y: topY },
      { x: clamp01(rightHip.x + 0.04), y: bottomY },
      { x: clamp01(leftHip.x - 0.04), y: bottomY }
    ];

    return normalizePoints(points);
  } finally {
    if (typeof poseLandmarker.close === "function") {
      poseLandmarker.close();
    }
  }
};

const detectWithHeuristic = (): CustomizationPoint[] => {
  return DEFAULT_FRONT_POINTS.map((point) => ({ ...point }));
};

export const detectCustomizationRegion = async (templateUri: string): Promise<DetectionResult> => {
  const startedAt = Date.now();
  detectionAttempts += 1;

  const mediaPipePoints = await detectWithMediaPipe(templateUri);
  if (mediaPipePoints) {
    detectionSuccess += 1;
    reportDetectionMetrics("mediapipe", Date.now() - startedAt);
    return {
      points: mediaPipePoints,
      source: "mediapipe",
      reason: "Regiao sugerida com landmarks de pose."
    };
  }

  detectionFallback += 1;
  reportDetectionMetrics("heuristic", Date.now() - startedAt);

  return {
    points: detectWithHeuristic(),
    source: "heuristic",
    reason: "MediaPipe indisponivel. Aplicada sugestao heuristica inicial."
  };
};
