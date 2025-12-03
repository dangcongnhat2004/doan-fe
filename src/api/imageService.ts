import { Platform } from "react-native";
import { API_BASE_URL, API_ENDPOINTS, IMAGE_UPLOAD_BASE_URL } from "./config";
import { storage } from "../utils/storage";

// Types for image upload
export interface UploadImageRequest {
  imageUri: string;
  imageName: string;
  imageType: string;
}

export interface UploadImageResponse {
  message: string;
  job_id: string;
  processed_image?: string;
  lambda_message?: string;
}

// Helper type for NULL values from API (DynamoDB format)
type NullableField<T> = T | { NULL: true } | null;

export interface ImageResultItem {
  bloom_level: NullableField<string>;
  difficulty: NullableField<string>;
  image_placeholder: boolean;
  is_readable: boolean;
  language: string;
  options: Array<{
    is_correct: boolean;
    label: string;
    text: string;
  }>;
  question_text: string;
  topic: NullableField<string>;
}

// Helper function to extract string value from nullable field
export const extractStringValue = (value: NullableField<string>): string => {
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? value : "";
  }
  // Check if it's a NULL object: {NULL: true}
  if (value.NULL === true || (value as any).null === true) {
    return "";
  }
  // If it's already a string, return it
  if (typeof value === "string") {
    return value;
  }
  // Otherwise return empty string
  return "";
};

export interface ImageResultData {
  PK: string;
  SK: string;
  created_at: string;
  items: ImageResultItem[];
  items_count: number;
  job_id: string;
  source_bucket: string;
  source_key: string;
}

export interface ImageResultResponse {
  data: ImageResultData;
  message: string;
}

export interface ApiError {
  message: string;
}

/**
 * Upload image for processing
 * @param imageUri - Local file URI
 * @param imageName - File name
 * @param imageType - MIME type (e.g., "image/jpeg")
 * @returns Promise with upload response (job_id) or throws error
 */
