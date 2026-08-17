// Hooks React + gestionnaire de scène, rendu multi-traits, poussière d'étoiles et bloom + store
import { useEffect, useRef } from "react";
import { SceneManager } from "../rendering/SceneManager";
import { MultiStrokeTrailRenderer } from "../rendering/effects/MultiStrokeTrailRenderer";
import { StardustEmitter } from "../rendering/effects/StardustEmitter";
import { createBloomComposer } from "../rendering/effects/BloomConfig";
import { useGestureStore } from "../state/useGestureStore";

const RESOLVE_DURATION_MS = 1200;
const BASE_BLOOM_STRENGTH = 1.0;
const FLASH_BLOOM_BOOST = 0.6;

export function TrackingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const sceneManager = new SceneManager(canvas);
    const trailRenderer = new MultiStrokeTrailRenderer(sceneManager.scene);
    const stardustEmitter = new StardustEmitter(sceneManager.scene);
    const { composer, bloomPass } = createBloomComposer(
      sceneManager.renderer,
      sceneManager.scene,
      sceneManager.camera,
      width,
      height
    );

    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      sceneManager.resize(w, h);
      composer.setSize(w, h);
    }
    handleResize();
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();
    function animate() {
      const now = performance.now();
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const gesture = useGestureStore.getState();
      const isActive = gesture.phase === "active";

      if (isActive) {
        trailRenderer.update(gesture.strokes, 1);
        bloomPass.strength = BASE_BLOOM_STRENGTH;
      } else if (gesture.phase === "locked" || gesture.phase === "resolving") {
        const elapsed = gesture.lockedAt ? now - gesture.lockedAt : 0;
        const progress = Math.min(elapsed / RESOLVE_DURATION_MS, 1);
        const fadeOpacity = 1 - progress;

        trailRenderer.update(gesture.strokes, fadeOpacity);
        bloomPass.strength = BASE_BLOOM_STRENGTH + (1 - progress) * FLASH_BLOOM_BOOST;
      } else {
        trailRenderer.update([], 0);
        bloomPass.strength = BASE_BLOOM_STRENGTH;
      }

      // La poussière d'étoile n'émet que sur le trait courant, quand le stylo est posé
      const currentStroke = gesture.strokes[gesture.strokes.length - 1] ?? [];
      stardustEmitter.update(currentStroke, deltaSeconds, isActive && gesture.isPenDown);

      composer.render();
      rafRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      trailRenderer.dispose();
      stardustEmitter.dispose();
      sceneManager.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}