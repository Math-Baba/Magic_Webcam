// Hooks React + tracker MediaPipe + store global de la main
import { useCallback, useEffect, useRef, useState } from "react";
import { HandTracker } from "../core/tracking/handTracker";
import { useHandStore } from "../state/useHandStore";

// Hook qui initialise MediaPipe et expose une fonction pour démarrer la boucle de détection
export function useHandTracking() {
  const trackerRef = useRef<HandTracker | null>(null);
  const rafRef = useRef<number | null>(null);
  const isLoopRunning = useRef(false);
  const [ready, setReady] = useState(false);
  const setLandmarks = useHandStore((s) => s.setLandmarks);

  // Initialise le tracker une seule fois au montage du hook
  useEffect(() => {
    const tracker = new HandTracker();
    trackerRef.current = tracker;

    tracker
      .init()
      .then(() => {
        console.info("MediaPipe HandLandmarker initialisé");
        setReady(true);
      })
      .catch((error) => {
        console.error("Impossible d'initialiser MediaPipe HandLandmarker", error);
      });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      isLoopRunning.current = false;
    };
  }, []);

  // Lance une boucle requestAnimationFrame qui détecte la main à chaque frame
  const startLoop = useCallback(
    (video: HTMLVideoElement) => {
      if (isLoopRunning.current) return;
      isLoopRunning.current = true;

      function loop() {
        // ⚠️ CRITIQUE : on replanifie TOUJOURS la frame suivante en tout premier,
        // avant tout traitement qui pourrait lever une exception. Ainsi, même si
        // le traitement plante, la boucle de détection ne s'arrête jamais.
        rafRef.current = requestAnimationFrame(loop);

        const tracker = trackerRef.current;
        if (!tracker?.isReady() || video.videoWidth === 0 || video.videoHeight === 0) {
          return;
        }

        // Le traitement lui-même est isolé dans un try/catch : une erreur ici
        // (détection MediaPipe, ou un listener du store qui plante) est loggée
        // mais ne casse jamais la boucle.
        try {
          const result = tracker.detect(video, performance.now());
          const detectedLandmarks = result?.landmarks?.[0] ?? null;
          setLandmarks(detectedLandmarks);
        } catch (error) {
          console.error("Erreur pendant le traitement d'une frame de détection", error);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    },
    [setLandmarks]
  );

  return { ready, startLoop };
}