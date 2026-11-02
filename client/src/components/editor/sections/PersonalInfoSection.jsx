import {useEffect, useId, useState} from "react";
import QRCode from "qrcode";
import {Download, QrCode} from "lucide-react";
import {isValidQrUrl, normalizeQrCode} from "../utils/qrCode";

// Shared by the standard editor and the contact step of the resume wizard.
export default function ResumeQRCodeSection({resumeData, updateField}) {
  const id = useId();
  const qrCode = normalizeQrCode(resumeData?.qrCode);
  const {url, imageDataUrl} = qrCode;
  const validUrl = isValidQrUrl(url);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    setGenerationError("");
    if (!validUrl || imageDataUrl) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const image = await QRCode.toDataURL(url.trim(), {
          width: 512,
          margin: 4,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) updateField("qrCode.imageDataUrl", image);
      } catch {
        if (!cancelled) {
          setGenerationError(
            "Could not generate this QR code. Try a shorter URL."
          );
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, validUrl, imageDataUrl, updateField]);

  const invalidUrl = Boolean(url.trim()) && !validUrl;
  const error = invalidUrl
    ? "Enter a valid URL starting with https:// or http://."
    : generationError;

  const downloadPNG = () => {
    if (!imageDataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = imageDataUrl;
    anchor.download = "resume-qr.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <section
      className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800"
      aria-labelledby={`${id}-title`}
    >
      <h3
        id={`${id}-title`}
        className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
      >
        <QrCode className="h-4 w-4 shrink-0" aria-hidden="true" />
        Resume QR Code
      </h3>
      <div className="space-y-1.5">
        <label
          htmlFor={`${id}-url`}
          className="block text-sm text-gray-600 dark:text-gray-300"
        >
          Portfolio, GitHub, or LinkedIn URL
        </label>
        <input
          id={`${id}-url`}
          type="url"
          value={url}
          onChange={(event) => updateField("qrCode.url", event.target.value)}
          placeholder="https://yourportfolio.com"
          autoComplete="url"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="input-field transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            alt="Resume QR code preview"
            width={128}
            height={128}
            className="h-32 w-32 shrink-0"
          />
        )}
        <div className="space-y-3">
          {validUrl && !imageDataUrl && !error && (
            <p
              role="status"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Generating QR code…
            </p>
          )}
          <button
            type="button"
            disabled={!imageDataUrl}
            onClick={downloadPNG}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PNG
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={qrCode.enabled}
              onChange={(event) =>
                updateField("qrCode.enabled", event.target.checked)
              }
              className="h-4 w-4 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            Insert into resume header
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Header insertion is available in the Classic template.
          </p>
        </div>
      </div>
    </section>
  );
}
