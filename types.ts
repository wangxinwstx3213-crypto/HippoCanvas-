

export type NodeType = 'IMAGE_UPLOAD' | 'GENERATE_IMAGE';

export interface Position {
  x: number;
  y: number;
}

export interface Annotation {
  id: number;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
}

export interface Layer {
  id: string;
  name: string;
  prompt: string;
  isEnabled: boolean;
}

export interface NodeData {
  title: string;
  displayId: number; // Unique display number for the node (e.g., 1, 2, 3)
  // For upload nodes
  imageUrl?: string;
  annotations?: Annotation[]; // Points marked on the image
  // For generation nodes
  layers?: Layer[]; // Replaces single prompt string
  prompt?: string; // Kept for backward compatibility or final compiled prompt

  // Generation Results
  generatedImage?: string; // The currently active/selected image (for downstream connections)
  generatedImages?: string[]; // Array of all generated images in this batch
  selectedImageIndex?: number; // Index of the currently selected image

  status?: 'idle' | 'loading' | 'success' | 'error';

  // Generation Config
  model?: string; // AI model selection
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
  imageResolution?: '1K' | '2K' | '4K';
  numberOfImages?: number;
}

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  width: number;
  height: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  scale: number;
  offset: Position;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'error';
  nodeId: string;
  summary: string;
  data: any;
}

export interface SystemSettings {
  baseUrl: string;
  modelName: string;
}