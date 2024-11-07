// src/types/lecture.ts
export interface Step {
  stepNumber: number;
  title: string;
  duration: number;
  narrative: string;
  type: 'video' | 'iframe' | 'slide';
  url: string;
}

export interface Discussion {
  prompt: string;
}

export interface Lesson {
  lessonId: string;
  sequenceNumber: number;
  title: string;
  presentation: Step[];
  discussion: Discussion;
}

export interface Lecture {
  title: string;
  id: string;
  language: string;
  lessons: Lesson[];
}