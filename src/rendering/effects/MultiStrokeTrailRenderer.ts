// Gère un pool de TrailRenderer (un par trait), pour afficher plusieurs traits distincts
// sans tracer de ligne parasite entre eux quand le stylo est levé puis reposé ailleurs.
import * as THREE from "three";
import { TrailRenderer } from "./TrailRenderer";
import type { TracePoint } from "../../state/useGestureStore";

// Nombre max de traits affichables simultanément dans un même geste
const MAX_STROKES = 8;

export class MultiStrokeTrailRenderer {
  private pool: TrailRenderer[] = [];

  constructor(scene: THREE.Scene) {
    // Pool pré-créé une fois pour toutes (pas de création/destruction en cours d'animation)
    for (let i = 0; i < MAX_STROKES; i++) {
      this.pool.push(new TrailRenderer(scene));
    }
  }

  // Met à jour chaque trait actif, et masque les emplacements du pool non utilisés
  update(strokes: TracePoint[][], opacityMultiplier = 1) {
    strokes.slice(0, MAX_STROKES).forEach((stroke, i) => {
      this.pool[i].update(stroke, opacityMultiplier);
    });
    for (let i = strokes.length; i < MAX_STROKES; i++) {
      this.pool[i].update([], 0);
    }
  }

  dispose() {
    this.pool.forEach((renderer) => renderer.dispose());
  }
}