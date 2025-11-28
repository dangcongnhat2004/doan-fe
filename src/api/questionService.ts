import { API_BASE_URL, API_ENDPOINTS } from "./config";
import { storage } from "../utils/storage";

// Types for batch question creation
export interface CreateQuestionSetRequest {
  title: string;
  description?: string;
}

export interface QuestionChoice {
  label: string;
  text: string;
  is_correct: boolean;
}

export interface BatchQuestionRequest {
  question_text: string;
  difficulty?: string;
  choices?: QuestionChoice[];
  tags?: string[];
  media?: Array<{
    file_url: string;
    file_type: string;
    description?: string;
  }>;
}

export interface BatchCreateQuestionsRequest {
  user_id: string;
  create_set: CreateQuestionSetRequest;
  questions: BatchQuestionRequest[];
}

export interface CreatedQuestion {
  question_id: string;
}

export interface BatchCreateQuestionsResponse {
  created: CreatedQuestion[];
  set_id: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Create questions in batch with a question set
 * @param request - Batch create request with set info and questions
 * @returns Promise with created question IDs and set ID
 */
export const createBatchQuestions = async (
  request: BatchCreateQuestionsRequest
): Promise<BatchCreateQuestionsResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để tạo câu hỏi",
    } as ApiError;
  }

  // Validate request
  if (!request.create_set?.title?.trim()) {
    throw {
      message: "Tên bộ câu hỏi không được để trống",
    } as ApiError;
  }

  if (!request.questions || request.questions.length === 0) {
    throw {
      message: "Phải có ít nhất một câu hỏi",
    } as ApiError;
  }

  // Validate each question
  for (const question of request.questions) {
    if (!question.question_text?.trim()) {
      throw {
        message: "Nội dung câu hỏi không được để trống",
      } as ApiError;
    }

    // If question has choices, validate them (but don't require correct answer)
    if (question.choices && question.choices.length > 0) {
      if (question.choices.length < 2) {
        throw {
          message: "Mỗi câu hỏi phải có ít nhất 2 lựa chọn",
        } as ApiError;
      }
      // Note: We don't require a correct answer - questions can be saved without selecting correct answer
    }
  }

  const url = `${API_BASE_URL}${API_ENDPOINTS.QUESTIONS.BATCH}`;

  console.log("=== CREATE BATCH QUESTIONS DEBUG ===");
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
    let errorMessage = "Tạo câu hỏi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Tạo câu hỏi thất bại (${response.status})`;
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

  let responseData: BatchCreateQuestionsResponse;
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
  if (!responseData.created || !Array.isArray(responseData.created)) {
    throw {
      message: "Server không trả về danh sách câu hỏi đã tạo. Vui lòng thử lại.",
    } as ApiError;
  }

  if (!responseData.set_id) {
    throw {
      message: "Server không trả về ID bộ câu hỏi. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData;
};

// Types for question sets list
export interface QuestionSetCreator {
  user_id: string;
  username: string;
}

export interface QuestionSet {
  set_id: string;
  title: string;
  description: string;
  question_count: number;
  created_at: string;
  creator: QuestionSetCreator;
}

export interface GetQuestionSetsResponse {
  sets: QuestionSet[];
  user_id: string;
}

/**
 * Get list of question sets for a user
 * @param userId - User ID
 * @returns Promise with list of question sets
 */
export const getQuestionSets = async (
  userId: string
): Promise<GetQuestionSetsResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để xem danh sách bộ câu hỏi",
    } as ApiError;
  }

  if (!userId || userId.trim() === "") {
    throw {
      message: "User ID không hợp lệ",
    } as ApiError;
  }

  const url = `${API_BASE_URL}/api/users/${userId}/question-sets`;

  console.log("=== GET QUESTION SETS DEBUG ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("User ID:", userId);
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
    let errorMessage = "Lấy danh sách bộ câu hỏi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Lấy danh sách bộ câu hỏi thất bại (${response.status})`;
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

  let responseData: GetQuestionSetsResponse;
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
  if (!responseData.sets || !Array.isArray(responseData.sets)) {
    throw {
      message: "Server không trả về danh sách bộ câu hỏi. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData;
};

// Types for question set detail
export interface QuestionDetailChoice {
  choice_id: number;
  is_correct: boolean;
  label: string;
  text: string;
}

export interface QuestionDetailMedia {
  media_id: string;
  file_url: string;
  file_type: string;
  description?: string;
}

export interface QuestionDetail {
  question_id: string;
  question_text: string;
  difficulty: string | null;
  bloom_level: string | null;
  explanation: string | null;
  source: string | null;
  tags: string[];
  choices: QuestionDetailChoice[];
  media: QuestionDetailMedia[];
  exams: any[];
  created_at: string;
  updated_at: string;
}

export interface QuestionSetDetail {
  set_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  creator: QuestionSetCreator;
  questions: QuestionDetail[];
}

/**
 * Get question set detail by user ID and set ID
 * @param userId - User ID
 * @param setId - Question set ID
 * @returns Promise with question set detail including all questions
 */
export const getQuestionSetDetail = async (
  userId: string,
  setId: string
): Promise<QuestionSetDetail> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để xem chi tiết bộ câu hỏi",
    } as ApiError;
  }

  if (!userId || userId.trim() === "") {
    throw {
      message: "User ID không hợp lệ",
    } as ApiError;
  }

  if (!setId || setId.trim() === "") {
    throw {
      message: "Set ID không hợp lệ",
    } as ApiError;
  }

  const url = `${API_BASE_URL}/api/users/${userId}/question-sets/${setId}`;

  console.log("=== GET QUESTION SET DETAIL DEBUG ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("User ID:", userId);
  console.log("Set ID:", setId);
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
    let errorMessage = "Lấy chi tiết bộ câu hỏi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Lấy chi tiết bộ câu hỏi thất bại (${response.status})`;
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

  let responseData: QuestionSetDetail;
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
  if (!responseData.set_id) {
    throw {
      message: "Server không trả về ID bộ câu hỏi. Vui lòng thử lại.",
    } as ApiError;
  }

  if (!responseData.questions || !Array.isArray(responseData.questions)) {
    throw {
      message: "Server không trả về danh sách câu hỏi. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData;
};

// Types for updating a single question
export interface UpdateQuestionRequest {
  question_text?: string;
  bloom_level?: string | null;
  difficulty?: string | null;
  explanation?: string | null;
  source?: string | null;
  tags?: string[];
  choices?: QuestionChoice[];
  exam_id?: string;
  order_no?: number;
}

export interface UpdateQuestionResponse {
  message: string;
  question: QuestionDetail;
}

/**
 * Update a single question by ID
 * Supports partial updates; fields not provided remain unchanged on the server
 */
export const updateQuestion = async (
  questionId: string,
  payload: UpdateQuestionRequest
): Promise<UpdateQuestionResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để cập nhật câu hỏi",
    } as ApiError;
  }

  if (!questionId || questionId.trim() === "") {
    throw {
      message: "Question ID không hợp lệ",
    } as ApiError;
  }

  if (!payload || Object.keys(payload).length === 0) {
    throw {
      message: "Vui lòng cung cấp dữ liệu để cập nhật câu hỏi",
    } as ApiError;
  }

  const url = `${API_BASE_URL}/api/questions/${questionId}`;

  console.log("=== UPDATE QUESTION DEBUG ===");
  console.log("URL:", url);
  console.log("Method: PUT");
  console.log("Question ID:", questionId);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("================================");

  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
    let errorMessage = "Cập nhật câu hỏi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Cập nhật câu hỏi thất bại (${response.status})`;
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

  let responseData: UpdateQuestionResponse;
  try {
    responseData = JSON.parse(responseText);
    console.log("Success response:", responseData);
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  if (!responseData.question) {
    throw {
      message: "Server không trả về dữ liệu câu hỏi sau khi cập nhật.",
    } as ApiError;
  }

  return responseData;
};

