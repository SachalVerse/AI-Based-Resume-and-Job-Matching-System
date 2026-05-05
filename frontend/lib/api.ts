import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT and Email to every request
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  const bearerToken = session?.systemToken || session?.accessToken;
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
      // Clear the NextAuth session and redirect to login
      signOut({ callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

export default api;
