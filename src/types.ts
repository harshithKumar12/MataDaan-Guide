export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ElectionStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AppState {
  isFirstTimeVoter: boolean | null;
  location: string;
  learningLevel: LearningLevel;
  currentStepIndex: number;
}
