import { useEffect, useRef } from "react"
import { SceneManager } from "../rendering/SceneManager"
import { TrailRenderer } from "../rendering/effects/TrailRenderer"
import { useGestureStore } from "../state/useGestureStore"

// COmposant qui affiche le canvas Three.js en overlay et anime le tracé en temps réel
export function TrackingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if(!canvas) return 

        // Initialisation de la scène et du rendu de trail
        const sceneManager = new SceneManager(canvas)
        const trailRenderer = new TrailRenderer(sceneManager.scene)

        // Redimensionnement initial + resize de la fenêtre
        function handleResize(){
            sceneManager.resize(window.innerWidth, window.innerHeight)
        }
        handleResize()
        window.addEventListener("resize", handleResize)

        // Boucle d'animation : lit le tracé courant depuis le store et met à jour le rendu
        function animate() {
            const points = useGestureStore.getState().points
            trailRenderer.update(points)
            sceneManager.render()
            rafRef.current = requestAnimationFrame(animate)
        }
        animate()

        // Nettoyage complet au démontage
        return () => {
            window.removeEventListener("resize", handleResize)
            if(rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            trailRenderer.dispose()
            sceneManager.dispose()
        }
    }, [])

    return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full"/>
}