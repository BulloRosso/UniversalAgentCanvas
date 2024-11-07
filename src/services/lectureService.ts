// src/services/lectureService.ts
import axios from 'axios';
import { Lecture } from '../types/lecture';

const LECTURE_API_URL = import.meta.env.VITE_API_URL + 'api/lecture/OCR-101';

export const fetchLecture = async (): Promise<Lecture> => {
  try {
    const response = await axios.get<Lecture>(LECTURE_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching lecture:', error);
    throw error;
  }
};