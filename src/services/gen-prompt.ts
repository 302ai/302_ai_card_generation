import ky, { HTTPError } from "ky";
import { emitter } from "@/utils/mitt";
import { store, languageAtom } from "@/stores";
import { langToCountry } from "@/utils/302";

interface GenerateImageParams {
  apiKey: string;
  model: string;
  lang: "cn" | "en" | "jp";
  date: string;
  topic: string;
  style: string;
  qrCode: string;
}

interface GenerateImageResult {
  naturalLanguage: string;
  keywords: string;
}

export const generatePrompt = async ({
  apiKey,
  model,
  lang,
  date,
  topic,
  style,
  qrCode,
}: GenerateImageParams) => {
  try {
    const res = await ky.post("/api/gen-card", {
      timeout: 300000,
      json: {
        apiKey,
        model,
        lang,
        date,
        topic,
        style,
        qrCode,
      },
    });
    return res.json<GenerateImageResult>();
  } catch (error) {
    if (error instanceof Error) {
      const uiLanguage = store.get(languageAtom);

      if (error instanceof HTTPError) {
        try {
          const errorData = JSON.parse((await error.response.json()) as string);
          if (errorData.error && uiLanguage) {
            const countryCode = langToCountry(uiLanguage);
            const messageKey =
              countryCode === "en" ? "message" : `message_${countryCode}`;
            const message = errorData.error[messageKey];
            emitter.emit("ToastError", {
              code: errorData.error.err_code,
              message,
            });
          }
        } catch {
          // If we can't parse the error response, show a generic error
          emitter.emit("ToastError", {
            code: error.response.status,
            message: error.message,
          });
        }
      } else {
        // For non-HTTP errors
        emitter.emit("ToastError", {
          code: 500,
          message: error.message,
        });
      }
    }
    throw error; // Re-throw the error for the caller to handle if needed
  }
};
