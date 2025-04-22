"use client";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectValue,
  SelectTrigger,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsTrigger, TabsList } from "@/components/ui/tabs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAtom } from "jotai";
import {
  UiStoreActiveCard,
  UiStoreActiveTab,
  uiStoreAtom,
} from "@/stores/slices/ui_store";
import { CardExamples } from "@/constants/card-examples";
import ModelSelect from "./components/model-select";
import { formStoreAtom } from "@/stores/slices/form_store";
import DateSwitch from "./components/date-switch";
import QrSelect from "./components/qr-select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import QrUpload from "./components/qr-upload";
import QrGenerate from "./components/qr-generate";
import StyleTab from "./components/style-tab";
import StyleContent from "./components/style-content";
import {
  Form,
  FormField,
  FormLabel,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ModelId } from "@/constants/models";
import { appConfigAtom } from "@/stores";
import { store } from "@/stores";
import { generateHTML } from "@/services/gen-html";
import { historyStoreAtom } from "@/stores/slices/history_store";
import { useHistory } from "@/hooks/db/use-gen-history";
import { STYLES_LIST } from "@/constants/random-styles";
import { generateSVG } from "@/services/generate-svg";
import { usePosterHistory } from "@/hooks/db/use-poster-history";
import { genPhilosophicalCard } from "@/services/gen-philosophical-card";
import { usePhilosophicalHistory } from "@/hooks/db/use-philosophical-history";
import { useTranslations } from "next-intl";
const formSchema = z.object({
  "knowledge-card": z.object({
    model: z.string().optional(),
    content: z.string().optional(),
    // 添加一个新字段用于 "提取金句" 的 textarea
    extractKeyContent: z.string().optional(),
    date: z.string().optional(),
    qrCode: z.string().optional(),
    style: z.string().optional(),
  }),
  "promotional-poster": z.object({
    model: z.string().optional(),
    content: z.string().optional(),
    style: z.string().optional(),
  }),
  "quote-reference": z.object({
    model: z.string().optional(),
    author: z.string().optional(),
    cardFont: z.string().optional(),
    textPosition: z.string().optional(),
    content: z.string().optional(),
    style: z.string().optional(),
  }),
  "philosophical-card": z.object({
    model: z.string().optional(),
    content: z.string().optional(),
    style: z.string().optional(),
    cardFont: z.string().optional(),
  }),
});

