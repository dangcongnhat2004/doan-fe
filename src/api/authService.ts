import { API_BASE_URL, API_ENDPOINTS } from "./config";

// Types for registration
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

// Types for login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiError {
  message: string;
}

/**
 * Register a new user
 * @param data - Registration data (name, email, password)
 * @returns Promise with registration response or throws error
 */
export const register = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  let response: Response;
  
  try {
    response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (fetchError: any) {
    // Fetch failed - this is a real network error (no response received)
    const errorMessage = fetchError?.message || "";
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
      message: "Không thể kết nối đến server. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // If we get here, we have a response (even if it's an error status like 400)
  let responseData;
  try {
    responseData = await response.json();
  } catch (jsonError) {
    // If response is not JSON, handle as server error
    throw {
      message: "Server không phản hồi đúng định dạng. Vui lòng thử lại sau.",
    } as ApiError;
  }

  if (!response.ok) {
    // Handle error response from server (e.g., 400 - Email already registered)
    // This means we successfully connected and got a response, so show server's message
    const error: ApiError = {
      message: responseData.message || "Đăng ký thất bại",
    };
    throw error;
  }

  // Success response (200)
  return responseData as RegisterResponse;
};

/**
 * Login user
 * @param data - Login data (email, password)
 * @returns Promise with login response (token, user) or throws error
 */
export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  let response: Response;
  const url = `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
  
  // Debug logging
  if (__DEV__) {
    console.log(`[Login] Attempting to login to: ${url}`);
    console.log(`[Login] API_BASE_URL: ${API_BASE_URL}`);
    console.log(`[Login] Endpoint: ${API_ENDPOINTS.AUTH.LOGIN}`);
  }
  
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (__DEV__) {
      console.log(`[Login] Response status: ${response.status}`);
      console.log(`[Login] Response ok: ${response.ok}`);
    }
  } catch (fetchError: any) {
    // Fetch failed - this is a real network error (no response received)
    const errorMessage = fetchError?.message || "";
    
    if (__DEV__) {
      console.error(`[Login] Fetch error:`, fetchError);
      console.error(`[Login] Error message: ${errorMessage}`);
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
      message: "Không thể kết nối đến server. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // If we get here, we have a response (even if it's an error status like 401)
  let responseData;
  try {
    responseData = await response.json();
  } catch (jsonError) {
    // If response is not JSON, handle as server error
    throw {
      message: "Server không phản hồi đúng định dạng. Vui lòng thử lại sau.",
    } as ApiError;
  }

  if (!response.ok) {
    // Handle error response from server (e.g., 401 - Invalid email or password)
    // This means we successfully connected and got a response, so show server's message
    const error: ApiError = {
      message: responseData.message || "Đăng nhập thất bại",
    };
    throw error;
  }

  // Success response (200)
  return responseData as LoginResponse;
};

