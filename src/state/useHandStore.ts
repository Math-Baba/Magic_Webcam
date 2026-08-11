// Store Zustand pour la main
// Import Zustand pour créer un store réactif accessible partout dans l'app
import { create } from "zustand"
import type { HandLandmarks } from "../core/tracking/types"

// Forme du state : landmarks actuels + statut de détection
interface HandState {
    landmarks: HandLandmarks | null;
    isDetected: boolean;
    setLandmarks: (landmarks: HandLandmarks | null) => void;
}

// Store global de la position de la main, mis à jour à chaque frame
export const useHandStore = create<HandState>((set) => ({
    landmarks: null,
    isDetected: false,
    setLandmarks: (landmarks) => {
        const hasValidLandmarks = Array.isArray(landmarks) && landmarks.length > 0
        set({
            landmarks: hasValidLandmarks ? landmarks : null,
            isDetected: hasValidLandmarks,
        })
    }
}))