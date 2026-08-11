// Hooks React ° tracker Mediapipe + store global de la main
import { useCallback, useEffect, useRef, useState } from "react"
import { HandTracker } from "../core/tracking/handTracker"
import { useHandStore } from "../state/useHandStore"

// Hook qui intialise Mediapipe et expose une fonction pour démarrer la boucle de détection
export function useHandTracking(){
    const trackerRef = useRef<HandTracker | null>(null)
    const rafRef = useRef<number | null>(null)
    const isLoopRunning = useRef(false)
    const [ready, setReady] = useState(false)
    const setLandmarks = useHandStore((s) => s.setLandmarks)

    // Initialise le tracker une seule fois au montage du hook
    useEffect(() => {
        const tracker = new HandTracker()
        trackerRef.current = tracker
        tracker.init().then(() => setReady(true))

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            isLoopRunning.current = false
        }
    }, [])

    // Lance une boucle requestAnimationFrame qui détecte la main à chaque frame
    const startLoop = useCallback((video: HTMLVideoElement) => {
        if (isLoopRunning.current) return

        isLoopRunning.current = true

        function loop() {
            const tracker = trackerRef.current;
            if (tracker?.isReady()) {
                const result = tracker.detect(video, performance.now())
                const detectedLandmarks = result?.landmarks[0] ?? null
                setLandmarks(detectedLandmarks)
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
    }, [setLandmarks])

    return {ready, startLoop}
}