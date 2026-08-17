// Un point de landmark renvoyé par MediaPipe (coordonnées normalisées 0-1)
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// Les 21 points d'une main détectée
export type HandLandmarks = HandLandmark[];

// Résultat complet d'une détection à un instant donné
export interface HandDetectionResult {
  landmarks: HandLandmarks[];
  handedness: string[];
  timestamp: number;
}

// Index des points clés utiles dans le tableau de landmarks MediaPipe.
// TIP = bout du doigt, PIP = articulation intermédiaire (sert de référence pour savoir si le doigt est tendu)
export const LANDMARK = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_PIP: 6,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9, // base du majeur, utilisée comme référence d'échelle de la main
  MIDDLE_PIP: 10,
  MIDDLE_TIP: 12,
  RING_PIP: 14,
  RING_TIP: 16,
  PINKY_PIP: 18,
  PINKY_TIP: 20,
} as const;