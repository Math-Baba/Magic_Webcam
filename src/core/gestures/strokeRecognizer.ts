// Type des points capturés par le tracé
import type { TracePoint } from "../../state/useGestureStore";

// Résultat renvoyé par le reconnaisseur
export interface RecognitionResult {
  matched: boolean;
  spellId: string | null;
  score: number;
}

// Points normalisés du pentagramme de référence, dans l'ordre de tracé classique (étoile à 5 branches)
const PENTAGRAM_TEMPLATE: { x: number; y: number }[] = [
  { x: 0.5, y: 0.0 },
  { x: 0.2, y: 0.95 },
  { x: 0.98, y: 0.35 },
  { x: 0.02, y: 0.35 },
  { x: 0.8, y: 0.95 },
  { x: 0.5, y: 0.0 },
];

// Longueur totale d'un chemin (somme des distances entre points consécutifs)
function pathLength(points: { x: number; y: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

// Rééchantillonne un tracé en N points équidistants le long de son chemin.
// Version robuste : ne mute jamais le tableau source, gère les segments de longueur nulle
// (points dupliqués, main immobile) sans boucler indéfiniment ni produire de NaN.
function resample(rawPoints: { x: number; y: number }[], n: number) {
  // Filtre les points strictement dupliqués consécutifs (distance ~0), source du bug de division par zéro
  const points = rawPoints.filter((p, i) => {
    if (i === 0) return true;
    const prev = rawPoints[i - 1];
    return Math.hypot(p.x - prev.x, p.y - prev.y) > 1e-6;
  });

  // Pas assez de points distincts pour rééchantillonner correctement : on duplique le seul point dispo
  if (points.length < 2) {
    const fallback = points[0] ?? { x: 0, y: 0 };
    return Array.from({ length: n }, () => ({ ...fallback }));
  }

  const totalLength = pathLength(points);
  const interval = totalLength / (n - 1);

  const resampled: { x: number; y: number }[] = [points[0]];
  let segmentStart = points[0];
  let segmentIndex = 1;
  let distanceSinceLastSample = 0;

  // On avance point par point le long du chemin d'origine, en semant un nouveau
  // point rééchantillonné à chaque fois qu'on a parcouru une distance = interval
  while (resampled.length < n && segmentIndex < points.length) {
    const segmentEnd = points[segmentIndex];
    const segmentLength = Math.hypot(segmentEnd.x - segmentStart.x, segmentEnd.y - segmentStart.y);

    if (distanceSinceLastSample + segmentLength >= interval) {
      const t = (interval - distanceSinceLastSample) / segmentLength;
      const newPoint = {
        x: segmentStart.x + t * (segmentEnd.x - segmentStart.x),
        y: segmentStart.y + t * (segmentEnd.y - segmentStart.y),
      };
      resampled.push(newPoint);
      segmentStart = newPoint;
      distanceSinceLastSample = 0;
    } else {
      distanceSinceLastSample += segmentLength;
      segmentStart = segmentEnd;
      segmentIndex++;
    }
  }

  // Complète avec le dernier point si on n'a pas atteint exactement n (arrondis flottants)
  while (resampled.length < n) resampled.push(points[points.length - 1]);

  return resampled;
}

// Centre un tracé sur son centroïde (pour ignorer la position absolue dans l'écran)
function centerOnCentroid(points: { x: number; y: number }[]) {
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 }
  );
  return points.map((p) => ({ x: p.x - centroid.x, y: p.y - centroid.y }));
}

// Met à l'échelle un tracé pour qu'il tienne dans un carré unité (ignore la taille absolue du geste)
function scaleToUnit(points: { x: number; y: number }[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const width = Math.max(...xs) - Math.min(...xs) || 1;
  const height = Math.max(...ys) - Math.min(...ys) || 1;
  return points.map((p) => ({ x: p.x / width, y: p.y / height }));
}

// Distance moyenne point à point entre deux tracés de même longueur (après normalisation)
function pathDistance(a: { x: number; y: number }[], b: { x: number; y: number }[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y);
  }
  return sum / a.length;
}

// Seuil de distance sous lequel on considère le tracé comme un pentagramme valide
const MATCH_THRESHOLD = 0.35;
const RESAMPLE_POINTS = 32;

// Compare le tracé capturé au template du pentagramme et renvoie un score de confiance
export function recognizeStroke(rawPoints: TracePoint[]): RecognitionResult {
  if (rawPoints.length < 5) {
    return { matched: false, spellId: null, score: 0 };
  }

  const normalized = scaleToUnit(centerOnCentroid(resample(rawPoints, RESAMPLE_POINTS)));
  const template = scaleToUnit(centerOnCentroid(resample(PENTAGRAM_TEMPLATE, RESAMPLE_POINTS)));

  const distance = pathDistance(normalized, template);
  const score = Math.max(0, 1 - distance / MATCH_THRESHOLD);

  return {
    matched: distance <= MATCH_THRESHOLD,
    spellId: distance <= MATCH_THRESHOLD ? "pentagram-generic" : null,
    score,
  };
}