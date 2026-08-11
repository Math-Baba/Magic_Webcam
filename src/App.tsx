// Composant webcam, hook de tracking, et store pour afficher l'état de détection
import { WebcamFeed } from "./components/WebcamFeed";
import { useHandTracking } from "./hooks/useHandTracking";
import { useHandStore } from "./state/useHandStore";

function App() {
  const { ready, startLoop } = useHandTracking();
  const landmarks = useHandStore((s) => s.landmarks);
  const isDetected = useHandStore((s) => s.isDetected);

  // Conteneur plein écran : webcam en fond + overlay de debug en haut à gauche
  return (
    <div className="relative h-screen w-screen bg-black">
      <WebcamFeed onVideoReady={startLoop} />
      <div className="absolute left-2.5 top-2.5 rounded bg-black/50 px-2 py-2 font-mono text-white">
        MediaPipe: {ready ? "prêt" : "chargement..."} <br />
        Main détectée: {isDetected ? "oui" : "non"} <br />
        Points: {landmarks?.length ?? 0}
      </div>
    </div>
  );
}

export default App;