export const uploadImage = async (
  imageUri: string,
  imageName: string,
  imageType: string,
  fileSize?: number,
  abortSignal?: AbortSignal
): Promise<UploadImageResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để upload ảnh",
    } as ApiError;
  }

  // Normalize file URI for React Native
  // React Native FormData can handle both file:// and content:// URIs
  // On Android, content:// URIs are common from image picker
  // On iOS, file:// URIs are standard
  let normalizedUri = imageUri;
  
  // Validate and normalize URI
  if (!normalizedUri || normalizedUri.trim() === "") {
    throw {
      message: "File URI không được để trống. Vui lòng thử lại.",
    } as ApiError;
  }
  
  // Ensure URI is properly formatted
  if (normalizedUri.startsWith("file://")) {
    // iOS file URI - keep as is
    normalizedUri = normalizedUri;
  } else if (normalizedUri.startsWith("content://")) {
    // Android content URI - keep as is (FormData handles this)
    normalizedUri = normalizedUri;
  } else if (normalizedUri.startsWith("http://") || normalizedUri.startsWith("https://")) {
    // Remote URL - keep as is
    normalizedUri = normalizedUri;
  } else {
    // No prefix - might be a relative path, try adding file://
    console.warn("File URI missing prefix, adding file://:", normalizedUri);
    normalizedUri = `file://${normalizedUri}`;
  }
  
  // Final validation
  if (!normalizedUri.startsWith("file://") && !normalizedUri.startsWith("content://") && !normalizedUri.startsWith("http")) {
    throw {
      message: "Định dạng file URI không hợp lệ. Vui lòng thử lại.",
    } as ApiError;
  }
  
  // Create FormData for multipart/form-data
  // React Native FormData requires: { uri, type, name }
  // Backend expects: multipart/form-data with field name "file"
  let formData = new FormData();
  
  // Ensure file name has proper extension
  let fileName = imageName;
  if (!fileName || fileName.trim() === "") {
    // Generate a default filename if missing
    const extension = imageType.includes("jpeg") || imageType.includes("jpg") ? "jpg" : 
                     imageType.includes("png") ? "png" : "jpg";
    fileName = `image_${Date.now()}.${extension}`;
  }
  
  // Create file object for FormData
  // React Native FormData requires this exact structure: { uri, type, name }
  // CRITICAL: The structure must be exactly right for React Native to read the file
  // On Android with content:// URIs, React Native should handle it automatically
  // But we must ensure the object structure is correct
  
  // Ensure file name has proper extension for MIME type detection
  // This helps React Native and the server identify the file type correctly
  if (!fileName.toLowerCase().endsWith('.jpg') && 
      !fileName.toLowerCase().endsWith('.jpeg') && 
      !fileName.toLowerCase().endsWith('.png')) {
    // Add extension based on MIME type if missing
    const ext = imageType?.includes('png') ? '.png' : '.jpg';
    if (!fileName.includes('.')) {
      fileName = fileName + ext;
    }
  }
  
  // Create file object for FormData
  // CRITICAL: On Android, file:// URIs from cache may not be readable by FormData
  // On web, we must convert the blob into a File instance
  let fileObject: any;

  if (Platform.OS === "web") {
    try {
      const blobResponse = await fetch(imageUri);
      const blob = await blobResponse.blob();
      const finalType = blob.type || imageType || "image/jpeg";
      fileObject = new File([blob], fileName, { type: finalType });
    } catch (error) {
      console.error("Web file conversion failed:", error);
      throw {
        message: "Không thể đọc file trên trình duyệt. Vui lòng thử lại với ảnh khác.",
      } as ApiError;
    }
  } else {
    // On Android, ensure URI is properly formatted for FormData
    // React Native FormData requires exact structure: { uri, type, name }
    fileObject = {
      uri: normalizedUri,
      type: imageType || "image/jpeg",
      name: fileName,
    };
    
    // On Android, log URI details for debugging
    if (Platform.OS === "android") {
      console.log("Android file object details:", {
        uriPrefix: normalizedUri.substring(0, 20),
        uriLength: normalizedUri.length,
        type: fileObject.type,
        name: fileObject.name,
        isContentUri: normalizedUri.startsWith("content://"),
        isFileUri: normalizedUri.startsWith("file://"),
      });
    }
  }
  
  // Validate file object before appending
  const missingFields =
    Platform.OS === "web"
      ? !fileObject || !fileObject.type || !fileObject.name
      : !fileObject.uri || !fileObject.type || !fileObject.name;

  if (missingFields) {
    console.error("Invalid file object:", fileObject);
    throw {
      message: "Thông tin file không đầy đủ. Vui lòng thử lại.",
    } as ApiError;
  }
  
  // IMPORTANT: On Android, ensure the URI is properly formatted
  // React Native FormData should handle both file:// and content:// URIs
  // But we need to ensure the object structure matches exactly what React Native expects
  // The structure must be: { uri: string, type: string, name: string }
  // Do NOT add any extra properties as it may break FormData
  
  // Append file to FormData
  // React Native will automatically read the file content from the URI
  // The key is ensuring uri, type, and name are all set correctly
  formData.append("file", fileObject);

  // Log FormData details for debugging
  console.log("=== UPLOAD IMAGE DEBUG ===");
  console.log("Platform:", Platform.OS);
  console.log("Upload URL:", `${API_BASE_URL}${API_ENDPOINTS.IMAGE.UPLOAD}`);
  console.log("Original URI:", imageUri.substring(0, 80) + (imageUri.length > 80 ? "..." : ""));
  console.log("Normalized URI:", normalizedUri.substring(0, 80) + (normalizedUri.length > 80 ? "..." : ""));
  console.log("File details:", {
    name: fileName,
    type: fileObject.type,
    originalName: imageName,
    originalType: imageType,
    fileSize: fileSize ? `${(fileSize / 1024).toFixed(2)} KB` : "unknown",
  });
  if (Platform.OS === "web") {
    console.log("FormData file object:", {
      type: fileObject.type,
      name: fileObject.name,
      size: fileObject.size,
    });
  } else {
    console.log("FormData file object:", {
      uri:
        fileObject.uri?.substring(0, 80) +
        (fileObject.uri?.length > 80 ? "..." : ""),
      type: fileObject.type,
      name: fileObject.name,
    });
  }
  console.log("Authorization header:", `Bearer ${token.substring(0, 20)}...`);
  
  // Warn if file size seems too small (might indicate file not read correctly)
  if (fileSize && fileSize < 1000) {
    console.error("❌ ERROR: File size is very small (" + fileSize + " bytes). This indicates the file was not read correctly.");
    console.error("❌ File size should be at least several KB for a valid image.");
    throw {
      message: `File size quá nhỏ (${fileSize} bytes). File có thể không được đọc đúng cách. Vui lòng thử lại.`,
    } as ApiError;
  }
  
  // Warn if file size is suspiciously small (between 1KB and 10KB)
  if (fileSize && fileSize >= 1000 && fileSize < 10000) {
    console.warn("⚠️ WARNING: File size is small (" + fileSize + " bytes). This might indicate a problem.");
  }
  
  console.log("==========================");

  let response: Response;

  const uploadUrl = `${API_BASE_URL}${API_ENDPOINTS.IMAGE.UPLOAD}`;

  try {
    console.log("Sending fetch request...");
    console.log("Full URL:", uploadUrl);
    console.log("Token exists:", !!token);
    console.log("Token length:", token?.length || 0);
    
    // Use fetch() for all platforms (same as login) - it handles FormData well on React Native
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 120000); // 120 seconds for uploads
    
    // Combine abort signals: user cancellation + timeout
    let finalSignal: AbortSignal;
    if (abortSignal) {
      const combinedController = new AbortController();
      // Listen to user abort signal
      abortSignal.addEventListener('abort', () => {
        combinedController.abort();
        clearTimeout(timeoutId);
      });
      // Listen to timeout abort signal
      timeoutController.signal.addEventListener('abort', () => {
        combinedController.abort();
      });
      finalSignal = combinedController.signal;
    } else {
      finalSignal = timeoutController.signal;
    }
    
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type - let fetch set it automatically with boundary for FormData
    };
    
    console.log("Request headers:", { ...headers, Authorization: `Bearer ${token.substring(0, 20)}...` });
    
    // On Android, add extra logging and ensure FormData is properly formatted
    // Backend requires: multipart/form-data with field name "file"
    if (Platform.OS === "android") {
      console.log("=== ANDROID UPLOAD DEBUG ===");
      console.log("FormData file object:", JSON.stringify({
        uri: fileObject.uri?.substring(0, 50) + "...",
        type: fileObject.type,
        name: fileObject.name,
      }));
      console.log("FormData entries count:", (formData as any)._parts?.length || "unknown");
      console.log("Field name: 'file' (as required by backend)");
      
      // On Android, recreate FormData right before sending to ensure it's fresh
      // Sometimes FormData can get corrupted if created too early
      const freshFormData = new FormData();
      if (normalizedUri.startsWith("content://")) {
        // For content:// URIs on Android, append with explicit structure
        // Backend expects field name "file" (multipart/form-data)
        freshFormData.append("file", {
          uri: normalizedUri,
          type: imageType || "image/jpeg",
          name: fileName,
        } as any);
        console.log("Appended content:// URI to FormData with field name 'file'");
      } else {
        // For file:// URIs, use the original fileObject
        freshFormData.append("file", fileObject);
        console.log("Appended file:// URI to FormData with field name 'file'");
      }
      formData = freshFormData;
      console.log("Recreated FormData for Android");
      console.log("New FormData entries count:", (formData as any)._parts?.length || "unknown");
      console.log("Headers: Authorization (Bearer token), Content-Type will be auto-set by fetch");
      console.log("===========================");
    }
    
    response = await fetch(uploadUrl, {
      method: "POST",
      headers: headers,
      body: formData,
      signal: finalSignal,
    });
    
    clearTimeout(timeoutId);
    
    console.log("Fetch request completed. Status:", response.status);
    
    console.log("Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));
  } catch (fetchError: any) {
    console.error("=== FETCH ERROR DETAILS ===");
    console.error("Error name:", fetchError?.name);
    console.error("Error message:", fetchError?.message);
    console.error("Error stack:", fetchError?.stack);
    console.error("Full error object:", fetchError);
    console.error("Platform:", Platform.OS);
    console.error("===========================");
    
    const errorMessage = fetchError?.message || "";
    const errorName = fetchError?.name || "";
    
    // Check if it's an abort error (timeout)
    if (errorName === "AbortError" || errorMessage.includes("aborted")) {
      throw {
        message: "Upload mất quá nhiều thời gian. Vui lòng kiểm tra kết nối mạng và thử lại.",
      } as ApiError;
    }
    
    // On Android, if fetch() fails with network error, try XMLHttpRequest as fallback
    // This is because FormData with content:// URIs sometimes works better with XHR on Android
    if (
      Platform.OS === "android" &&
      (errorMessage.includes("Network request failed") ||
       errorMessage.includes("Failed to connect") ||
       errorMessage.includes("NetworkError") ||
       errorName === "NetworkError" ||
       errorName === "TypeError")
    ) {
      console.log("⚠️ Fetch() failed on Android, trying XMLHttpRequest as fallback...");
      
      try {
        response = await new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          // Don't set Content-Type - let browser set it with boundary
          
          xhr.onload = () => {
            console.log("✅ XMLHttpRequest fallback succeeded!");
            const headers = new Headers();
            const headerPairs = xhr.getAllResponseHeaders().trim().split('\r\n');
            headerPairs.forEach(header => {
              const [key, value] = header.split(': ');
              if (key && value) {
                headers.append(key, value);
              }
            });
            
            const responseInit: ResponseInit = {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: headers,
            };
            
            const xhrResponse = new Response(xhr.responseText, responseInit);
            resolve(xhrResponse);
          };
          
          xhr.onerror = (error) => {
            console.error("❌ XMLHttpRequest fallback also failed");
            console.error("XHR error:", {
              readyState: xhr.readyState,
              status: xhr.status,
              statusText: xhr.statusText,
            });
            reject(new Error(`Network request failed (both fetch and XHR)`));
          };
          
          xhr.ontimeout = () => {
            reject(new Error("Request timeout"));
          };
          
          xhr.timeout = 120000; // 120 seconds
          xhr.send(formData as any);
        });
        
        console.log("XMLHttpRequest fallback completed. Status:", response.status);
        console.log("Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));
      } catch (xhrError: any) {
        // Both fetch and XHR failed
        console.error("❌ Both fetch() and XMLHttpRequest failed on Android");
        throw {
          message: "Không thể kết nối đến server trên Android. Vui lòng kiểm tra kết nối mạng và thử lại.",
        } as ApiError;
      }
    } else {
      // For other platforms or other error types, throw the original error
      if (
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Failed to connect") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("TypeError") ||
        errorName === "TypeError" ||
        errorName === "NetworkError"
      ) {
        let networkErrorMsg = "Không thể kết nối đến server. ";
        if (Platform.OS === "android") {
          networkErrorMsg += "Nếu bạn đang dùng emulator, hãy đảm bảo emulator có kết nối internet. ";
        }
        networkErrorMsg += "Vui lòng kiểm tra kết nối mạng và thử lại.";
        
        throw {
          message: networkErrorMsg,
        } as ApiError;
      }
      throw {
        message: `Lỗi kết nối: ${errorMessage || errorName || "Unknown error"}`,
      } as ApiError;
    }
  }

  // Read response text first (can only read once)
  let responseText: string;
  try {
    responseText = await response.text();
    console.log("Upload response status:", response.status);
    console.log("Upload response text length:", responseText?.length || 0);
    
    // Log response text for debugging (limit to first 500 chars to avoid spam)
    if (responseText && responseText.length > 0) {
      const preview = responseText.length > 500 ? responseText.substring(0, 500) + "..." : responseText;
      console.log("Upload response text preview:", preview);
    }
  } catch (textError) {
    console.error("Error reading upload response:", textError);
    throw {
      message: "Không thể đọc response từ server. Vui lòng thử lại.",
    } as ApiError;
  }

  // Check response status
  if (!response.ok) {
    let errorMessage = "Upload ảnh thất bại";
    let serverMessage = "";
    let isHtmlResponse = false;
    
    // Try to get server message first
    if (responseText && responseText.trim() !== "") {
      // Check if response is HTML
      const trimmedText = responseText.trim();
      isHtmlResponse = trimmedText.toLowerCase().startsWith("<html") || 
                      trimmedText.toLowerCase().includes("<!doctype html") ||
                      trimmedText.toLowerCase().includes("<title>");
      
      if (isHtmlResponse) {
        // Extract meaningful text from HTML if possible
        const titleMatch = trimmedText.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          serverMessage = titleMatch[1].trim();
        } else {
          // Try to extract text from body
          const bodyMatch = trimmedText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch) {
            const bodyText = bodyMatch[1].replace(/<[^>]+>/g, " ").trim();
            if (bodyText) {
              serverMessage = bodyText.substring(0, 100);
            }
          }
        }
        console.error("Upload error (HTML response):", serverMessage || "HTML error page");
        console.error("Full HTML response (first 1000 chars):", responseText.substring(0, 1000));
      } else {
        try {
          const errorData = JSON.parse(responseText);
          
          // Check for lambda_response (nested JSON string)
          if (errorData.lambda_response) {
            try {
              const lambdaData = JSON.parse(errorData.lambda_response);
              // Prefer lambda message if available
              serverMessage = lambdaData.message || errorData.message || "";
              console.error("Upload error from Lambda:", lambdaData.message);
            } catch (lambdaParseError) {
              // If lambda_response is not JSON, use it as string
              serverMessage = errorData.lambda_response || errorData.message || "";
              console.error("Upload error (lambda_response as string):", serverMessage);
            }
          } else {
            serverMessage = errorData.message || "";
            console.error("Upload error from server:", serverMessage);
          }
          
          // Log full error data for debugging
          console.error("Full error response:", JSON.stringify(errorData, null, 2));
        } catch (e) {
          // If not JSON and not HTML, use text as error message
          serverMessage = responseText.substring(0, 200);
          console.error("Upload error (non-JSON):", serverMessage);
        }
      }
    }
    
    // Handle specific status codes with user-friendly messages
    if (response.status === 503) {
      // For 503, use friendly message but include server message if helpful
      if (serverMessage && (serverMessage.toLowerCase().includes("service unavailable") || 
                           serverMessage.toLowerCase().includes("unavailable"))) {
        errorMessage = "Dịch vụ xử lý ảnh đang tạm thời không khả dụng. Vui lòng thử lại sau vài giây.";
      } else if (serverMessage && serverMessage.toLowerCase().includes("process")) {
        errorMessage = "Server đang xử lý quá tải. Vui lòng đợi vài giây rồi thử lại.";
      } else if (serverMessage && serverMessage.toLowerCase().includes("failed")) {
        errorMessage = "Không thể xử lý ảnh. Vui lòng thử lại sau hoặc kiểm tra định dạng ảnh.";
      } else {
        errorMessage = "Server đang quá tải. Vui lòng thử lại sau vài giây.";
      }
    } else if (response.status === 500) {
      // For 500, always use friendly message (don't show HTML)
      if (isHtmlResponse) {
        errorMessage = "Lỗi server nội bộ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.";
      } else if (serverMessage) {
        errorMessage = serverMessage;
      } else {
        errorMessage = "Lỗi server. Vui lòng thử lại sau.";
      }
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = "Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.";
    } else if (serverMessage && !isHtmlResponse) {
      // For other errors, use server message if available and not HTML
      errorMessage = serverMessage;
    } else {
      errorMessage = `Upload thất bại (${response.status})`;
    }
    
    console.error("Upload failed with status:", response.status, "Message:", errorMessage);
    
    // Add status code to error for retry logic
    const apiError: ApiError & { status?: number } = {
      message: errorMessage,
      status: response.status,
    };
    throw apiError;
  }

  // Parse successful response
  if (!responseText || responseText.trim() === "") {
    console.error("Upload response is empty");
    throw {
      message: "Server trả về response rỗng. Vui lòng thử lại.",
    } as ApiError;
  }

  let responseData;
  try {
    responseData = JSON.parse(responseText);
    console.log("Upload success response:", {
      message: responseData?.message,
      job_id: responseData?.job_id,
      processed_image: responseData?.processed_image,
      lambda_message: responseData?.lambda_message,
    });
  } catch (jsonError: any) {
    console.error("JSON parse error for upload:", jsonError);
    console.error("Response text (first 500 chars):", responseText.substring(0, 500));
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // Validate response structure
  if (!responseData.job_id) {
    console.error("Upload response missing job_id:", responseData);
    throw {
      message: "Server không trả về job_id. Vui lòng thử lại.",
    } as ApiError;
  }

  // Log lambda message if available
  if (responseData.lambda_message) {
    console.log("Lambda message:", responseData.lambda_message);
  }
  
  // ✅ CRITICAL: Validate that Lambda actually processed the image
  // If processed_image is missing, it means Lambda failed to process the file
  // This can happen if the file is too small or corrupted
  if (!responseData.processed_image) {
    console.error("⚠️ WARNING: Upload returned job_id but no processed_image. Lambda may have failed.");
    console.error("Response data:", responseData);
    
    // Check lambda_message for error indicators
    const lambdaMsg = responseData.lambda_message || "";
    if (lambdaMsg.toLowerCase().includes("error") || 
        lambdaMsg.toLowerCase().includes("failed") ||
        lambdaMsg.toLowerCase().includes("invalid")) {
      throw {
        message: "Không thể xử lý ảnh. File có thể quá nhỏ hoặc bị lỗi. Vui lòng thử lại với ảnh khác.",
      } as ApiError;
    }
    
    // If no error message but no processed_image, still warn but continue
    // (maybe Lambda is still processing)
    console.warn("⚠️ No processed_image in response, but continuing with polling. Lambda may still be processing.");
  } else {
    console.log("✅ Upload successful - processed_image:", responseData.processed_image);
    
    // ✅ Parse S3 URL to extract bucket and key for verification
    const s3Url = responseData.processed_image;
    if (s3Url && s3Url.startsWith("s3://")) {
      const s3Match = s3Url.match(/s3:\/\/([^\/]+)\/(.+)/);
      if (s3Match) {
        const bucket = s3Match[1];
        const key = s3Match[2];
        console.log("📦 S3 Details:", {
          bucket: bucket,
          key: key,
          fullUrl: s3Url
        });
        console.log("ℹ️ Note: File should be available in S3. If not found, check:");
        console.log("   1. Lambda CloudWatch logs for S3 upload errors");
        console.log("   2. S3 bucket permissions");
        console.log("   3. S3 bucket name and prefix are correct");
      }
    }
  }

  return responseData as UploadImageResponse;
};

