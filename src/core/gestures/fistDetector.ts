// Détection du poing fermé (validation du pentagramme)

import { LANDMARK, type HandLandmarks } from "../tracking/types"

// Seuil de distance (normalisée) sous lequel un doigt est considéré "replié"
const CURL_THRESHOLD = 0.08

// Calcule la distance euclidienne entre deux landmarks
function distance(a: { x: number; y: number }, b: { x:number; y: number }){
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// Détecte un poing fermé : les bouts des doigts doivent être proche du poignet
export function isFistClosed(landmarks: HandLandmarks): boolean {
    const wrist = landmarks[LANDMARK.WRIST]
    const tips = [
        landmarks[LANDMARK.INDEX_TIP],
        landmarks[LANDMARK.MIDDLE_TIP],
        landmarks[LANDMARK.RING_TIP],
        landmarks[LANDMARK.PINKY_TIP]
    ]

    if(!wrist || tips.some((t) => !t)) return false

    // Moyenne des distances poignet => bouts des doigts
    const totalDistance = tips.reduce((sum, tip) => sum + distance(wrist, tip!), 0)
    const avgDistance = totalDistance / tips.length

    return avgDistance <= CURL_THRESHOLD
}