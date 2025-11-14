import axios from "axios";
import { Toast } from "antd-mobile";

const getToken = () => localStorage.getItem("authToken");
const setToken = (token) => localStorage.setItem("authToken", token);
const getRefreshToken = () => localStorage.getItem("refreshToken");

// Smart API URL detection using environment variables
const getAPIBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL_PRODUCTION || "https://playstore-application-0-1-gttk.vercel.app/api";
  }
  
  const hostname = window.location.hostname;
  
  // Development environments
  if (hostname === "localhost") {
    return process.env.REACT_APP_API_URL_LOCAL || "http://localhost:5000/api";
  } else if (hostname.startsWith("192.")) {
    return process.env.REACT_APP_API_URL_LAN || `http://${hostname}:5000/api`;
  }
  
  // Fallback to production
  return process.env.REACT_APP_API_URL_PRODUCTION || "https://playstore-application-0-1-gttk.vercel.app/api";
};

const API_URL = getAPIBaseURL();

console.log("🔧 API Configuration:", {
  environment: process.env.NODE_ENV,
  hostname: window.location.hostname,
  apiURL: API_URL
});

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ===== REQUEST INTERCEPTOR =====
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) delete config.headers["Content-Type"];
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== REFRESH TOKEN HANDLING =====
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.url}`, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    console.log(`❌ API Error: ${originalRequest?.url}`, status, error.message);

    // If unauthorized
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token available");

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data;

        if (!accessToken || !newRefreshToken) throw new Error("Invalid token response");

        setToken(accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;

        console.error("🔒 Token refresh failed:", err.message);

        // Avoid duplicate logout triggers
        if (!window.location.pathname.includes("/login")) {
          Toast.show({
            content: "Session expired. Please log in again.",
            icon: "fail",
          });
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          setTimeout(() => (window.location.href = "/login"), 1200);
        }

        return Promise.reject(err);
      }
    }

    // Handle other errors
    if (status && status !== 401) {
      const message = error.response?.data?.message || "Something went wrong!";
      Toast.show({ content: message, icon: "fail" });
    }

    return Promise.reject(error);
  }
);

export default api;