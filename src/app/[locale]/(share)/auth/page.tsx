"use client";
import SignInForm from "@/components/forms/auth";
import AppLogo from "@/components/global/app-logo";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AuthPage() {
  const t = useTranslations();
  return (
    <div className="flex w-full min-w-[375px] flex-1 flex-col items-center justify-center p-0 transition-[padding] ease-in-out lg:px-32 lg:py-16 xl:px-64">
      <div className="flex h-full w-full flex-1 flex-col rounded-none border-gray-300 bg-pageBackground p-9 dark:border-gray-700 dark:bg-background dark:shadow-none lg:rounded-3xl lg:border lg:bg-white lg:shadow-xl">
        <div className="flex flex-1 flex-col justify-around gap-4">
          <AppLogo size="full" wrapperClassName="mx-auto h-[36px] w-[128px]" />
          <div className="mx-auto flex w-full flex-col items-center gap-2 text-center transition-all ease-in-out md:w-4/5 lg:w-72">
            <div className="flex justify-center">
              <Lock className="size-8 text-current" />
            </div>
            <div className="mt-4 text-xl font-bold">{t("auth.title")}</div>
            <div className="mb-5">{t("auth.description")}</div>
            <SignInForm />
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
