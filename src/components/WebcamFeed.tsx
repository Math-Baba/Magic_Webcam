// Hooks React pour gérer la référence vidéo et le cycle de vie du flux
import { useEffect, useRef } from "react";

interface WebcamFeedProps {
  onVideoReady: (video: HTMLVideoElement) => void;
}

// Composant qui démarre la webcam en résolution modérée (perf de détection) et l'affiche en miroir
export function WebcamFeed({ onVideoReady }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream;

    async function startWebcam() {
      // 640x480 suffit largement pour le hand tracking et réduit nettement la charge de calcul
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        onVideoReady(videoRef.current);
      }
    }

    startWebcam();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onVideoReady]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]"
      playsInline
      muted
    />
  );
}