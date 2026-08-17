// Three.js core uniquement — rendu du tracé sous forme de ruban mesh (buffer réutilisé, pas Line2)
import * as THREE from "three";
import type { TracePoint } from "../../state/useGestureStore";

const MAX_POINTS = 250;
// Demi-largeur au niveau du bout du doigt, réduite pour un trait plus fin et élégant
const HEAD_HALF_WIDTH = 0.006;

// Classe qui affiche UN trait sous forme de ruban lumineux en traînée de comète
export class TrailRenderer {
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshBasicMaterial;
  private positions: Float32Array;
  private colors: Float32Array;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_POINTS * 2 * 3);
    this.colors = new Float32Array(MAX_POINTS * 2 * 4);

    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 4));

    const indices: number[] = [];
    for (let i = 0; i < MAX_POINTS - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      indices.push(a, b, c, b, d, c);
    }
    this.geometry.setIndex(indices);
    this.geometry.setDrawRange(0, 0);

    this.material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    scene.add(this.mesh);
  }

  // Reconstruit le ruban à partir des points d'UN trait (mute les buffers existants)
  update(points: TracePoint[], opacityMultiplier = 1) {
    if (points.length < 2) {
      this.geometry.setDrawRange(0, 0);
      return;
    }

    const recentPoints = points.slice(-MAX_POINTS);
    const n = recentPoints.length;
    const world = recentPoints.map((p) => ({ x: 1 - p.x, y: 1 - p.y }));

    for (let i = 0; i < n; i++) {
      const point = world[i];
      const prev = world[Math.max(0, i - 1)];
      const next = world[Math.min(n - 1, i + 1)];
      const tangentX = next.x - prev.x;
      const tangentY = next.y - prev.y;
      const length = Math.hypot(tangentX, tangentY) || 1;
      const normalX = -tangentY / length;
      const normalY = tangentX / length;

      const progress = n > 1 ? i / (n - 1) : 1;
      const halfWidth = HEAD_HALF_WIDTH * progress;

      const leftIndex = i * 2 * 3;
      const rightIndex = leftIndex + 3;

      this.positions[leftIndex] = point.x + normalX * halfWidth;
      this.positions[leftIndex + 1] = point.y + normalY * halfWidth;
      this.positions[leftIndex + 2] = 0;
      this.positions[rightIndex] = point.x - normalX * halfWidth;
      this.positions[rightIndex + 1] = point.y - normalY * halfWidth;
      this.positions[rightIndex + 2] = 0;

      // Dégradé plus doux, moins saturé/blanc en tête qu'avant
      const alpha = progress * opacityMultiplier * 0.8;
      const r = 0.5 + 0.3 * progress;
      const g = 0.25 + 0.35 * progress;
      const b = 0.85;

      const colorLeftIndex = i * 2 * 4;
      const colorRightIndex = colorLeftIndex + 4;

      this.colors[colorLeftIndex] = r;
      this.colors[colorLeftIndex + 1] = g;
      this.colors[colorLeftIndex + 2] = b;
      this.colors[colorLeftIndex + 3] = alpha;
      this.colors[colorRightIndex] = r;
      this.colors[colorRightIndex + 1] = g;
      this.colors[colorRightIndex + 2] = b;
      this.colors[colorRightIndex + 3] = alpha;
    }

    this.geometry.setDrawRange(0, (n - 1) * 6);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}