const LeftPanel = () => {
  const [contentType, setContentType] = useState<
    | "knowledge-card"
    | "promotional-poster"
    | "philosophical-card"
    | "quote-reference"
  >("knowledge-card");
  const [uiStore, setUiStore] = useAtom(uiStoreAtom);
  const [showQrCode, setShowQrCode] = useState(false);
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  const [historyStore, setHistoryStore] = useAtom(historyStoreAtom);
  const { addHistory, updateHistoryHtml, updateHistoryStatus } = useHistory();
  const {
    addPosterHistory,
    updatePosterHistorySvg,
    updatePosterHistoryStatus,
  } = usePosterHistory();

  const t = useTranslations();

  const {
    addPhilosophicalHistory,
    updatePhilosophicalHistoryHtml,
    updatePhilosophicalHistoryStatus,
  } = usePhilosophicalHistory();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "knowledge-card": {
        model: "claude-3-7-sonnet-20250219",
      },
      "promotional-poster": {
        model: "claude-3-7-sonnet-20250219",
      },
      "philosophical-card": {
        model: "claude-3-7-sonnet-20250219",
      },
      "quote-reference": {
        model: "claude-3-7-sonnet-20250219",
      },
    },
  });

  const { apiKey } = store.get(appConfigAtom);

  // Remove local state for textarea content as we'll use the store
  // Add refs for the textareas to access them for filling with content

  // State for displayed examples - limited to 4
  const [displayedExamples, setDisplayedExamples] = useState<
    typeof CardExamples
  >([]);

  // Get random examples from the CardExamples array
  const getRandomExamples = useCallback(() => {
    const shuffled = [...CardExamples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4); // Get only 4 examples
  }, []);

  // Initialize examples on component mount and when active tab changes
  useEffect(() => {
    refreshExamples();
  }, []);

  // Function to refresh examples
  const refreshExamples = useCallback(() => {
    setDisplayedExamples(getRandomExamples());
  }, [getRandomExamples]);

  // Function to fill textarea with example content
  const fillWithExample = useCallback(
    (content: string) => {
      if (uiStore.activeTab === "input-based") {
        form.setValue("knowledge-card.content", content, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      } else {
        form.setValue("knowledge-card.extractKeyContent", content, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    },
    [uiStore.activeTab, form]
  );

  const onActiveTabChange = useCallback(
    (tab: UiStoreActiveTab) => {
      setUiStore((prev) => ({ ...prev, activeTab: tab }));
    },
    [setUiStore]
  );

  // Handle content changes
  const handleInputBasedChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setUiStore((prev) => ({
      ...prev,
      inputBasedContent: e.target.value,
    }));
  };

  const handleExtractKeyChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setUiStore((prev) => ({
      ...prev,
      extractKeyContent: e.target.value,
    }));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (uiStore.activeCard === "knowledge-card") {
      const historyId = crypto.randomUUID();
      const { "knowledge-card": knowledgeCard } = values;
      let newStyle = knowledgeCard.style as string;
      if (formStore.style === "random") {
        // Randomly select a style from STYLES_LIST
        const randomIndex = Math.floor(Math.random() * STYLES_LIST.length);
        newStyle = STYLES_LIST[randomIndex].description;
      }

      if (formStore.style === "template" || formStore.style === "custom") {
        newStyle = knowledgeCard.style as string;
      }

      try {
        const res = await generateHTML({
          apiKey: apiKey as string,
          model: knowledgeCard.model as string,
          lang: "cn",
          date: knowledgeCard.date as string,
          topic: knowledgeCard.content as string,
          style: newStyle,
          qrCode: knowledgeCard.qrCode as string,
          type: uiStore.activeTab,
        });
        await addHistory({
          html: res.html,
          status: "success",
        });
      } catch (error) {
        await updateHistoryStatus(historyId, "failed");
      }
    }
    if (uiStore.activeCard === "promotional-poster") {
      const { "promotional-poster": promotionalPoster } = values;
      try {
        const res = await generateSVG({
          apiKey: apiKey as string,
          model: promotionalPoster.model as string,
          lang: "cn",
          content: promotionalPoster.content as string,
          style: formStore.style,
          theme: promotionalPoster.style as string,
        });
        await addPosterHistory({
          svg: res.stringSVG,
          status: "success",
        });
      } catch (error) {
        // await updateHistoryStatus(historyId, "failed");
      }
    }
    console.log(uiStore.activeCard);

    if (uiStore.activeCard === "philosophical-card") {
      const { "philosophical-card": philosophicalCard } = values;
      try {
        const res = await genPhilosophicalCard({
          apiKey: apiKey as string,
          model: philosophicalCard.model as string,
          lang: "cn",
          content: philosophicalCard.content as string,
          style: formStore.style,
          cardFont: philosophicalCard.cardFont as string,
        });
        await addPhilosophicalHistory({
          html: res.html,
          status: "success",
        });
        // await addPosterHistory({
        //   html: res.html,
        //   status: "success",
        // });
      } catch (error) {
        // await updateHistoryStatus(historyId, "failed");
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <div className="space-y-4">
            {/* Dropdown */}
            <div>
              <Select
                value={uiStore.activeCard}
                onValueChange={(value) => {
                  setUiStore((prev) => ({
                    ...prev,
                    activeCard: value as UiStoreActiveCard,
                  }));
                }}
              >
                <SelectTrigger className="flex w-full justify-center py-3 text-lg">
                  <SelectValue placeholder="选择内容类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knowledge-card">
                    {t("switch_title.knowledge_card")}
                  </SelectItem>
                  <SelectItem value="promotional-poster">
                    {t("switch_title.poster")}
                  </SelectItem>
                  <SelectItem value="philosophical-card">
                    {t("switch_title.philosophy_card")}
                  </SelectItem>
                  <SelectItem value="quote-reference">
                    {t("switch_title.quote_card")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabs with Examples */}
            <div className="flex flex-col space-y-2">
              {uiStore.activeCard === "knowledge-card" && (
                <div className="flex items-center space-x-2">
                  <Tabs
                    value={uiStore.activeTab}
                    onValueChange={(value: string) =>
                      onActiveTabChange(value as UiStoreActiveTab)
                    }
                    className="w-full"
                  >
                    <div className="flex items-center space-x-2">
                      <TabsList className="h-9">
                        <TabsTrigger
                          value="input-based"
                          className="px-3 py-1.5 text-sm"
                        >
                          {t("switch_title.based_on_input")}
                        </TabsTrigger>
                        <TabsTrigger
                          value="extract-key"
                          className="px-3 py-1.5 text-sm"
                        >
                          {t("switch_title.extract_quote")}
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={refreshExamples}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-refresh-cw"
                          >
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                          </svg>
                        </Button>
                        {uiStore.activeTab === "input-based" ? (
                          <>
                            {displayedExamples.map((example, index) => (
                              <span
                                key={`${example.id}-${index}`}
                                className="cursor-pointer rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200"
                                onClick={() =>
                                  fillWithExample(example.input_based.content)
                                }
                              >
                                {example.input_based.title}
                              </span>
                            ))}
                          </>
                        ) : (
                          <>
                            {displayedExamples.map((example, index) => (
                              <span
                                key={`${example.id}-${index}`}
                                className="cursor-pointer rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200"
                                onClick={() =>
                                  fillWithExample(example.extract_key.content)
                                }
                              >
                                {example.extract_key.title}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    <TabsContent value="input-based" className="mt-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="knowledge-card.content" // RHF 字段名
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder={t("placeholder.based_on_input")}
                                className="min-h-[200px]"
                                {...field} // 将 RHF 提供的 props (value, onChange, onBlur, ref) 传递给 Textarea
                              />
                            </FormControl>
                            <FormMessage /> {/* 显示验证错误 */}
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="extract-key" className="mt-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="knowledge-card.extractKeyContent" // RHF 字段名 (与 schema 对应)
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder={t("placeholder.extract_quote")}
                                className="min-h-[200px]"
                                {...field} // 添加field绑定，确保React Hook Form可以控制这个字段
                              />
                            </FormControl>
                            <FormMessage /> {/* 显示验证错误 */}
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              {uiStore.activeCard === "promotional-poster" && (
                <div>
                  <FormField
                    control={form.control}
                    name="promotional-poster.content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={t("placeholder.poster")}
                            className="min-h-[200px] w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {uiStore.activeCard === "quote-reference" && (
                <div>
                  <FormField
                    control={form.control}
                    name="quote-reference.content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={t("placeholder.quote_card")}
                            className="min-h-[200px] w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {uiStore.activeCard === "philosophical-card" && (
                <div>
                  <FormField
                    control={form.control}
                    name="philosophical-card.content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={t("placeholder.philosophy_card")}
                            className="min-h-[200px] w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Additional Controls */}
            <div className="mt-4 space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex w-full items-center justify-between">
                  <FormField
                    control={form.control}
                    name="knowledge-card.model"
                    render={({ field }) => (
                      <FormItem className="flex w-full items-center justify-between">
                        <FormLabel>{t("label.model_select")}</FormLabel>
                        <FormControl>
                          <ModelSelect
                            value={field.value as ModelId}
                            onChange={field.onChange}
                            name={field.name}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {/* <span className="text-sm">模型选择</span> */}
                  {/* <ModelSelect /> */}
                </div>
              </div>
              {uiStore.activeCard === "quote-reference" && (
                <div>
                  <FormField
                    control={form.control}
                    name="quote-reference.author"
                    render={({ field }) => (
                      <FormItem className="flex w-full items-center justify-between">
                        <FormLabel className="w-full">语录署名</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quote-reference.cardFont"
                    render={({ field }) => (
                      <FormItem className="flex w-full items-center justify-between">
                        <FormLabel className="w-full">
                          {t("label.card_font")}
                        </FormLabel>
                        <FormControl>
                          <Select {...field}>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择卡片字体" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">默认</SelectItem>
                              <SelectItem value="custom">自定义</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quote-reference.cardFont"
                    render={({ field }) => (
                      <FormItem className="flex w-full items-center justify-between">
                        <FormLabel className="w-full">
                          {t("label.text_position")}
                        </FormLabel>
                        <FormControl>
                          <Select {...field}>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  "placeholder.select_text_position"
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">
                                {t("select.left")}
                              </SelectItem>
                              <SelectItem value="center">
                                {t("select.center")}
                              </SelectItem>
                              <SelectItem value="right">
                                {t("select.right")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {uiStore.activeCard === "knowledge-card" && (
                <>
                  <div className="flex">
                    <div className="flex w-full items-center justify-between">
                      <FormField
                        control={form.control}
                        name="knowledge-card.date"
                        render={({ field }) => (
                          <FormItem className="flex w-full items-center justify-between">
                            <FormLabel>{t("label.date_display")}</FormLabel>
                            <FormControl>
                              <DateSwitch field={field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("label.qr_code")}</span>
                    <QrSelect />
                  </div>

                  <FormField
                    control={form.control}
                    name="knowledge-card.qrCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <>
                            {formStore.qrType === "upload" && (
                              <QrUpload field={field} />
                            )}
                            {formStore.qrType === "genrate" && (
                              <QrGenerate field={field} />
                            )}
                          </>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
              {uiStore.activeCard === "philosophical-card" && (
                <div>
                  <FormField
                    control={form.control}
                    name="philosophical-card.cardFont"
                    render={({ field }) => (
                      <FormItem className="flex w-full items-center justify-between">
                        <FormLabel className="w-full">卡片字体</FormLabel>
                        <FormControl>
                          <Select {...field}>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择卡片字体" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">默认</SelectItem>
                              <SelectItem value="custom">自定义</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <div className="flex items-center">
                <span className="flex-1">{t("label.style_setting")}</span>
                <StyleTab />
              </div>
              {uiStore.activeCard === "knowledge-card" && (
                <FormField
                  control={form.control}
                  name="knowledge-card.style"
                  render={({ field }) => (
                    <StyleContent field={field} type="knowledgeCard" />
                  )}
                />
              )}
              {uiStore.activeCard === "promotional-poster" && (
                <FormField
                  control={form.control}
                  name="promotional-poster.style"
                  render={({ field }) => (
                    <StyleContent field={field} type="promotionalPoster" />
                  )}
                />
              )}
              {uiStore.activeCard === "quote-reference" && (
                <FormField
                  control={form.control}
                  name="quote-reference.style"
                  render={({ field }) => (
                    <StyleContent field={field} type="promotionalPoster" />
                  )}
                />
              )}
              {uiStore.activeCard === "philosophical-card" && (
                <FormField
                  control={form.control}
                  name="philosophical-card.style"
                  render={({ field }) => (
                    <StyleContent field={field} type="promotionalPoster" />
                  )}
                />
              )}
            </div>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-purple-500 py-6 text-lg hover:bg-purple-600"
        >
          {t("button.generate")}
        </Button>
      </form>
    </Form>
  );
};

export default LeftPanel;
