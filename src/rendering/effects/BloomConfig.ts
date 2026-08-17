// Composants de post-processing Three.js pour un effet de bloom plus subtil
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// Construit et configure le pipeline de rendu avec bloom, réglé pour un glow présent mais pas criard
export function createBloomComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number,
  height: number
) {
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);

  composer.addPass(new RenderPass(scene, camera));

  // Force réduite (1.8 -> 1.0), rayon réduit, seuil augmenté = glow plus discret et localisé
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    1.0,  // strength
    0.4,  // radius
    0.25  // threshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  return { composer, bloomPass };
}