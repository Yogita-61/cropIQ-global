
export enum YieldCategory {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface CropData {
  cropName: string;
  region: string;
  rainfall: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export interface AdvisoryResult {
  yieldPrediction: string;
  irrigationAdvisory: string;
  fertilizationAdvisory: string;
  pestControlAdvisory: string;
  explanation: string;
}

export interface ImageAnalysisResult {
  healthStatus: string;
  identifiedIssues: string[];
  recommendations: string;
  confidenceScore: string;
}

export interface SustainabilityInsight {
  title: string;
  content: string;
  tag: string;
  methodology?: string;
}

export interface LanguageInfo {
  name: string;
  code: string; // ISO 639-1
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { name: 'English', code: 'en' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Russian', code: 'ru' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Punjabi', code: 'pa' },
  { name: 'Marathi', code: 'mr' },
  { name: 'Telugu', code: 'te' },
  { name: 'Tamil', code: 'ta' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Vietnamese', code: 'vi' },
  { name: 'German', code: 'de' },
  { name: 'Javanese', code: 'jw' },
  { name: 'Korean', code: 'ko' },
  { name: 'Italian', code: 'it' },
  { name: 'Gujarati', code: 'gu' },
  { name: 'Kannada', code: 'kn' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Swahili', code: 'sw' },
  { name: 'Thai', code: 'th' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Urdu', code: 'ur' },
];

export type Page = 'home' | 'prediction' | 'analysis' | 'live_scan' | 'assistant' | 'insights';

export interface UIStrings {
  home: string;
  prediction: string;
  analysis: string;
  live_scan: string;
  assistant: string;
  insights: string;
  tagline: string;
  welcome: string;
  start_prediction: string;
  talk_to_ai: string;
  yield_forecaster: string;
  crop_name: string;
  region: string;
  rainfall: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  generate: string;
  health_scanner: string;
  upload_desc: string;
  scan_btn: string;
  voice_assistant_title: string;
  type_placeholder: string;
  sustainable_title: string;
  educational_tips: string;
  predicting: string;
  analyzing: string;
  thinking: string;
  confidence: string;
  detected_issues: string;
  recommendations: string;
  live_vision_title: string;
  live_vision_desc: string;
}

export const DEFAULT_UI_STRINGS: UIStrings = {
  home: 'Home',
  prediction: 'Yield',
  analysis: 'Scan',
  live_scan: 'Live',
  assistant: 'Ask',
  insights: 'Lab',
  tagline: 'The Future of Smart Farming.',
  welcome: 'Multimodal AI at your service. Predict yields, scan diseases, and talk to your crops with CropIQ.',
  start_prediction: 'Start Yield Prediction',
  talk_to_ai: 'Talk to AI',
  yield_forecaster: 'Yield Forecaster',
  crop_name: 'Crop Name',
  region: 'Region/Country',
  rainfall: 'Rainfall (mm)',
  nitrogen: 'Nitrogen (N)',
  phosphorus: 'Phosphorus (P)',
  potassium: 'Potassium (K)',
  generate: 'Generate Prediction',
  health_scanner: 'Crop Health Scanner',
  upload_desc: 'Upload or snap a photo of your leaf or plant to identify issues.',
  scan_btn: 'Scan Crop Health',
  voice_assistant_title: 'CropIQ Voice Assistant',
  type_placeholder: 'Type or use voice...',
  sustainable_title: 'Sustainability Lab',
  educational_tips: 'Advanced ecological methods to double your yield sustainably.',
  predicting: 'Analyzing...',
  analyzing: 'Processing Visuals...',
  thinking: 'CropIQ is thinking...',
  confidence: 'AI Confidence',
  detected_issues: 'Detected Issues',
  recommendations: 'Recommendations',
  live_vision_title: 'Live Vision AI',
  live_vision_desc: 'Point your camera at a crop for real-time identification and health insights.'
};
