import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT and Email to every request
api.interceptors.request.use(async (config) => {
  const session = await getSession() as any;
  const bearerToken = session?.user?.systemToken || session?.systemToken || session?.user?.accessToken || session?.accessToken;
  console.log(`DEBUG: API Request to ${config.url}, Token exists: ${!!bearerToken}`);
  if (bearerToken) {
    config.headers.Authorization = `Bearer ${bearerToken}`;
  }
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes("/auth/");
      const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
      
      // Only sign out if we're not already trying to authenticate or on the login page
      if (!isAuthRequest && !isLoginPage) {
        console.warn("Unauthorized request detected, signing out...");
        signOut({ callbackUrl: "/login" });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
