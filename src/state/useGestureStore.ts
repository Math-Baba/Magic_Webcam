// Store pour les gestes en cours
// Store zustand: état du tracé en cours (points enregistrés + statut du dessin)
import { create } from "zustand"

// Un point du tracé, en coordonnées normalisés (0-1) + timestamp
export interface TracePoint {
    x: number;
    y: number;
    t: number;
}

// Forme du state : liste de points du tracé actif + méthodes de contrôle
interface GestureState {
    points: TracePoint[];
    isDrawing: boolean;
    addPoint: (point: TracePoint) => void;
    startDrawing: () => void;
    clear: () => void;
}

// Store global du tracé, alimenté par strokeRecorder à chaque frame
export const useGestureStore = create<GestureState>((set) => ({
    points: [],
    isDrawing: false,
    startDrawing: () => set({ points: [], isDrawing: true}),
    addPoint: (point) =>
        set((state) => ({ points: [...state.points, point] })),
    clear: () => set({ points: [], isDrawing: false})
}))