/**
 * Get image processing result by job_id
 * @param jobId - Job ID from upload response
 * @returns Promise with result data or throws error
 */
export const getImageResult = async (
  jobId: string
): Promise<ImageResultResponse> => {
  const token = await storage.getToken();
  if (!token) {
    throw {
      message: "Bạn cần đăng nhập để lấy kết quả",
    } as ApiError;
  }

  // Validate job_id
  if (!jobId || jobId.trim() === "") {
    throw {
      message: "Job ID không hợp lệ",
    } as ApiError;
  }

  // Construct URL - Backend uses /image/result/<job_id> (job_id in path)
  // Based on Flask route: @image_bp.route("/result/<string:job_id>", methods=["GET"])
  const url = `${API_BASE_URL}${API_ENDPOINTS.IMAGE.RESULT}/${jobId}`;
  
  console.log("=== GET IMAGE RESULT DEBUG ===");
  console.log("URL:", url);
  console.log("Method: GET");
  console.log("Job ID:", jobId);
  console.log("Headers:", {
    Authorization: `Bearer ${token.substring(0, 20)}...`,
  });
  console.log("==============================");

  let response: Response;

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout for each poll
    
    // Standard GET request with job_id in URL path
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    const errorMessage = fetchError?.message || "";
    const errorName = fetchError?.name || "";
    
    // Check if it's an abort error (timeout)
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

  // Read response text first (can only read once)
  let responseText: string;
  try {
    responseText = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text length:", responseText?.length || 0);
    
    // Log response text for debugging (limit to first 500 chars)
    if (responseText && responseText.length > 0) {
      const preview = responseText.length > 500 ? responseText.substring(0, 500) + "..." : responseText;
      console.log("Response text preview:", preview);
    }
  } catch (textError) {
    console.error("Error reading response text:", textError);
    throw {
      message: "Không thể đọc response từ server. Vui lòng thử lại.",
    } as ApiError;
  }

  // Check response status
  if (!response.ok) {
    let errorMessage = "Lấy kết quả thất bại";
    
    // Handle 404 specifically - job might not be ready yet
    if (response.status === 404) {
      errorMessage = "Kết quả chưa sẵn sàng. Đang xử lý, vui lòng đợi...";
      console.warn("⚠️ 404 response - Job may not be ready yet. This is normal during polling.");
      // Don't throw error for 404, let polling continue
      throw {
        message: errorMessage,
        status: 404,
        isRetryable: true, // Mark as retryable
      } as ApiError & { status?: number; isRetryable?: boolean };
    }
    
    if (responseText && responseText.trim() !== "") {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If not JSON, use text as error message
        errorMessage = responseText.substring(0, 200); // Limit length
      }
    } else {
      errorMessage = `Lấy kết quả thất bại (${response.status})`;
    }
    console.error("API error response:", errorMessage);
    throw {
      message: errorMessage,
      status: response.status,
    } as ApiError & { status?: number };
  }

  // Parse successful response
  if (!responseText || responseText.trim() === "") {
    // Empty response might mean processing is still ongoing
    throw {
      message: "Đang xử lý, vui lòng đợi...",
    } as ApiError;
  }

  let responseData;
  try {
    responseData = JSON.parse(responseText);
    console.log("=== GET RESULT RESPONSE DEBUG ===");
    console.log("Response status:", response.status);
    console.log("Response message:", responseData?.message);
    console.log("Has data:", !!responseData?.data);
    if (responseData?.data) {
      console.log("Data job_id:", responseData.data.job_id);
      console.log("Items count:", responseData.data.items_count);
      console.log("Items array length:", responseData.data.items?.length || 0);
    }
    console.log("Full response:", JSON.stringify(responseData, null, 2));
    console.log("=================================");
  } catch (jsonError: any) {
    console.error("JSON parse error:", jsonError);
    console.error("Response text (first 500 chars):", responseText.substring(0, 500));
    throw {
      message: "Server không phản hồi đúng định dạng JSON. Vui lòng thử lại sau.",
    } as ApiError;
  }

  // Validate response structure
  if (!responseData.data) {
    console.error("Response missing data field:", responseData);
    throw {
      message: "Server không trả về dữ liệu. Vui lòng thử lại.",
    } as ApiError;
  }

  return responseData as ImageResultResponse;
};

