// Hooks React + stores + classification de forme de main + reconnaissance
import { useEffect, useRef } from "react";
import { useHandStore } from "../state/useHandStore";
import { useGestureStore } from "../state/useGestureStore";
import { getIndexTipPosition, isValidNextPoint } from "../core/gestures/strokeRecorder";
import { getHandShape, classifyShape, type GestureShapeKind } from "../core/gestures/handShape";
import { recognizeStroke } from "../core/gestures/strokeRecognizer";

// Durée de l'animation de disparition après résolution (ms)
const RESOLVE_DURATION_MS = 1200;
// Nombre de frames consécutives avec la même forme requis avant de déclencher une transition
// discrète (verrouillage, pause). Évite les faux déclenchements dus au bruit d'une seule frame.
// Ne s'applique volontairement PAS au dessin lui-même (index seul), pour rester réactif.
const STABILITY_FRAMES = 2;

// Hook qui écoute les landmarks et pilote tout le cycle du geste magique
export function useGestureCapture() {
  const stableShape = useRef<{ kind: GestureShapeKind; count: number }>({ kind: "other", count: 0 });
  const resolveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = useHandStore.subscribe((state) => {
      const landmarks = state.landmarks;
      if (!landmarks) return;

      const shape = getHandShape(landmarks);
      if (!shape) return;
      const kind = classifyShape(shape);

      // Mise à jour du compteur de stabilité de la forme actuelle
      if (stableShape.current.kind === kind) {
        stableShape.current.count++;
      } else {
        stableShape.current = { kind, count: 1 };
      }
      const isStable = stableShape.current.count >= STABILITY_FRAMES;

      const gesture = useGestureStore.getState();

      // POING (stable) pendant un geste actif -> verrouillage + reconnaissance
      if (isStable && kind === "fist" && gesture.phase === "active") {
        useGestureStore.getState().lockAll();

        if (useGestureStore.getState().phase === "locked") {
          const allPoints = useGestureStore.getState().strokes.flat();
          const result = recognizeStroke(allPoints);
          console.log("Résultat reconnaissance:", result);

          useGestureStore.getState().startResolving();
          // TODO : déclencher spellRegistry ici avec `result`

          if (resolveTimeoutRef.current) window.clearTimeout(resolveTimeoutRef.current);
          resolveTimeoutRef.current = window.setTimeout(() => {
            useGestureStore.getState().reset();
          }, RESOLVE_DURATION_MS);
        }
        return;
      }

      // INDEX SEUL -> stylo posé, on dessine (pas de garde de stabilité : priorité à la réactivité)
      if (kind === "index-only") {
        const current = useGestureStore.getState();

        // Premier trait du geste, ou reprise après une pause -> nouveau trait
        if (current.phase === "idle" || (current.phase === "active" && !current.isPenDown)) {
          useGestureStore.getState().beginStroke();
        }

        const afterStart = useGestureStore.getState();
        if (afterStart.phase === "active" && afterStart.isPenDown) {
          const point = getIndexTipPosition(landmarks);
          if (point) {
            const currentStroke = afterStart.strokes[afterStart.strokes.length - 1] ?? [];
            const lastPoint = currentStroke[currentStroke.length - 1];
            if (isValidNextPoint(lastPoint, point)) {
              useGestureStore.getState().addPoint(point);
            }
          }
        }
        return;
      }

      // INDEX + MAJEUR (stable) -> stylo levé : pause, sans terminer le geste global
      if (isStable && kind === "index-middle" && gesture.phase === "active" && gesture.isPenDown) {
        useGestureStore.getState().liftPen();
        return;
      }

      // Toute autre forme ("other") : on ignore complètement, on ne modifie rien.
      // C'est ce qui empêche une main grande ouverte de déclencher un dessin.
    });

    return () => {
      unsubscribe();
      if (resolveTimeoutRef.current) window.clearTimeout(resolveTimeoutRef.current);
    };
  }, []);
}