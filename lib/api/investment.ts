import { BaseURL, BaseURL_ONE } from "../constants/auth-keys";
import { business_id, store_name } from "../constants/store-name";
import { axiosInstance } from "./axiosInstance";

export async function fetchProjectBundles(projectId: number, pageParam?: string) {
  return await axiosInstance.get(`${BaseURL}/investment/project-bundles/?project_id=${projectId}${pageParam ? `&${pageParam}` : ""}`);
}

export async function fetchBundlePaymentPlans(bundleId: number) {
  return await axiosInstance.get(`${BaseURL}/investment/bundle-paymentplans/?bundle_id=${bundleId}`);
}

export const fetchCustomPlanSummary = async (planId?: string | number) => {
  return await axiosInstance.get(`${BaseURL}/investment/custom-plan-payments/${planId}/`);
};

export async function fetchProjectDocumentsQuery(query: string) {
  return await axiosInstance.get(`${BaseURL}/developers/project-documents?${query}`);
}

export async function fetchFractionsInfo(unitId: number) {
  return await axiosInstance.get(`${BaseURL}/developers/fractions/info/${unitId}`);
}

export type FetchBankDetailsParams = {
  projectID: number;
  equityID?: number | string | null;
};

export async function fetchProjectBankAccounts(params: FetchBankDetailsParams) {
  const q = new URLSearchParams();
  q.set("project", String(params.projectID));
  if (params.equityID != null && params.equityID !== "") q.set("equity_id", String(params.equityID));
  return await axiosInstance.get(`${BaseURL}/payment/project-account/?${q.toString()}`);
}

export type EquityPaymentBody = Record<string, unknown>;

function eSubReferralSuffix(referralParams: string) {
  return referralParams.startsWith("&") ? referralParams : referralParams ? `&${referralParams}` : "";
}

export async function makeEquityPayment(body: EquityPaymentBody, referralParams = "") {
  const suffix = eSubReferralSuffix(referralParams);
  return await axiosInstance.post(`${BaseURL}/investment/equity/?e_sub=true${suffix}`, body);
}

/** Poll / read equity after instant bank transfer (payment gateway). */
export async function fetchEquityById(equityId: number, referralParams = "") {
  const suffix = eSubReferralSuffix(referralParams);
  return await axiosInstance.get(`${BaseURL}/investment/equity/${equityId}/?e_sub=true${suffix}`);
}

export async function fetchEquityTransactionHistory(equityId: number, email: string) {
  return await axiosInstance.get(`${BaseURL}/investment/portfolio/?equity_id=${equityId}&email=${email}`);
}

export async function sendInvestorPackets(equityId: number, body: any) {
  return await axiosInstance.post(`${BaseURL}/investment/equity/${equityId}/packets/`, body);
}

export async function fetchInvestorPackets(equityId: number) {
  return await axiosInstance.get(`${BaseURL}/investment/equity/${equityId}/packets/?requester=customer`);
}

export type ConfirmEquityBankTransferBody = {
  account_number: string;
  bank_name: string;
  bank_code: string;
  receipt_url: string;
};

/** POST /v2/investment/equity/:equity_id/bank-transfer/ — confirm manual transfer + receipt URL. */
export async function confirmEquityBankTransfer(equityId: number, body: ConfirmEquityBankTransferBody, referralParams = "") {
  const suffix = eSubReferralSuffix(referralParams);
  return await axiosInstance.post(`${BaseURL}/investment/equity/${equityId}/bank-transfer/?e_sub=true${suffix}`, body);
}

export async function uploadEquityBankTransferReceipt(
  body: {
    equity_id: number;
    receipt_url: string;
  },
  referralParams = "",
) {
  const suffix = eSubReferralSuffix(referralParams);
  return await axiosInstance.post(`${BaseURL}/payment-confirmation/receipt/parse?e_sub=true${suffix}`, body);
}

export type ExpectationBody = {
  equity_id: number;
  coa_bank_account_id: string | number;
  receipt_url: string;
  sender_name: string;
  transaction_reference: string;
  payment_time: string;
  amount: string | number;
  currency: string;
};

export async function createAmountExpectation(body: ExpectationBody, referralParams = "") {
  const suffix = eSubReferralSuffix(referralParams);
  return await axiosInstance.post(`${BaseURL}/payment-confirmation/expectations/create?e_sub=true${suffix}`, body);
}

/** @deprecated Use confirmEquityBankTransfer */
export async function confirmEquityManualPayment(equityId: number, body: ConfirmEquityBankTransferBody, referralParams = "") {
  return confirmEquityBankTransfer(equityId, body, referralParams);
}

