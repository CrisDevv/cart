export interface Letter {
  id: string;
  title: string;
  date: string;
  content: string;
  mood: 'romantic' | 'poetic' | 'sorry' | 'nostalgic' | 'hopeful';
  isRead: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  icon?: string;
}

export interface Reply {
  id: string;
  text: string;
  timestamp: string;
}

export interface StoryConfig {
  securityQuestion: string;
  securityAnswer: string;
  hint: string;
  musicUrl: string;
  songTitle: string;
  songArtist: string;
  writerPassword: string;
  introText: string;
  coupleName1: string;
  coupleName2: string;
  anniversaryDate: string;
}

export interface StoryData {
  config: StoryConfig;
  letters: Letter[];
  timeline: TimelineEvent[];
  replies: Reply[];
}