export interface DeleteQuestionResponse {
  message: string;
  question_id: string;
}

/**
 * Delete a question by ID
 */
export const deleteQuestion = async (
  questionId: string
): Promise<DeleteQuestionResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để xóa câu hỏi",
    } as ApiError;
  }

  if (!questionId || questionId.trim() === "") {
    throw {
      message: "Question ID không hợp lệ",
    } as ApiError;
  }

  const url = `${API_BASE_URL}/api/questions/${questionId}`;
  console.log("=== DELETE QUESTION DEBUG ===");
  console.log("URL:", url);
  console.log("Method: DELETE");
  console.log("Question ID:", questionId);
  console.log("=============================");

  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
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
        message:
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
      } as ApiError;
    }

    throw {
      message: `Lỗi kết nối: ${errorMessage || errorName || "Unknown error"}`,
    } as ApiError;
  }

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

  if (!response.ok) {
    let errorMessage = "Xóa câu hỏi thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Xóa câu hỏi thất bại (${response.status})`;
    }

    console.error("API error response:", errorMessage);
    throw {
      message: errorMessage,
      status: response.status,
    } as ApiError & { status?: number };
  }

  if (!responseText || responseText.trim() === "") {
    throw {
      message: "Server trả về response rỗng. Vui lòng thử lại.",
    } as ApiError;
  }

  let responseData: DeleteQuestionResponse;
  try {
    responseData = JSON.parse(responseText);
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  if (!responseData.question_id) {
    throw {
      message: "Server không trả về question_id sau khi xóa.",
    } as ApiError;
  }

  return responseData;
};

