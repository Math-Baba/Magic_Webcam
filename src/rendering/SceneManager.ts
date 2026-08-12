// Import Three.js pour la scène, caméra orthographique et renderer 
import * as THREE from "three"

// Classe qui encapsule la scène Three.js en overlay 2D par dessus la webcam
export class SceneManager {
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene()

        // Caméra orthographique en coordonnées normalisées (0-1) pour matcher les landmarks
        this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1)

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true, // fond transparent pour voir la webcam derrière
            antialias: true,
        })
        this.renderer.setPixelRatio(window.devicePixelRatio)
    }

    // Redimensionne le renderer selon la taille du conteneur
    resize(width: number, height: number) {
        this.renderer.setSize(width, height)
        this.camera.updateProjectionMatrix()
    }

    // Rendu d'une frame
    render() {
        this.renderer.render(this.scene, this.camera)
    }

    // Nettoyage complet du renderer
    dispose() {
        this.renderer.dispose()
    }
}