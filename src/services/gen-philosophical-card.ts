import ky, { HTTPError } from "ky";
import { emitter } from "@/utils/mitt";
import { store, languageAtom } from "@/stores";
import { langToCountry } from "@/utils/302";

interface GenerateHTMLParams {
  apiKey: string;
  model: string;
  lang: "zh" | "en" | "ja";
  style: string;
  content: string;
  cardFont: string;
}

interface GenerateHTMLResult {
  html: string;
}

export const genPhilosophicalCard = async ({
  apiKey,
  model,
  lang,
  style,
  content,
  cardFont,
}: GenerateHTMLParams) => {
  try {
    const res = await ky.post("/api/gen-philosophical-card", {
      timeout: 300000,
      json: {
        apiKey,
        model,
        lang,
        content,
        style,
        cardFont,
      },
    });
    return res.json<GenerateHTMLResult>();
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
