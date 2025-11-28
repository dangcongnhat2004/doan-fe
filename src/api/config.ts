
// // API Configuration
// export const API_BASE_URL = "http://13.114.44.75:5000";

// export const API_ENDPOINTS = {
//   AUTH: {
//     REGISTER: "/auth/register",
//     LOGIN: "/auth/login",
//   },
//   IMAGE: {
//     UPLOAD: "/image/upload",
//     RESULT: "/image/result", 
//   },
//   QUESTIONS: {
//     BATCH: "/questions/batch",
//   },
// } as const;

import { Platform } from "react-native";
// export const API_BASE_URL = "http://13.114.44.75:5000";
export const API_BASE_URL = "http://std-tgh-alb-978411868.ap-northeast-1.elb.amazonaws.com";

// const BACKEND_URL = "http://std-tgh-alb-978411868.ap-northeast-1.elb.amazonaws.com";

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
  },
  IMAGE: {
    UPLOAD: "/api/image/upload",
    RESULT: "/api/image/result", 
  },
  QUESTIONS: {
    BATCH: "/api/questions/batch",
    SEMANTIC_SEARCH: "/api/questions/semantic-search",
  },
} as const;

export const IMAGE_UPLOAD_BASE_URL = API_BASE_URL;

