// Composants webcam + canvas de tracé, hooks de tracking et de capture de geste, store
import { WebcamFeed } from "./components/WebcamFeed";
import { TrackingCanvas } from "./components/TrackingCanvas";
import { useHandTracking } from "./hooks/useHandTracking";
import { useGestureCapture } from "./hooks/useGestureCapture";
import { useHandStore } from "./state/useHandStore";
import { useGestureStore } from "./state/useGestureStore";

function App() {
  const { ready, startLoop } = useHandTracking();
  const isDetected = useHandStore((s) => s.isDetected);
  const pointCount = useGestureStore((s) =>
    s.strokes.reduce((sum, st) => sum + st.length, 0)
  );
  const isDrawing = useGestureStore((s) => s.phase === "active");

  // Active l'écoute des landmarks pour piloter la capture de tracé (poing fermé = validation)
  useGestureCapture();

  return (
    <div className="relative h-screen w-screen bg-black">
      <WebcamFeed onVideoReady={startLoop} />
      <TrackingCanvas />
      <div className="absolute left-2.5 top-2.5 rounded bg-black/50 px-2 py-2 font-mono text-white">
        MediaPipe: {ready ? "prêt" : "chargement..."} <br />
        Main détectée: {isDetected ? "oui" : "non"} <br />
        Tracé actif: {isDrawing ? "oui" : "non"} <br />
        Points capturés: {pointCount}
      </div>
    </div>
  );
}

export default App;