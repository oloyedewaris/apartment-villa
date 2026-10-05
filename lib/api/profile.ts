import { BaseURL, BaseURL_ONE } from "../constants/auth-keys";
import { store_name } from "../constants/store-name";
import { axiosInstance } from "./axiosInstance";

export type GetProfileDataPayload = {
  profile?: boolean;
  next_of_kin?: boolean;
  documents?: boolean;
};

export const getProfileData = async (data: GetProfileDataPayload) => {
  const name = store_name();
  return await axiosInstance.post(`${BaseURL}/store/store_settings?store_name=${encodeURIComponent(name)}`, data);
};

/** `res.data.data` from store_settings POST when the API nests the payload there. */
export function extractStoreSettingsNestedData(res: unknown): Record<string, unknown> | null {
  const nested = (res as { data?: { data?: unknown } } | undefined)?.data?.data;
  if (nested != null && typeof nested === "object") return nested as Record<string, unknown>;
  return null;
}

export const updateProfile = async (data: Record<string, unknown>) => {
  const name = store_name();
  return await axiosInstance.patch(`${BaseURL}/store/store_settings?store_name=${encodeURIComponent(name)}`, data);
};

export const createKYCRequest = async (data: Record<string, unknown>) => {
  return await axiosInstance.post(`${BaseURL_ONE}/user/customer/kyc-extended/`, data);
};
