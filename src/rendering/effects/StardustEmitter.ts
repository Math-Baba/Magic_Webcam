// Three.js pour un système de particules basé sur THREE.Points (léger et performant)
import * as THREE from "three";
import type { TracePoint } from "../../state/useGestureStore";

// Nombre max de particules vivantes simultanément
const MAX_PARTICLES = 800;
// Durée de vie d'une particule en secondes
const PARTICLE_LIFETIME = 0.9;
// Nombre de particules générées par point de tracé ajouté
const PARTICLES_PER_EMIT = 3;

// Une particule individuelle de poussière d'étoile
interface Particle {
  x: number;
  y: number;
  vx: number; // vitesse x
  vy: number; // vitesse y
  age: number; // temps écoulé depuis la naissance (s)
  size: number;
  active: boolean;
}

// Classe qui gère un système de particules "poussière d'étoile" le long du tracé magique
export class StardustEmitter {
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private particles: Particle[] = [];
  private positions: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;
  private lastEmitPoint: { x: number; y: number } | null = null;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);
    this.opacities = new Float32Array(MAX_PARTICLES);

    // Pool de particules pré-alloué : on ne crée jamais d'objet en cours de route (perf)
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({ x: 0, y: 0, vx: 0, vy: 0, age: 0, size: 0, active: false });
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));

    // Texture de particule générée par canvas : un point lumineux doux (glow radial)
    const sprite = this.createGlowTexture();

    // Matériau additive blending : les particules superposées s'illuminent entre elles (effet magique)
    this.material = new THREE.PointsMaterial({
      size: 0.025,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffe9b3, // teinte dorée, contraste bien avec le violet du trail
      vertexColors: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  // Génère une texture radiale douce en canvas 2D, utilisée comme sprite de particule
  private createGlowTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.3, "rgba(255,230,180,0.8)");
    gradient.addColorStop(1, "rgba(255,230,180,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Fait naître de nouvelles particules autour du dernier point du tracé
  private spawnAt(x: number, y: number) {
    for (let i = 0; i < PARTICLES_PER_EMIT; i++) {
      const free = this.particles.find((p) => !p.active);
      if (!free) return; // pool plein, on ignore silencieusement

      // Dispersion aléatoire autour du point d'origine + vitesse initiale aléatoire (effet "étincelles")
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.15;

      free.x = x + (Math.random() - 0.5) * 0.01;
      free.y = y + (Math.random() - 0.5) * 0.01;
      free.vx = Math.cos(angle) * speed;
      free.vy = Math.sin(angle) * speed - 0.05; // légère dérive vers le haut, comme de la poussière magique
      free.age = 0;
      free.size = 0.015 + Math.random() * 0.02;
      free.active = true;
    }
  }

  // À appeler à chaque frame avec les points actuels du tracé et le delta time
  update(tracePoints: TracePoint[], deltaSeconds: number, isEmitting: boolean) {
    // Émission de nouvelles particules si un nouveau point de tracé est apparu
    if (isEmitting && tracePoints.length > 0) {
      const last = tracePoints[tracePoints.length - 1];
      // Coordonnées flippées pour matcher l'orientation du trail (miroir vidéo + repère Three.js)
      const worldX = 1 - last.x;
      const worldY = 1 - last.y;

      if (
        !this.lastEmitPoint ||
        Math.hypot(worldX - this.lastEmitPoint.x, worldY - this.lastEmitPoint.y) > 0.008
      ) {
        this.spawnAt(worldX, worldY);
        this.lastEmitPoint = { x: worldX, y: worldY };
      }
    } else {
      this.lastEmitPoint = null;
    }

    // Simulation physique simple : gravité légère, friction, fade-out avec l'âge
    let visibleCount = 0;
    for (const particle of this.particles) {
      if (!particle.active) continue;

      particle.age += deltaSeconds;
      if (particle.age >= PARTICLE_LIFETIME) {
        particle.active = false;
        continue;
      }

      // Intégration de la vitesse + friction pour un mouvement qui ralentit naturellement
      particle.vx *= 0.94;
      particle.vy *= 0.94;
      particle.x += particle.vx * deltaSeconds;
      particle.y += particle.vy * deltaSeconds;

      const lifeRatio = particle.age / PARTICLE_LIFETIME;
      const opacity = 1 - lifeRatio;

      this.positions[visibleCount * 3] = particle.x;
      this.positions[visibleCount * 3 + 1] = particle.y;
      this.positions[visibleCount * 3 + 2] = 0;
      this.sizes[visibleCount] = particle.size * (1 - lifeRatio * 0.5);
      this.opacities[visibleCount] = opacity;

      visibleCount++;
    }

    // On ne dessine que les particules réellement actives (draw range dynamique)
    this.geometry.setDrawRange(0, visibleCount);
    this.geometry.attributes.position.needsUpdate = true;

    // L'opacité globale du matériau suit la particule la plus "fraîche" pour un fade cohérent
    this.material.opacity = visibleCount > 0 ? 1 : 0;
  }

  // Nettoyage complet
  dispose() {
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();
  }
}