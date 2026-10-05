export const encodeFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (error) => reject(error);
  });
};

export const extractBase64 = (arr: any[]) => arr.map((file) => file.image);

export const getFileNameFromUrl = (url?: string): string => {
  return url?.split("/").pop() ?? "";
};

/** Strip `data:*;base64,` prefix from encoded file strings before API upload. */
export function stripDataUrlBase64Prefix(s: string | null | undefined): string {
  return s?.replace(/^data:[^;]+;base64,/, "") ?? "";
}
