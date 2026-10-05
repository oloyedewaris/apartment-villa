import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return "Something went wrong. Please try again.";

  const message = error.response?.data?.message;
  return typeof message === "string" && message ? message : error.message;
}