export async function fetchPendingEquities(listingId?: string | number, unitId?: string | number, paymentPlanId?: string | number) {
  return await axiosInstance.get(
    `${BaseURL}/investment/equity/pending-equities/${listingId ? `?project_id=${listingId}` : ""}${unitId ? `&unit_id=${unitId}` : ""}${paymentPlanId ? `&payment_plan_id=${paymentPlanId}` : ""}`,
  );
}

export async function makeEquityDeposit(body: EquityPaymentBody) {
  return await axiosInstance.post(`${BaseURL}/investment/make-equity-payment`, body);
}

/** POST /v1/investment/upload/ — multipart file upload; returns CDN URLs in `data`. */
export async function uploadInvestmentFiles(files: File[]) {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  return await axiosInstance.post<{ data?: string[] }>(`${BaseURL_ONE}/investment/upload/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData && headers) {
          delete headers["Content-Type"];
        }
        return data;
      },
    ],
  });
}

export type UploadEquityReceiptBody = {
  note?: string;
  receipt_list: string[];
  equity_id: number | string;
};

/** @deprecated Prefer confirmEquityBankTransfer after uploadInvestmentFiles / uploadFileAsBase64. */
export async function uploadEquityReceipt(body: UploadEquityReceiptBody) {
  return await axiosInstance.post(`${BaseURL}/investment/upload-receipt/`, body);
}

/** v1 upload (kept for parity with buyback investment helpers). */
export async function uploadFileAsBase64(body: { pdf: boolean; files: string[] }) {
  return await axiosInstance.post<{ data?: string[] }>(`${BaseURL_ONE}/investment/uploadbase64/`, body);
}

export async function fetchListingWithStore(projectId: number) {
  const name = store_name();
  return await axiosInstance.get(`${BaseURL_ONE}/investment/project/${projectId}?store_name=${encodeURIComponent(name)}`);
}

export type CheckPendingEquityParams = {
  unitId: number | string;
  paymentPlanId?: number | string | null;
};

export async function fetchCheckPendingEquity(params: CheckPendingEquityParams) {
  const q = new URLSearchParams();
  q.set("unit_id", String(params.unitId));
  if (params.paymentPlanId != null && params.paymentPlanId !== "") {
    q.set("payment_plan_id", String(params.paymentPlanId));
  }
  return await axiosInstance.get(`${BaseURL}/investment/equity/check-pending/?${q.toString()}`);
}

/** GET /v2/investment/equity/:equity_id/bank-accounts/ */
export async function fetchEquityBankAccounts(equityId: number, referralParams = "") {
  const suffix = eSubReferralSuffix(referralParams);
  const query = suffix ? `?${suffix.replace(/^&/, "")}` : "";
  return await axiosInstance.get(`${BaseURL}/investment/equity/${equityId}/bank-accounts/${query}`);
}

export const fetchSavedCards = async () => {
  const bid = business_id();
  return await axiosInstance.get(`${BaseURL}/account/cards/?business_id=${bid}`);
};

export const makeeDepositToWallet = (depositPayload: any) => {
  return axiosInstance.post(`${BaseURL}/store/deposit/`, depositPayload);
};

export const fetchUserEquity = async (status: "PAID" | "PENDING") => {
  const storeName = store_name();

  return await axiosInstance.get(`${BaseURL}/investment/equity/?paymentStatus=${status}&store_name=${storeName && storeName}`);
};

export const fetchWalletCurrentBalance = async () => {
  const storeName = store_name();

  return await axiosInstance.get(`${BaseURL}/store/account-balance/?store=${storeName}`);
};

export const fetchEquityBankPayments = async (equity_id: string) => {
  return await axiosInstance.get(`${BaseURL}/investment/equity/${equity_id}/bank-transfers/`);
};

export const notifySoldOutListing = async (listingId: string, { name, email }: { name: string; email: string }) => {
  return await axiosInstance.post(`${BaseURL}/investment/project-availability-alert/${listingId}/`, { name, email });
};

export const notifySoldOutUnit = async (unitId: string, { name, email }: { name: string; email: string }) => {
  return await axiosInstance.post(`${BaseURL}/investment/bundle-availability-alert/${unitId}/`, { name, email });
};

export const cancelPendingTransaction = async (equityId: string) => {
  return await axiosInstance.post(`${BaseURL}/investment/equity/${equityId}/cancel-pending/`);
};

export const getProjectFaqs = async (equityId: string) => {
  return await axiosInstance.get(`${BaseURL}/investment/project/${equityId}/faq/`);
};
