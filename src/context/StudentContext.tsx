import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  updatedContext: string[];
  answeredQuestions: AnsweredQuestion[];
  preferredLanguage: string;
}

interface StudentContextType extends StudentState {
  setName: (name: string) => void;
  setLocation: (location: string) => void;
  setActiveLecture: (lecture: string) => void;
  setActiveLesson: (lesson: string) => void;
  addAnsweredQuestion: (question: AnsweredQuestion) => void;
  getUpdatedContext: () => string[];
  getStatusDescription: () => string;
  setPreferredLanguage: (language: string) => void;
  addToUpdatedContext: (context: string) => void;
  clearUpdatedContext: () => void;
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
  
  const { t } = useTranslation();
  const [state, setState] = useState<StudentState>({
    name: 'Ralph',
    location: 'Yerevan',
    activeLecture: '',
    activeLesson: '',
    updatedContext: [],
    answeredQuestions: [],
    preferredLanguage: 'en',
  });

  const setName = (name: string) => {
    setState(prev => ({ ...prev, name }));
  };

  const addToUpdatedContext = (context: string) => {
    setState(prev => {
      // Add new information to the context
      return {
        ...prev,
        updatedContext: [...prev.updatedContext, context],
      };
    });
  }

  const setLocation = (location: string) => {
    setState(prev => ({ ...prev, location }));
  };

  const setActiveLecture = (activeLecture: string) => {
    setState(prev => ({ ...prev, activeLecture }));
  };

  const setActiveLesson = (activeLesson: string) => {
    setState(prev => ({ ...prev, activeLesson }));
  };

  const setPreferredLanguage = (language: string) => {
    setState(prev => ({ ...prev, preferredLanguage: language }));
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

  const getUpdatedContext = () => {
    return state.updatedContext;
  }

  const clearUpdatedContext = () => {
    setState(prev => ({ ...prev, updatedContext: [] }));
  }  
  
  const getStatusDescription = (): string => {
    
    const basicInfo = `The current student's name is ${state.name}. The student is located in [${state.location}]. ${getCurrentDateTime()}.\n`;

    const lectureInfo = `The active lecture is "${state.activeLecture}" and the active lesson is "${state.activeLesson}".\n`;

    const languageInfo = `Please respond in ${t(state.preferredLanguage)} language.\n`;
    
    let questionsInfo = 'The user has answered the following questions:\n';
    if (state.answeredQuestions.length === 0) {
      questionsInfo += '* No questions answered yet\n';
    } else {
      state.answeredQuestions.forEach(q => {
        questionsInfo += `* "${q.questionId}" and achieved ${q.score} points\n`;
      });
    }

    let questionList = `
    You have the following questions for the current lesson to test the students knowledge. In a response you can a) ask a question or b) show a slide using or c) do nothing and answer only. Use function calls IF the context is closely related to one of the following entities in the question:
    ----------------------
    * Question Q1 is "What does OCR stand for?"
* Question Q2 is "Which of these are key steps in the OCR process?"
* Question Q3 is "Order the following OCR preprocessing steps from first to last:"
* Question Q4 is "Which resolution is typically recommended as minimum for OCR processing?"
* Question Q5 is "Match these OCR types with their primary use cases:"
* Question Q6 is "Which of these factors can affect OCR accuracy?"
* Question Q7 is "What is the primary purpose of binarization in OCR?"
* Question Q8 is "Order the following OCR accuracy improvement steps from most to least important:"
* Question Q9 is "Which preprocessing techniques are commonly used in OCR?"
* Question Q10 is "What is the main difference between OCR and ICR?"
* Question Q11 is "Match the OCR terminology with its definition:"
* Question Q12 is "Which file formats are typically supported by OCR software?"
* Question Q13 is "What is the best color mode for OCR processing?"
* Question Q14 is "Order these stages in OCR character recognition from first to last:"
* Question Q15 is "Which types of text can modern OCR systems process?"
* Question Q16 is "What is the purpose of zoning in OCR?"
* Question Q17 is "Match these OCR challenges with their solutions:"
* Question Q18 is "Which elements can affect OCR template matching?"
* Question Q19 is "What is the main advantage of neural network-based OCR over template matching?"
* Question Q20 is "Order these OCR output formats by increasing complexity:"
* Question Q21 is "Which factors influence OCR processing speed?"
* Question Q22 is "What is the primary purpose of OCR dictionaries?"
* Question Q23 is "Match these OCR applications with their industries:"
* Question Q24 is "Which languages can modern OCR systems typically process?"
* Question Q25 is "What is the best approach for handling multi-column text in OCR?"
-------------------
    `;

    console.debug(`${basicInfo}\n${languageInfo}\n${lectureInfo}\n${questionsInfo}\n`)
    
    return `${basicInfo}\n${languageInfo}\n${lectureInfo}\n${questionsInfo}\n${questionList}$`;
  };

  return (
    <StudentContext.Provider
      value={{
        ...state,
        setName,
        setLocation,
        setActiveLecture,
        setActiveLesson,
        setPreferredLanguage,
        addAnsweredQuestion,
        addToUpdatedContext,
        getUpdatedContext,
        clearUpdatedContext,
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