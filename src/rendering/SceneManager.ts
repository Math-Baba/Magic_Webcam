// Three.js core pour la scène et le renderer, transparent pour laisser voir la webcam derrière
import * as THREE from "three";

// Classe qui encapsule la scène Three.js de base (le composer bloom est géré à part dans TrackingCanvas)
export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    // Caméra orthographique en coordonnées normalisées (0-1), alignée sur les landmarks MediaPipe
    // left=0, right=1, top=1, bottom=0 pour que Y monte vers le haut dans l'espace de la caméra
    this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // fond transparent : la webcam reste visible derrière le canvas
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Tone mapping ACES pour un rendu bloom plus cinématographique
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  // Redimensionne le renderer selon la taille du conteneur
  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
  }

  // Nettoyage complet du renderer
  dispose() {
    this.renderer.dispose();
  }
}