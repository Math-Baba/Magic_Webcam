// Store Zustand : état du geste complet, qui peut contenir PLUSIEURS traits (stylo levé/posé)
import { create } from "zustand";

// Un point du tracé, en coordonnées normalisées (0-1) + timestamp
export interface TracePoint {
  x: number;
  y: number;
  t: number;
}

// Cycle de vie du geste global : idle (rien) -> active (dessin en cours, éventuellement en pause)
// -> locked (poing fermé, tracé figé) -> resolving (animation de disparition) -> retour à idle
export type GesturePhase = "idle" | "active" | "locked" | "resolving";

interface GestureState {
  strokes: TracePoint[][]; // liste de traits ; un nouveau trait démarre à chaque reprise après pause
  isPenDown: boolean; // true = on est en train d'ajouter des points au trait courant
  phase: GesturePhase;
  lockedAt: number | null;
  beginStroke: () => void;
  addPoint: (point: TracePoint) => void;
  liftPen: () => void;
  lockAll: () => void;
  startResolving: () => void;
  reset: () => void;
}

// Store global du geste : pilote tout le cycle dessin (multi-traits) -> validation -> résolution -> reset
export const useGestureStore = create<GestureState>((set) => ({
  strokes: [],
  isPenDown: false,
  phase: "idle",
  lockedAt: null,

  // Démarre un nouveau trait (le premier du geste, ou un nouveau après une pause stylo-levé)
  beginStroke: () =>
    set((state) => ({
      strokes: [...state.strokes, []],
      isPenDown: true,
      phase: "active",
    })),

  // Ajoute un point au trait courant (dernier de la liste), uniquement si le stylo est "posé"
  addPoint: (point) =>
    set((state) => {
      if (!state.isPenDown || state.strokes.length === 0) return state;
      const strokes = state.strokes.slice();
      strokes[strokes.length - 1] = [...strokes[strokes.length - 1], point];
      return { strokes };
    }),

  // Stylo levé : on arrête d'ajouter des points, mais le geste global reste actif
  liftPen: () => set({ isPenDown: false }),

  // Poing fermé : on verrouille définitivement tous les traits du geste
  lockAll: () =>
    set((state) => {
      const totalPoints = state.strokes.reduce((sum, s) => sum + s.length, 0);
      if (state.phase !== "active" || totalPoints < 5) return state;
      return { phase: "locked", isPenDown: false, lockedAt: performance.now() };
    }),

  // Passe en phase de résolution (reconnaissance faite, animation de disparition en cours)
  startResolving: () => set({ phase: "resolving" }),

  // Retour à l'état initial, prêt pour un nouveau geste
  reset: () => set({ strokes: [], isPenDown: false, phase: "idle", lockedAt: null }),
}));