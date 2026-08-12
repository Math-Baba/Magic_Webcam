// Hooks react pour gérer la référence vidéo et le cycle de vie du flux
import { useEffect, useRef } from "react"

// Props: callback déclenché quand la vidéo est prête à être lue
interface WebcamFeedProps {
    onVideoReady: (video: HTMLVideoElement) => void;
}

// Composant qui démarre la webcam et affiche le flux en plein écran (effet miroir)
export function WebcamFeed({ onVideoReady }: WebcamFeedProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    // Démarre le flux webcam au montage, l'arrête au démontage
    useEffect(() => {
        let stream: MediaStream;

        async function startWebcam(){
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
            });

            if (videoRef.current){
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                onVideoReady(videoRef.current)
            }
        }

        startWebcam();

        return () => {
            stream?.getTracks().forEach((track) => track.stop());
        }
    }, [onVideoReady])

    // Vidéo en fond, object-cover, flip horizontal pour l'effet miroir
    return (
        <video 
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]"
            muted
            playsInline
        />
    ) 
}