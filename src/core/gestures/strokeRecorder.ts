// Capture du tracé de l'index
// Types landmarks + index des points clés Mediapipe
import { LANDMARK, type HandLandmarks } from "../tracking/types"
import type { TracePoint } from "../../state/useGestureStore"

// Distance max entre deux points consécutifs pour éviter le bruit (saut de détection)
const MAX_JUMP_DISTANCE = 0.15

// Extrait la position du bout de l'index à partir des landmarks de la main
export function getIndexTipPosition(landmarks: HandLandmarks) : TracePoint | null {
    const tip = landmarks[LANDMARK.INDEX_TIP]
    if(!tip) return null

    return { x: tip.x, y: tip.y, t: performance.now() }
}

// Vérifie qu'un nouveau point n'est pas un saut aberrant par rapport au précédent 
export function isValidNextPoint(
    prev: TracePoint | undefined,
    next: TracePoint
) : boolean {
    if (!prev) return true

    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const distance =Math.sqrt(dx * dx + dy * dy)

    return distance <= MAX_JUMP_DISTANCE
}