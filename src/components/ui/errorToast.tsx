import { appConfigAtom, store } from "@/stores";
import { useTranslations } from "next-intl";

export interface IErrorCode {
  error: {
    err_code: number;
    message: string;
    message_cn: string;
    message_jp: string;
    type: string;
  };
}
export function ErrorToast(code: number) {
  const t = useTranslations();
  const { region } = store.get(appConfigAtom);
  const errorCodes = [
    -10001, -10002, -10003, -10004, -10005, -10006, -10007, -10008, -10009,
    -10010, -10011, -10012, -10018, -1024,
  ];
  const errorCode = errorCodes.indexOf(code) > -1 ? code : "-default";
  return t.rich(`global.error.code${errorCode}`, {
    Gw: () => (
      <div
        style={{ color: "#006dff", cursor: "pointer" }}
        onClick={() => {
          const url =
            region == "0"
              ? `${process.env.NEXT_PUBLIC_302_WEBSITE_URL_CHINA}`
              : `${process.env.NEXT_PUBLIC_302_WEBSITE_URL_GLOBAL}`;
          window.location.href = url;
        }}
      >
        302.AI
      </div>
    ),
  });
}
