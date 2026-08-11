// Wrapper Mediapipe Hands
// Imports Mediapipe: détecteur de mains et résolveur de fichiers WASM
import {
    HandLandmarker,
    FilesetResolver,
    type HandLandmarkerResult,
} from "@mediapipe/tasks-vision"
import type { HandDetectionResult } from "./types"

// Classe qui encapsule le cycle de vie du détecteur Mediapipe
export class HandTracker {
    private landmarker: HandLandmarker | null = null;

    // Initialise le modèle de détection 
    async init(){
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const baseOptions = {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU" as const,
        };

        try {
            this.landmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions,
                runningMode: "VIDEO",
                numHands: 2,
            });
        } catch (error) {
            console.warn("MediaPipe GPU init failed, retrying with CPU delegate.", error);
            this.landmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    ...baseOptions,
                    delegate: "CPU",
                },
                runningMode: "VIDEO",
                numHands: 2,
            });
        }
    }

    // Lance une détection sur la frame actuelle
    detect(video: HTMLVideoElement, timestamp: number): HandDetectionResult | null {
        if(!this.landmarker) return null;

        const result: HandLandmarkerResult = this.landmarker.detectForVideo(video, timestamp);

        return {
            landmarks: result.landmarks,
            handedness: result.handedness.map((h) => h[0]?.categoryName ?? "Unknown"),
            timestamp
        }
    }

    // Indique si le modèle est chargé et prêt à détecter
    isReady(){
        return this.landmarker !== null;
    }
}