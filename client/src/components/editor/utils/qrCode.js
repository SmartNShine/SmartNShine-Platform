export const DEFAULT_QR_CODE = {
  url: "",
  enabled: false,
  imageDataUrl: "",
};

export function isValidQrUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value.trim()))
    return false;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeQrCode(value) {
  const url = typeof value?.url === "string" ? value.url : "";
  return {
    url,
    enabled: value?.enabled === true,
    imageDataUrl:
      isValidQrUrl(url) &&
      typeof value?.imageDataUrl === "string" &&
      value.imageDataUrl.startsWith("data:image/png;base64,")
        ? value.imageDataUrl
        : "",
  };
}
