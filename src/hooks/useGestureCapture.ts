// Hooks React + stores + logique de détection de geste
// Hook qui orchestre capture + validation
import { useEffect, useRef } from "react"
import { useHandStore } from "../state/useHandStore"
import { useGestureStore } from "../state/useGestureStore"
import { getIndexTipPosition, isValidNextPoint } from "../core/gestures/strokeRecorder"
import { isFistClosed } from "../core/gestures/fistDetector"

// Hook qui écoute les landmarks de la main et pilote l'enregistrement du tracé
export function useGestureCapture() {
    const wasFistClosed = useRef(false)

    // A chaque changement de landmarks : ajoute un point au tracé ou détecte la validation
    useEffect(() => {
        const unsuscribe = useHandStore.subscribe((state) => {
            const landmarks = state.landmarks
            if(!landmarks) return

            const gesture = useGestureStore.getState()
            const fistClosed = isFistClosed(landmarks)

            // Poing fermé détecté après un tracé en cours -> fin de tracé (validation)
            if (fistClosed && !wasFistClosed.current && gesture.isDrawing) {
                console.log("Tracé validé, points capturés: ", gesture.points.length)
                gesture.clear()
            }

            // Poing ouvert -> on enregistre la positon de l'index dans le tracé
            if (!fistClosed) {
                const point = getIndexTipPosition(landmarks)
                if(point) {
                    if(!gesture.isDrawing) {
                        gesture.startDrawing()
                    }
                    const lastPoint = gesture.points[gesture.points.length - 1]
                    if (isValidNextPoint(lastPoint, point)) {
                        gesture.addPoint(point)
                    }
                }
            }
            wasFistClosed.current = fistClosed
        })

        return unsuscribe
    }, [])
}