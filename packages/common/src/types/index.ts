export interface User {
  id: string;
  email: string;
  username: string;
  role: 'student' | 'admin' | 'moderator';
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  type: 'mcq' | 'fill-blank';
  content: string;
  options?: string[];
  correctAnswer: string | number;
  subject: string;
  chapter: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdBy: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: string[];
  timeLimit?: number;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, any>;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
