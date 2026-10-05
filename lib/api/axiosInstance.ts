import axios from "axios";
import { BaseURL } from "../constants/auth-keys";
import { store_name } from "../constants/store-name";

export const axiosInstance = axios.create({
  baseURL: BaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30 * 60 * 1000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem("token");
    const storeName = store_name();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (storeName) config.headers["store-name"] = storeName;
    return config;
  },
  (error) => Promise.reject(error),
);

export const unauthaxiosInstance = axios.create({
  baseURL: BaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30 * 60 * 1000,
});

unauthaxiosInstance.interceptors.request.use(
  async (config) => {
    const storeName = store_name();
    if (storeName) config.headers["store-name"] = storeName;
    return config;
  },
  (error) => Promise.reject(error),
);