/**
 * Poll for image processing result
 * @param jobId - Job ID from upload response
 * @param onProgress - Callback for progress updates
 * @param maxAttempts - Maximum polling attempts (default: 30)
 * @param intervalMs - Polling interval in milliseconds (default: 2000)
 * @returns Promise with result data or throws error
 */
export const pollImageResult = async (
  jobId: string,
  onProgress?: (attempt: number, maxAttempts: number) => boolean | void,
  maxAttempts: number = 120,
  intervalMs: number = 300
): Promise<ImageResultResponse> => {
  // Dynamic interval: start very fast, gradually increase
  // Based on your test: API only takes 393ms, so we check very frequently
  // After 2s delay from upload, result should be ready quickly
  const getCurrentInterval = (attempt: number): number => {
    if (attempt <= 10) return 300; // First 10 attempts: 300ms (very fast - covers ~3s)
    if (attempt <= 30) return 500; // Next 20 attempts: 500ms (fast - covers ~10s more)
    if (attempt <= 60) return 800; // Next 30 attempts: 800ms (medium - covers ~24s more)
    return 1000; // After that: 1 second
  };

  // IMMEDIATE CHECK: Check right away (after the 2s delay from upload)
  // This catches cases where result is ready immediately
  try {
    const immediateResult = await getImageResult(jobId);
    const hasItems = immediateResult.data && 
                    immediateResult.data.items && 
                    Array.isArray(immediateResult.data.items) && 
                    immediateResult.data.items.length > 0;
    const hasItemsCount = immediateResult.data?.items_count && immediateResult.data.items_count > 0;
    
    if (hasItems || hasItemsCount) {
      console.log(`✅ Result ready immediately (0 attempts)!`);
      return immediateResult;
    }
  } catch (error: any) {
    // If immediate check fails (404, etc.), continue with polling
    // This is expected - result might not be ready yet
    console.log(`⏳ Result not ready yet (404 expected), starting polling...`);
  }

  // Start polling loop
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await getImageResult(jobId);

      // Check if result has items (processing completed)
      // Also check items_count > 0 as backup check
      const hasItems = result.data && 
                      result.data.items && 
                      Array.isArray(result.data.items) && 
                      result.data.items.length > 0;
      
      const hasItemsCount = result.data?.items_count && result.data.items_count > 0;

      if (hasItems || hasItemsCount) {
        console.log(`✅ Result ready after ${attempt} attempts!`);
        return result;
      }

      // If no items yet, continue polling
      // onProgress can return true to signal abort
      if (onProgress) {
        const shouldAbort = onProgress(attempt, maxAttempts);
        if (shouldAbort === true) {
          throw {
            message: "Đã hủy",
          } as ApiError;
        }
      }

      // Wait before next attempt (except for last attempt)
      // Use dynamic interval for faster initial checks
      if (attempt < maxAttempts) {
        const currentInterval = getCurrentInterval(attempt);
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), currentInterval);
        });
      }
    } catch (error: any) {
      // If it's a network error or timeout, continue polling (don't give up immediately)
      const isNetworkError = 
        error.message?.includes("Không thể kết nối") ||
        error.message?.includes("Network") ||
        error.message?.includes("timeout") ||
        error.message?.includes("Request timeout") ||
        error.message?.includes("Failed to connect");
      
      // 404 errors are retryable - job might not be ready yet
      const isRetryableError = 
        error.status === 404 || 
        error.isRetryable ||
        error.message?.includes("chưa sẵn sàng") ||
        error.message?.includes("Đang xử lý");
      
      if (isNetworkError || isRetryableError) {
        const errorType = isNetworkError ? "Network error" : "404 (job not ready)";
        console.warn(`⚠️ ${errorType} on attempt ${attempt}/${maxAttempts}. Will retry...`);
        if (onProgress) {
          const shouldAbort = onProgress(attempt, maxAttempts);
          if (shouldAbort === true) {
            throw {
              message: "Đã hủy",
            } as ApiError;
          }
        }
        if (attempt < maxAttempts) {
          // Wait a bit longer on network error before retrying
          const waitTime = isNetworkError ? intervalMs * 1.5 : intervalMs;
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), waitTime);
          });
          continue;
        }
      }
      
      // For other errors (like 500, etc.), also continue polling for a few more attempts
      // because server might be temporarily unavailable
      if (attempt < maxAttempts - 5) { // Allow 5 more attempts even on non-network errors
        console.warn(`⚠️ Error on attempt ${attempt}/${maxAttempts}: ${error.message}. Will retry...`);
        if (onProgress) {
          const shouldAbort = onProgress(attempt, maxAttempts);
          if (shouldAbort === true) {
            throw {
              message: "Đã hủy",
            } as ApiError;
          }
        }
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), intervalMs);
        });
        continue;
      }
      
      // Only throw error if we're near the end of attempts
      throw error;
    }
  }

  // If we've exhausted all attempts
  // This should rarely happen since we return immediately when result is ready
  console.error(`❌ Polling exhausted after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`);
  throw {
    message: "Xử lý ảnh mất quá nhiều thời gian. Vui lòng thử lại sau.",
  } as ApiError;
};

