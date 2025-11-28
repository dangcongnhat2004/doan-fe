import { Choice, Exam, Question, RecentActivity, Topic, User } from "../types";

export type ExamStatus = "draft" | "published" | "in-progress" | "completed";

// Mock Users
export const mockUsers: User[] = [
  {
    user_id: "user_001",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    role: "teacher",
    created_at: "2024-01-15T10:00:00Z",
  },
];

// Mock Exams
export const mockExams: Exam[] = [
  {
    exam_id: "exam_001",
    title: "Đề thi Toán cao cấp",
    description: "Đề thi cuối kỳ môn Toán cao cấp với 50 câu hỏi trắc nghiệm",
    question_count: 50,
    duration: 90,
    status: "in-progress",
    progress: 70,
    created_by: "user_001",
    created_at: "2024-05-20T09:30:00Z",
  },
  {
    exam_id: "exam_002",
    title: "Đề thi Vật lý đại cương",
    description: "Đề thi giữa kỳ môn Vật lý đại cương",
    question_count: 40,
    duration: 60,
    status: "completed",
    progress: 0,
    created_by: "user_001",
    created_at: "2024-05-18T14:20:00Z",
  },
];

// Mock Questions
export const mockQuestions: Question[] = [
  {
    question_id: "q_001",
    question_text: "Tính đạo hàm của hàm số f(x) = x^2 + 3x",
    topic_id: 1,
    bloom_level: "apply",
    difficulty: "medium",
    explanation: "Sử dụng công thức đạo hàm cơ bản",
    source: "Sách giáo khoa Toán 12",
    created_at: "2024-05-19T10:00:00Z",
    updated_at: "2024-05-19T10:00:00Z",
  },
];

export const mockAnswer: Choice[] = [
  {
    question_id: "q_001",
    text: "2x+3",
    choice_id: 1,
    label: "A",
    is_correct: false,
    is_selected: false,
  },
  {
    question_id: "q_001",
    text: "2x+5",
    choice_id: 2,
    label: "B",
    is_correct: false,
    is_selected: false,
  },
  {
    question_id: "q_001",
    text: "2x+2",
    choice_id: 3,
    label: "C",
    is_correct: false,
    is_selected: false,
  },
  {
    question_id: "q_001",
    text: "2x+10",
    choice_id: 4,
    label: "D",
    is_correct: false,
    is_selected: false,
  },
];

export const getChoices = (questionId: string): Choice[] => {
  return mockAnswer.filter((choice) => choice.question_id === questionId);
}

// Format date to Vietnamese format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Get recent activities from exams and questions
export const getRecentActivities = (): RecentActivity[] => {
  const activities: RecentActivity[] = [];

  // Add exam activities
  mockExams.forEach((exam) => {
    activities.push({
      id: `exam_${exam.exam_id}`,
      type: "exam",
      title: exam.title,
      description: `Đã tạo đề thi mới cho môn ${exam.title.split(" ").slice(-2).join(" ")} với 50 câu hỏi`,
      date: formatDate(exam.created_at),
      exam_id: exam.exam_id,
    });
  });

  // Add question activities (grouped by date)
  const questionCount = mockQuestions.length;
  if (questionCount > 0) {
    activities.push({
      id: "question_batch_001",
      type: "question",
      title: "Câu hỏi",
      description: `${questionCount} câu hỏi mới đã được thêm vào bộ câu hỏi`,
      date: formatDate(mockQuestions[0].created_at),
      question_count: questionCount,
    });
  }

  // Sort by date (newest first)
  return activities.sort((a, b) => {
    const dateA = new Date(a.date.split("/").reverse().join("-"));
    const dateB = new Date(b.date.split("/").reverse().join("-"));
    return dateB.getTime() - dateA.getTime();
  });
};

// Get current user
export const getCurrentUser = (): User => {
  return mockUsers[0];
};

// Get exam by ID
export const getExamById = (examId: string): Exam | undefined => {
  return mockExams.find((exam) => exam.exam_id === examId);
};

// Get total question count
export const getTotalQuestionCount = (): number => {
  return mockQuestions.length;
};

// Get total exam count
export const getTotalExamCount = (): number => {
  return mockExams.length;
};

// Mock Topics
export const mockTopics: Topic[] = [
  { topic_id: 1, name: "Khoa học môi trường" },
  { topic_id: 2, name: "Toán học" },
  { topic_id: 3, name: "Vật lý" },
  { topic_id: 4, name: "Hóa học" },
];

// Mock Choices for questions
export const mockChoices: Choice[] = [
  // Choices for q_001
  {
    choice_id: 1,
    question_id: "q_001",
    label: "A",
    text: "2x + 3",
    is_correct: true,
    is_selected: false,
  },
  {
    choice_id: 2,
    question_id: "q_001",
    label: "B",
    text: "2x",
    is_correct: false,
    is_selected: false,
  },
  {
    choice_id: 3,
    question_id: "q_001",
    label: "C",
    text: "x + 3",
    is_correct: false,
    is_selected: false,
  },
  {
    choice_id: 4,
    question_id: "q_001",
    label: "D",
    text: "x^2 + 3",
    is_correct: false,
    is_selected: false,
  },
];

// Mock function to extract questions from file/image (OCR/AI simulation)
export const extractQuestionsFromFile = async (
  fileUri: string
): Promise<Array<{
  id: string;
  questionText: string;
  questionImage?: string;
  topic: string;
  difficulty: "Dễ" | "Trung bình" | "Khó" | "";
  status: "under_review" | "standardized";
  order: number;
}>> => {
  // Simulate API call delay
  await new Promise<void>((resolve) => setTimeout(resolve, 1000));

  // Return mock extracted questions based on the design
  return [
    {
      id: "q_extracted_1",
      questionText: "Mô tả các yếu tố ảnh hưởng đến biến đổi khí hậu toàn cầu và các biện pháp giảm thiểu hiệu quả.",
      questionImage: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800",
      topic: "Khoa học môi trường",
      difficulty: "Trung bình",
      status: "under_review",
      order: 1,
    },
    {
      id: "q_extracted_2",
      questionText: "Phân tích vai trò của trí tuệ nhân tạo trong cách mạng công nghiệp 4.0.",
      topic: "Công nghệ thông tin",
      difficulty: "Khó",
      status: "standardized",
      order: 2,
    },
    {
      id: "q_extracted_3",
      questionText: "Giải thích định luật bảo toàn năng lượng và cho ví dụ minh họa.",
      topic: "Vật lý",
      difficulty: "Dễ",
      status: "under_review",
      order: 3,
    },
  ];
};

// Get choices for a question
export const getChoicesByQuestionId = (questionId: string): Choice[] => {
  return mockChoices.filter((choice) => choice.question_id === questionId);
};

// Get topic by ID
export const getTopicById = (topicId: number): Topic | undefined => {
  return mockTopics.find((topic) => topic.topic_id === topicId);
};

// Get all topics
export const getAllTopics = (): Topic[] => {
  return mockTopics;
};

