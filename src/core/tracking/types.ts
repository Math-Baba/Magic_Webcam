// Un point de landmark renvoyé par Mediapipe (coordonnées normalisées 0-1)
export interface HandLandmark {
    x: number;
    y: number;
    z: number;
}

// Les 21 points d'une main détectée
export type HandLandmarks = HandLandmark[]

// Résultat complet d'une détection à un instant donné
export interface HandDetectionResult {
    landmarks: HandLandmarks[];
    handedness: string[];
    timestamp: number;
}

// Index des points clés utiles dans le tableau de landmarks Mediapipe
export const LANDMARK = {
    WRIST: 0,
    THUMB_TIP: 4,
    INDEX_TIP: 8,
    MIDDLE_TIP: 12,
    RING_TIP: 16,
    PINKY_TIP: 20,
} as const;