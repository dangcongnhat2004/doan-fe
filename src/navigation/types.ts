import { Question } from "../types";
import { SubmitExamResponse } from "../api/examService";
import { QuestionDetail } from "../api/questionService";

export type RootStackParamList = {
  Register: undefined;
  Login: { successMessage?: string } | undefined;
  Home: undefined;
  ReviewExam: { 
    reviewData: Question[]; 
    examResult?: SubmitExamResponse;
    examId?: string;
    startedAt?: string;
  };

  ExamMainPage: undefined;
  ExamDoingPage: { examId: string };

  Upload: undefined;
  ReviewQuestions: {
    questions?: Array<
      | {
          // Extracted questions (from file)
          id: string;
          questionText: string;
          questionImage?: string;
          topic: string;
          difficulty: "Dễ" | "Trung bình" | "Khó" | "";
          status: "under_review" | "standardized";
          order: number;
        }
      | {
          // Direct add questions (with choices)
          id: string;
          questionText: string;
          choices: Array<{
            id: string;
            label: string;
            text: string;
            isCorrect: boolean;
          }>;
          topic: string;
        }
    >;
    fileUri?: string;
  };
  
  ImportQuestions: {
    questions: Array<
      | {
          // Extracted questions (from file)
          id: string;
          questionText: string;
          questionImage?: string;
          topic: string;
          difficulty: "Dễ" | "Trung bình" | "Khó" | "";
          status: "under_review" | "standardized";
          order: number;
        }
      | {
          // Direct add questions (with choices)
          id: string;
          questionText: string;
          choices: Array<{
            id: string;
            label: string;
            text: string;
            isCorrect: boolean;
          }>;
          topic: string;
        }
    >;
  };
  QuestionManagement: undefined;
  QuestionSetDetail: {
    userId: string;
    setId: string;
  };
  Search: undefined;
  LearningTools: undefined;
  FlashcardDetail: {
    userId: string;
    setId: string;
  };
  FlashcardSession: {
    questions: QuestionDetail[];
    setId: string;
    title: string;
  };
  FlashcardWhiteboard: undefined;
};
