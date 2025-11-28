// Types based on SQL schema

export type User = {
  user_id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  created_at: string;
};

export type Topic = {
  topic_id: number;
  name: string;
};

export type TopicRelation = {
  relation_id: number;
  parent_id: number;
  parent_name: string;
};

export type Question = {
  question_id: string;
  question_text: string;
  topic_id: number | null;
  bloom_level: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create" | null;
  difficulty: "easy" | "medium" | "hard" | null;
  explanation: string | null;
  source: string | null;
  choices?: Choice[];
  is_selected?: number | null;
  created_at: string;
  updated_at: string;
};

export type Choice = {
  choice_id: number;
  question_id: string | null;
  label: string | null;
  text: string;
  is_selected: boolean | null;
  is_correct: boolean;
};

export type Tag = {
  tag_id: number;
  name: string;
};

export type QuestionTag = {
  question_id: string;
  tag_id: number;
};

export type Exam = {
  exam_id: string;
  title: string;
  description: string | null;
  question_count: number | null;
  questions_count?: number; // API response uses this
  duration?: number;
  status?: "draft" | "published" | "in-progress" | "completed";
  progress?: number | null; // 0 - 100
  created_by: string | null;
  creator?: {
    user_id: string;
    name: string;
    email: string;
  } | null;
  created_at: string;
};

export type ExamQuestion = {
  exam_id: string;
  question_id: string;
  order_no: number | null;
};

export type Media = {
  media_id: string;
  question_id: string | null;
  file_url: string;
  file_type: "image" | "audio" | "video" | "pdf";
  description: string | null;
  category: "question_media" | "uploaded_for_ai" | "other";
  uploaded_by: string | null;
  created_at: string;
};

// Helper types for UI
export type RecentActivity = {
  id: string;
  type: "exam" | "question";
  title: string;
  description: string;
  date: string;
  exam_id?: string;
  question_count?: number;
};

