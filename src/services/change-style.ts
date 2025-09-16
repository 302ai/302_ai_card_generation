import ky, { HTTPError } from "ky";
import { emitter } from "@/utils/mitt";
import { store, languageAtom } from "@/stores";
import { langToCountry } from "@/utils/302";
import { isSessionRunning } from "./mulerun-session-detector";

interface ChangeStyleParams {
  apiKey: string;
  content: string;
  html: string;
  isMulerun: boolean;
  sessionId: string;
  agentId: string;
}

interface GenerateHTMLResult {
  html: string;
}

export const generateHTML = async ({
  apiKey,
  content,
  html,
  isMulerun,
  sessionId,
  agentId,
}: ChangeStyleParams) => {
  // Check Mulerun session status before proceeding
  if (isMulerun && sessionId) {
    try {
      const isRunning = await isSessionRunning(sessionId);
      if (!isRunning) {
        throw new Error("status.session_ended");
      }
    } catch (error) {
      throw new Error("status.session_check_failed");
    }
  }

  try {
    const res = await ky.post("/api/change-style", {
      timeout: 300000,
      json: {
        apiKey,
        content,
        html,
        isMulerun,
        sessionId,
        agentId,
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
