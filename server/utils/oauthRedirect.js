const productionClientUrl = "https://www.smartnshine.in";

const migrateLegacyOrigin = (url) => {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "smartnshine.app" || hostname === "www.smartnshine.app") {
    return productionClientUrl;
  }
  if (hostname.endsWith(".smartnshine.app")) {
    return `https://${hostname.replace(/\.smartnshine\.app$/, ".smartnshine.in")}`;
  }
  return url.origin;
};

export const getSafeClientRedirectUrl = (req) => {
  let defaultClientUrl = productionClientUrl;
  try {
    const configured = new URL(process.env.CLIENT_URL || productionClientUrl);
    if (["http:", "https:"].includes(configured.protocol)) {
      defaultClientUrl = migrateLegacyOrigin(configured);
    }
  } catch {
    // A malformed setting must not break OAuth callbacks.
  }

  try {
    const rawOrigin = req.query.state || req.query.origin;
    if (typeof rawOrigin !== "string") return defaultClientUrl;
    const parsed = new URL(decodeURIComponent(rawOrigin));
    if (!["http:", "https:"].includes(parsed.protocol)) return defaultClientUrl;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "smartnshine.app" ||
      hostname.endsWith(".smartnshine.app") ||
      hostname === "smartnshine.in" ||
      hostname.endsWith(".smartnshine.in") ||
      hostname.endsWith(".vercel.app")
    ) {
      return migrateLegacyOrigin(parsed);
    }
  } catch {
    // Invalid or untrusted origins use the configured frontend.
  }
  return defaultClientUrl;
};
