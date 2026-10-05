// import { STORE_DATA_KEY } from "@esub/constants";

import { STORE_DATA_KEY } from "./auth-keys";

/** Normalized store data persisted in sessionStorage (subset used by e-sub flows). */
export interface StoreData {
  business_id: string;
  business_name: string;
  email?: string;
  store_name: string;
  store_link: string;
  company_image: string;
  privacy_policy: string;
  terms: string;
  agent_active: boolean;
}

export function getStoredStoreData(): StoreData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORE_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreData;
    return parsed && typeof parsed.business_id === "string" ? parsed : null;
  } catch {
    return null;
  }
}
