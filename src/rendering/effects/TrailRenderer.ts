// Rendu du tracé (glow trail)
// Import Three.js pour construire une ligne stylisée à partir des points du tracé
import * as THREE from "three";
import type { TracePoint } from "../../state/useGestureStore";

// Classe qui gère l'affichage du tracé en cours sous forme de ligne lumineuse
export class TrailRenderer {
  private line: THREE.Line;
  private geometry: THREE.BufferGeometry;
  private maxPoints = 200;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();

    // Matériau lumineux violet/magenta, cohérent avec un thème "magie"
    const material = new THREE.LineBasicMaterial({
      color: 0xb266ff,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });

    this.line = new THREE.Line(this.geometry, material);
    scene.add(this.line);
  }

  // Met à jour la géométrie de la ligne à partir des points du tracé (coords normalisées, Y inversé)
  update(points: TracePoint[]) {
    const recentPoints = points.slice(-this.maxPoints);

    const positions = new Float32Array(recentPoints.length * 3);
    recentPoints.forEach((p, i) => {
      // Flip horizontal pour matcher l'effet miroir de la vidéo, flip vertical pour l'espace Three.js
      positions[i * 3] = 1 - p.x;
      positions[i * 3 + 1] = 1 - p.y;
      positions[i * 3 + 2] = 0;
    });

    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setDrawRange(0, recentPoints.length);
  }

  // Nettoyage
  dispose() {
    this.geometry.dispose();
  }
}