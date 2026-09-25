/** Normalized box (0…1), top-left origin. */
export type Box = { x: number; y: number; w: number; h: number };

export type FaceObservation = Box & { confidence: number };
export type TextObservation = Box & { text: string; confidence: number };
export type DocumentObservation = Box & { confidence: number };

export type PhotoMetadata = {
  hasGPS: boolean;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
  takenAt?: string;
};

export type AnalysisResult = {
  width: number;
  height: number;
  faces: FaceObservation[];
  texts: TextObservation[];
  documents: DocumentObservation[];
  metadata: PhotoMetadata;
  durationMs: number;
};

export type RedactRegion = Box & { shape?: 'ellipse' | 'rect'; padding?: number };

export type RedactResult = { uri: string; width: number; height: number; metadataRemoved: boolean };
