// Classification de la forme de la main : quels doigts sont tendus, pour distinguer
// "index seul", "index + majeur", "poing fermé", etc.
import { LANDMARK, type HandLandmarks } from "../tracking/types";

// Un doigt est considéré "tendu" si son bout est significativement plus loin du poignet
// que son articulation PIP. Le ratio donne une marge de tolérance.
const EXTENSION_RATIO = 1.15;

// Distance euclidienne 2D entre deux landmarks
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Détermine si un doigt donné est tendu, à partir de son bout (tip) et de son articulation (pip)
function isFingerExtended(
  landmarks: HandLandmarks,
  wrist: { x: number; y: number },
  tipIndex: number,
  pipIndex: number
): boolean {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  if (!tip || !pip) return false;
  return dist(wrist, tip) > dist(wrist, pip) * EXTENSION_RATIO;
}

// État tendu/replié de chaque doigt (le pouce est ignoré : sa géométrie est différente
// et on n'en a pas besoin pour nos 3 gestes)
export interface HandShape {
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

// Analyse les landmarks et retourne l'état de chaque doigt, ou null si la main n'est pas fiable
export function getHandShape(landmarks: HandLandmarks): HandShape | null {
  const wrist = landmarks[LANDMARK.WRIST];
  if (!wrist) return null;

  return {
    index: isFingerExtended(landmarks, wrist, LANDMARK.INDEX_TIP, LANDMARK.INDEX_PIP),
    middle: isFingerExtended(landmarks, wrist, LANDMARK.MIDDLE_TIP, LANDMARK.MIDDLE_PIP),
    ring: isFingerExtended(landmarks, wrist, LANDMARK.RING_TIP, LANDMARK.RING_PIP),
    pinky: isFingerExtended(landmarks, wrist, LANDMARK.PINKY_TIP, LANDMARK.PINKY_PIP),
  };
}

// Les formes de main reconnues par l'application
export type GestureShapeKind = "index-only" | "index-middle" | "fist" | "other";

// Classifie une forme de main en une des catégories utiles au geste magique.
// "other" couvre tout le reste (main grande ouverte, formes ambiguës) : volontairement ignoré ailleurs.
export function classifyShape(shape: HandShape): GestureShapeKind {
  if (shape.index && !shape.middle && !shape.ring && !shape.pinky) return "index-only";
  if (shape.index && shape.middle && !shape.ring && !shape.pinky) return "index-middle";
  if (!shape.index && !shape.middle && !shape.ring && !shape.pinky) return "fist";
  return "other";
}