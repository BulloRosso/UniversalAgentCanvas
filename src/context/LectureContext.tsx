
// src/context/LectureContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Lecture } from '../types/lecture';

interface LectureContextType {
  lecture: Lecture | null;
  loading: boolean;
  error: string | null;
}

const LectureContext = createContext<LectureContextType>({
  lecture: null,
  loading: true,
  error: null,
});

export const useLecture = () => useContext(LectureContext);

export const LectureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await axios.get('https://dee09cc9-22ed-465f-8839-fe8c5be2f694-00-hm6w1lz6dlro.riker.replit.dev/api/lecture/OCR-101');
        setLecture(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lecture:', err);
        setError('Failed to load lecture data');
        setLoading(false);
      }
    };

    fetchLecture();
  }, []);

  return (
    <LectureContext.Provider value={{ lecture, loading, error }} children={children} />
  );
};