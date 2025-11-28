import { API_BASE_URL } from "./config";
import { storage } from "../utils/storage";

// Types for Create Exam
export interface QuestionSetInput {
  set_id: string;
  question_ids?: string[];
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  created_by?: string;
  question_sets: QuestionSetInput[];
}

export interface ExamQuestion {
  question_id: string;
  question_text: string;
  order_no: number;
  difficulty: string | null;
  bloom_level: string | null;
  explanation: string | null;
  source: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  choices: Array<{
    choice_id: number;
    label: string;
    text: string;
    is_correct: boolean;
  }>;
  media: any[];
}

export interface CreateExamResponse {
  exam_id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  creator: any | null;
  questions: ExamQuestion[];
  questions_count: number;
}

// Types for Get List Exam
export interface ExamCreator {
  user_id: string;
  name: string;
  email: string;
}

export interface ExamListItem {
  exam_id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  creator: ExamCreator | null;
  questions_count: number;
}

export interface GetExamsResponse {
  exams: ExamListItem[];
  total: number;
  limit: number;
  offset: number;
}

// Types for Get Exam By ID
export interface GetExamByIdResponse {
  exam_id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  creator: ExamCreator | null;
  questions: ExamQuestion[];
  questions_count: number;
}

// Types for Submit Exam Results
export interface ExamAnswer {
  question_id: string;
  selected_choice_id: string | number; // Can be string like "c_002" or number
  answered_at: string;
}

export interface SubmitExamRequest {
  user_id: string;
  started_at: string;
  answers: ExamAnswer[];
}

export interface ExamResultAnswer {
  answer_id: string;
  question_id: string;
  question_text: string;
  selected_choice_id: string | number;
  selected_choice_label: string;
  is_correct: boolean;
  answered_at: string;
}

export interface SubmitExamResponse {
  result_id: string;
  exam_id: string;
  user_id: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  status: string;
  started_at: string;
  completed_at: string;
  created_at: string;
  answers: ExamResultAnswer[];
}

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Create a new exam
 * @param request - Exam creation data
 * @returns Promise with created exam data
 */
