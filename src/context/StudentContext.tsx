import React, { createContext, useContext, useState } from 'react';

// Define types for our state
interface AnsweredQuestion {
  questionId: string;
  score: number;
}

interface StudentState {
  name: string;
  location: string;
  activeLecture: string;
  activeLesson: string;
  answeredQuestions: AnsweredQuestion[];
}

interface StudentContextType extends StudentState {
  setName: (name: string) => void;
  setLocation: (location: string) => void;
  setActiveLecture: (lecture: string) => void;
  setActiveLesson: (lesson: string) => void;
  addAnsweredQuestion: (question: AnsweredQuestion) => void;
  getStatusDescription: () => string;
}

// Utility function to format current date and time
const getCurrentDateTime = (): string => {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                 'August', 'September', 'October', 'November', 'December'];

  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  // Add appropriate suffix to day number
  const getDaySuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `Today is ${dayName} the ${day}${getDaySuffix(day)} of ${month} and it is ${hours}:${minutes}`;
};

// Create context
const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Create provider component
export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StudentState>({
    name: '',
    location: '',
    activeLecture: '',
    activeLesson: '',
    answeredQuestions: [],
  });

  const setName = (name: string) => {
    setState(prev => ({ ...prev, name }));
  };

  const setLocation = (location: string) => {
    setState(prev => ({ ...prev, location }));
  };

  const setActiveLecture = (activeLecture: string) => {
    setState(prev => ({ ...prev, activeLecture }));
  };

  const setActiveLesson = (activeLesson: string) => {
    setState(prev => ({ ...prev, activeLesson }));
  };

  const addAnsweredQuestion = (question: AnsweredQuestion) => {
    setState(prev => {
      // Check if question already exists
      if (prev.answeredQuestions.some(q => q.questionId === question.questionId)) {
        return prev; // Return previous state without changes
      }
      // Add new question if it doesn't exist
      return {
        ...prev,
        answeredQuestions: [...prev.answeredQuestions, question],
      };
    });
  };

  const getStatusDescription = (): string => {
    const basicInfo = `The current student's name is ${state.name}. The student is located in [${state.location}]. ${getCurrentDateTime()}.\n`;

    const lectureInfo = `The active lecture is "${state.activeLecture}" and the active lesson is "${state.activeLesson}".\n`;

    let questionsInfo = 'The user has answered the following questions:\n';
    if (state.answeredQuestions.length === 0) {
      questionsInfo += '* No questions answered yet\n';
    } else {
      state.answeredQuestions.forEach(q => {
        questionsInfo += `* "${q.questionId}" and achieved ${q.score} points\n`;
      });
    }

    console.debug(`${basicInfo}${lectureInfo}${questionsInfo}`)
    
    return `${basicInfo}${lectureInfo}${questionsInfo}`;
  };

  return (
    <StudentContext.Provider
      value={{
        ...state,
        setName,
        setLocation,
        setActiveLecture,
        setActiveLesson,
        addAnsweredQuestion,
        getStatusDescription,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

// Custom hook to use the student service
export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};