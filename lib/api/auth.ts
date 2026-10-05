import { BaseURL, BaseURL_ONE } from "../constants/auth-keys";
import { business_id, store_name } from "../constants/store-name";
import { axiosInstance } from "./axiosInstance";

const v1BaseUrl = () => BaseURL.replace("v2", "v1");

export type FeedBackPayload = {
  message: string;
  image?: string[];
  rating?: number;
  feedback?: string;
};

export const fetchStoreDetails = async () => {
  const name = store_name();
  return await axiosInstance.get(`${BaseURL}/store/store_info/?store_name=${encodeURIComponent(name)}`);
};

export const fetchAppLinks = async () => {
  const bid = business_id();
  return await axiosInstance.get(`${BaseURL}/developers/app-links/?business_id=${bid}`);
};

export const storeLogin = async (data: { email: string; store_name: string }, agentId?: string) => {
  const query = agentId ? `?buyback=true&agent=${encodeURIComponent(agentId)}` : "?buyback=true";
  return await axiosInstance.post(`${BaseURL}/store/login/${query}`, data);
};

export const requestOTPForEmailVerification = async (data: { email: string; verify?: boolean }) => {
  const bid = business_id();
  return await axiosInstance.post(`${v1BaseUrl()}/user/create_totp_email_extended`, {
    ...data,
    business_id: bid,
  });
};

export const loginWithOTP = async (data: { email: string; code: string }) => {
  const bid = business_id();
  return await axiosInstance.post(`${BaseURL}/store/direct-purchase/`, {
    email: data.email.trim(),
    code: data.code,
    business_id: bid,
  });
};

export const outreach = async (data: { outreach: string; others_field?: string; agent_name?: string; store_name: string; email: string }) => {
  return await axiosInstance.post(`${BaseURL}/developers/outreach`, data);
};

export type RegisterUserPayload = {
  store_name: string;
  email: string;
  gender?: string;
  phone?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  ref_id?: string;
  [key: string]: unknown;
};

export const registerUser = async (data: RegisterUserPayload, passToken = true) => {
  const url = `${BaseURL}/store/customers/${passToken ? "?verify=true" : ""}`;
  return await axiosInstance.post(url, data);
};

export const verifyMagicToken = async (token: string) => {
  return await axiosInstance.post(`${BaseURL}/store/verify-magic-token/`, {
    token,
  });
};

export const reportABug = async (body: FeedBackPayload) => {
  const bid = business_id();
  const data = { ...body, business_id: bid };
  return axiosInstance.post(`${BaseURL_ONE}/account/bug-report`, data);
};

export const suggestAFeature = async (body: FeedBackPayload) => {
  const bid = business_id();
  const data = { ...body, business_id: bid };
  return axiosInstance.post(`${BaseURL_ONE}/account/suggestions`, data);
};

export const giveFeedback = async (body: FeedBackPayload) => {
  const storeName = store_name();
  return axiosInstance.post(`${BaseURL_ONE}/investment/feedback?store_name=${storeName}`, body);
};

export const getAgentDetails = async (id: string) => {
  return axiosInstance.get(`${BaseURL}/agents/fetch-by-agent-id/${id}/`);
};