export const createExam = async (
  request: CreateExamRequest
): Promise<CreateExamResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để tạo đề thi",
    } as ApiError;
  }

  // Validate request
  if (!request.title?.trim()) {
    throw {
      message: "Tiêu đề đề thi không được để trống",
    } as ApiError;
  }

  if (!request.question_sets || request.question_sets.length === 0) {
    throw {
      message: "Phải chọn ít nhất một bộ câu hỏi",
    } as ApiError;
  }

  const url = `${API_BASE_URL}/api/exams`;

  console.log("=== CREATE EXAM DEBUG ===");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Request:", JSON.stringify(request, null, 2));
  console.log("================================");

  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    const errorMessage = fetchError?.message || "";
    const errorName = fetchError?.name || "";

    if (errorName === "AbortError" || errorMessage.includes("aborted")) {
      throw {
        message: "Request timeout. Vui lòng thử lại.",
      } as ApiError;
    }

    if (
      errorMessage.includes("Network request failed") ||
      errorMessage.includes("Failed to connect") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("NetworkError")
    ) {
      throw {
        message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
      } as ApiError;
    }

    throw {
      message: `Lỗi kết nối: ${errorMessage || errorName || "Unknown error"}`,
    } as ApiError;
  }

  // Read response text
  let responseText: string;
  try {
    responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text:", responseText);
  } catch (textError) {
    console.error("Error reading response:", textError);
    throw {
      message: "Không thể đọc response từ server. Vui lòng thử lại.",
    } as ApiError;
  }

  // Check response status
  if (!response.ok) {
    let errorMessage = "Tạo đề thi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Tạo đề thi thất bại (${response.status})`;
    }

    console.error("API error response:", errorMessage);
    throw {
      message: errorMessage,
      status: response.status,
    } as ApiError & { status?: number };
  }

  // Parse successful response
  if (!responseText || responseText.trim() === "") {
    throw {
      message: "Server trả về response rỗng. Vui lòng thử lại.",
    } as ApiError;
  }

  let responseData: CreateExamResponse;
  try {
    responseData = JSON.parse(responseText);
    console.log("Success response:", responseData);
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // Validate response structure
  if (!responseData.exam_id) {
    throw {
      message: "Server không trả về ID đề thi. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData;
};

/**
 * Get list of exams
 * @param params - Query parameters (created_by, limit, offset)
 * @returns Promise with list of exams
 */
export const getExams = async (
  params?: {
    created_by?: string;
    limit?: number;
    offset?: number;
  }
): Promise<GetExamsResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để xem danh sách đề thi",
    } as ApiError;
  }

  // Build query string
  const queryParams = new URLSearchParams();
  if (params?.created_by) {
    queryParams.append("created_by", params.created_by);
  }
  if (params?.limit !== undefined) {
    queryParams.append("limit", params.limit.toString());
  }
  if (params?.offset !== undefined) {
    queryParams.append("offset", params.offset.toString());
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/exams${queryString ? `?${queryString}` : ""}`;

  console.log("=== GET EXAMS DEBUG ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("================================");

  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    const errorMessage = fetchError?.message || "";
    const errorName = fetchError?.name || "";

    if (errorName === "AbortError" || errorMessage.includes("aborted")) {
      throw {
        message: "Request timeout. Vui lòng thử lại.",
      } as ApiError;
    }

    if (
      errorMessage.includes("Network request failed") ||
      errorMessage.includes("Failed to connect") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("NetworkError")
    ) {
      throw {
        message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
      } as ApiError;
    }

    throw {
      message: `Lỗi kết nối: ${errorMessage || errorName || "Unknown error"}`,
    } as ApiError;
  }

  // Read response text
  let responseText: string;
  try {
    responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text:", responseText);
  } catch (textError) {
    console.error("Error reading response:", textError);
    throw {
      message: "Không thể đọc response từ server. Vui lòng thử lại.",
    } as ApiError;
  }

  // Check response status
  if (!response.ok) {
    let errorMessage = "Lấy danh sách đề thi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Lấy danh sách đề thi thất bại (${response.status})`;
    }

    console.error("API error response:", errorMessage);
    throw {
      message: errorMessage,
      status: response.status,
    } as ApiError & { status?: number };
  }

  // Parse successful response
  if (!responseText || responseText.trim() === "") {
    throw {
      message: "Server trả về response rỗng. Vui lòng thử lại.",
    } as ApiError;
  }

  let responseData: GetExamsResponse;
  try {
    responseData = JSON.parse(responseText);
    console.log("Success response:", responseData);
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // Validate response structure
  if (!responseData.exams || !Array.isArray(responseData.exams)) {
    throw {
      message: "Server không trả về danh sách đề thi. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData;
};

/**
 * Get exam by ID
 * @param examId - Exam ID
 * @returns Promise with exam details including questions
 */
export const getExamById = async (
  examId: string
): Promise<GetExamByIdResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để xem chi tiết đề thi",
    } as ApiError;
  }

  if (!examId || examId.trim() === "") {
    throw {
      message: "Exam ID không hợp lệ",
    } as ApiError;
  }

  const url = `${API_BASE_URL}/api/exams/${examId}`;

  console.log("=== GET EXAM BY ID DEBUG ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("Exam ID:", examId);
  console.log("================================");

  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    const errorMessage = fetchError?.message || "";
    const errorName = fetchError?.name || "";

    if (errorName === "AbortError" || errorMessage.includes("aborted")) {
      throw {
        message: "Request timeout. Vui lòng thử lại.",
      } as ApiError;
    }

    if (
      errorMessage.includes("Network request failed") ||
      errorMessage.includes("Failed to connect") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("NetworkError")
    ) {
      throw {
        message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
      } as ApiError;
    }

    throw {
      message: `Lỗi kết nối: ${errorMessage || errorName || "Unknown error"}`,
    } as ApiError;
  }

  // Read response text
  let responseText: string;
  try {
    responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text:", responseText);
  } catch (textError) {
    console.error("Error reading response:", textError);
    throw {
      message: "Không thể đọc response từ server. Vui lòng thử lại.",
    } as ApiError;
  }

  // Check response status
  if (!response.ok) {
    let errorMessage = "Lấy chi tiết đề thi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Lấy chi tiết đề thi thất bại (${response.status})`;
    }

    console.error("API error response:", errorMessage);
    throw {
      message: errorMessage,
      status: response.status,
    } as ApiError & { status?: number };
  }

  // Parse successful response
  if (!responseText || responseText.trim() === "") {
    throw {
      message: "Server trả về response rỗng. Vui lòng thử lại.",
    } as ApiError;
  }

  let responseData: GetExamByIdResponse;
  try {
    responseData = JSON.parse(responseText);
    console.log("Success response:", responseData);
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // Validate response structure
  if (!responseData.exam_id) {
    throw {
      message: "Server không trả về ID đề thi. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData;
};

/**
 * Submit exam results
 * @param examId - Exam ID
 * @param request - Exam submission data
 * @returns Promise with exam results
 */
export const submitExamResults = async (
  examId: string,
  request: SubmitExamRequest
): Promise<SubmitExamResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để nộp bài thi",
    } as ApiError;
  }

  if (!examId || examId.trim() === "") {
    throw {
      message: "Exam ID không hợp lệ",
    } as ApiError;
  }

  if (!request.user_id || request.user_id.trim() === "") {
    throw {
      message: "User ID không hợp lệ",
    } as ApiError;
  }

  if (!request.answers || request.answers.length === 0) {
    throw {
      message: "Phải có ít nhất một câu trả lời",
    } as ApiError;
  }

  const url = `${API_BASE_URL}/api/exams/${examId}/results`;

  console.log("=== SUBMIT EXAM RESULTS DEBUG ===");
  console.log("URL:", url);
  console.log("Method: POST");
  console.log("Exam ID:", examId);
  console.log("Request:", JSON.stringify(request, null, 2));
  console.log("================================");

  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    const errorMessage = fetchError?.message || "";
    const errorName = fetchError?.name || "";

    if (errorName === "AbortError" || errorMessage.includes("aborted")) {
      throw {
        message: "Request timeout. Vui lòng thử lại.",
      } as ApiError;
    }

    if (
      errorMessage.includes("Network request failed") ||
      errorMessage.includes("Failed to connect") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("NetworkError")
    ) {
      throw {
        message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
      } as ApiError;
    }

    throw {
      message: `Lỗi kết nối: ${errorMessage || errorName || "Unknown error"}`,
    } as ApiError;
  }

  // Read response text
  let responseText: string;
  try {
    responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text:", responseText);
  } catch (textError) {
    console.error("Error reading response:", textError);
    throw {
      message: "Không thể đọc response từ server. Vui lòng thử lại.",
    } as ApiError;
  }

  // Check response status
  if (!response.ok) {
    let errorMessage = "Nộp bài thi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Nộp bài thi thất bại (${response.status})`;
    }

    console.error("API error response:", errorMessage);
    throw {
      message: errorMessage,
      status: response.status,
    } as ApiError & { status?: number };
  }

  // Parse successful response
  if (!responseText || responseText.trim() === "") {
    throw {
      message: "Server trả về response rỗng. Vui lòng thử lại.",
    } as ApiError;
  }

  let responseData: SubmitExamResponse;
  try {
    responseData = JSON.parse(responseText);
    console.log("Success response:", responseData);
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // Validate response structure
  if (!responseData.result_id) {
    throw {
      message: "Server không trả về ID kết quả. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData;
};

