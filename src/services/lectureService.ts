// src/services/lectureService.ts
import axios from 'axios';
import { Lecture } from '../types/lecture';

const LECTURE_API_URL = 'https://dee09cc9-22ed-465f-8839-fe8c5be2f694-00-hm6w1lz6dlro.riker.replit.dev/api/lecture/OCR-101';

export const fetchLecture = async (): Promise<Lecture> => {
  try {
    const response = await axios.get<Lecture>(LECTURE_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching lecture:', error);
    throw error;
  }
};