// Semantic Search Types
export interface SemanticSearchRequest {
  query: string;
  top_k?: number;
}

export interface SemanticSearchResult {
  question_id: string;
  question_text: string;
  score?: number;
  difficulty?: "easy" | "medium" | "hard" | null;
  bloom_level?: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create" | null;
  explanation?: string | null;
  source?: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  choices?: Array<{
    choice_id: number;
    label: string;
    text: string;
    is_correct: boolean;
  }>;
  media?: Array<{
    media_id: string;
    file_url: string;
    file_type: "image" | "audio" | "video" | "pdf";
    description?: string | null;
  }>;
  exams?: any[];
}

export interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  query: string;
  total_results?: number;
}

/**
 * Semantic search for questions
 * @param request - Search request with query and top_k
 * @returns Promise with search results
 */
export const semanticSearchQuestions = async (
  request: SemanticSearchRequest
): Promise<SemanticSearchResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để tìm kiếm câu hỏi",
    } as ApiError;
  }

  const url = `${API_BASE_URL}${API_ENDPOINTS.QUESTIONS.SEMANTIC_SEARCH}`;

  console.log("=== SEMANTIC SEARCH DEBUG ===");
  console.log("URL:", url);
  console.log("Request:", JSON.stringify(request, null, 2));

  // Only include top_k if it's explicitly provided
  const requestBody: any = {
    query: request.query,
  };
  if (request.top_k !== undefined) {
    requestBody.top_k = request.top_k;
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    const errorMessage = fetchError?.message || "";
    const errorName = fetchError?.name || "";

    if (errorName === "AbortError" || errorMessage.includes("aborted")) {
      throw {
        message: "Tìm kiếm mất quá nhiều thời gian. Vui lòng thử lại.",
      } as ApiError;
    }

    if (
      errorMessage.includes("Network request failed") ||
      errorMessage.includes("Failed to connect") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("TypeError")
    ) {
      throw {
        message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.",
      } as ApiError;
    }
    throw {
      message: `Lỗi kết nối: ${errorMessage || errorName || "Unknown error"}`,
    } as ApiError;
  }

  let responseText: string;
  try {
    responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text length:", responseText?.length || 0);
  } catch (textError) {
    console.error("Error reading response:", textError);
    throw {
      message: "Không thể đọc response từ server. Vui lòng thử lại.",
    } as ApiError;
  }

  if (!response.ok) {
    let errorMessage = "Tìm kiếm thất bại";

    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 200);
      }
    } else {
      errorMessage = `Tìm kiếm thất bại (${response.status})`;
    }

    console.error("API error response:", errorMessage);
    throw {
      message: errorMessage,
      status: response.status,
    } as ApiError & { status?: number };
  }

  if (!responseText || responseText.trim() === "") {
    throw {
      message: "Server trả về response rỗng. Vui lòng thử lại.",
    } as ApiError;
  }

  let responseData: SemanticSearchResponse;
  try {
    responseData = JSON.parse(responseText);
    console.log("Search results:", responseData);
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  return responseData;
};

