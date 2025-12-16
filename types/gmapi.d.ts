// GMAPI Type Definitions
export interface GMAPIConfig {
  apiKey: string;
  baseUrl?: string;
  outputDir?: string;
  logDir?: string;
  enableLogging?: boolean;
  defaultModel?: string;
  timeout?: number;
}

export interface GenerateOptions {
  prompt: string;
  model?: string;
  filename?: string;
  maxTokens?: number;
  saveImage?: boolean;
  saveLog?: boolean;
  referenceImages?: string[];
  imageSize?: string;
  aspectRatio?: string;
}

export interface GenerateResult {
  success: boolean;
  prompt: string;
  model: string;
  requestId: string;
  timestamp: string;
  duration: number;
  hasImage: boolean;
  imageData?: {
    format: string;
    base64Data: string;
    description: string;
    markdownImages: string[];
  };
  imagePath?: string;
  logPath?: string;
  error?: string;
}

export interface GeneratorStatus {
  initialized: boolean;
  apiKey: boolean;
  baseUrl: string;
  defaultModel: string;
  outputDir: string;
  logDir: string;
  lastRequest?: {
    timestamp: string;
    success: boolean;
    duration: number;
    model: string;
  };
}

export declare class GeminiImageGenerator {
  constructor(config: GMAPIConfig);

  generate(options: GenerateOptions): Promise<GenerateResult>;

  batchGenerate(
    options: GenerateOptions[] | GenerateOptions[],
    batchOptions?: any,
    onProgress?: (progress: number, current: any) => void
  ): Promise<GenerateResult[]>;

  getStatus(): GeneratorStatus;

  testConnection(): Promise<any>;
}

export declare function initGemini(config: GMAPIConfig): GeminiImageGenerator;

export declare function generateImage(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;

export declare function generateMultipleImages(
  prompts: string[],
  options?: GenerateOptions,
  onProgress?: (progress: number, current: any) => void
): Promise<GenerateResult[]>;

export declare function generateImage25(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;

export declare function generateImage3Pro(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;

export declare function testAPI(config?: GMAPIConfig): Promise<any>;

export declare function getGeneratorStatus(): GeneratorStatus;

export declare function cleanup(): void;