// Types landmarks + index des points clés MediaPipe
import { LANDMARK, type HandLandmarks } from "../tracking/types";
import type { TracePoint } from "../../state/useGestureStore";

// Distance max entre deux points consécutifs pour éviter le bruit (sauts de détection aberrants,
// ex. la main détectée saute d'un côté à l'autre de l'écran en un frame). Volontairement large :
// un seuil trop strict rejette des mouvements rapides légitimes et donne une impression de retard.
const MAX_JUMP_DISTANCE = 0.3;

// Extrait la position du bout de l'index à partir des landmarks de la main
export function getIndexTipPosition(landmarks: HandLandmarks): TracePoint | null {
  const tip = landmarks[LANDMARK.INDEX_TIP];
  if (!tip) return null;
  return { x: tip.x, y: tip.y, t: performance.now() };
}

// Vérifie qu'un nouveau point n'est pas un saut aberrant par rapport au précédent
export function isValidNextPoint(prev: TracePoint | undefined, next: TracePoint): boolean {
  if (!prev) return true;
  const distance = Math.hypot(next.x - prev.x, next.y - prev.y);
  return distance <= MAX_JUMP_DISTANCE;
}