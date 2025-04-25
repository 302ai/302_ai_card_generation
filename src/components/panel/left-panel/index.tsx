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
import { useLocale, useTranslations } from "next-intl";
import { generateQuoteCard } from "@/services/gen-quote";
import { useGenQuoteHistory } from "@/hooks/db/use-gen-quote-history";
import { toast } from "sonner";
import { STYLE_LIST } from "@/constants/style";
import { generationStoreAtom } from "@/stores/slices/generation_store";
import {
  concurrentTaskCountAtom,
  MAX_CONCURRENT_TASKS,
} from "@/stores/slices/task_store";
import { RefreshCwIcon } from "lucide-react";

const formSchema = z.object({
  knowledgeCard: z.object({
    model: z.string().optional(),
    content: z.string().optional(),
    // 添加一个新字段用于 "提取金句" 的 textarea
    extractKeyContent: z.string().optional(),
    date: z.string().optional(),
    qrCode: z.string().optional(),
    style: z.string().optional(),
    customStyle: z.string().optional(),
  }),
  promotionalPoster: z.object({
    model: z.string().optional(),
    content: z.string().optional(),
    style: z.string().optional(),
    styleType: z.string().optional(),
    customStyle: z.string().optional(),
  }),
  quoteReference: z.object({
    model: z.string().optional(),
    author: z.string().optional(),
    cardFont: z.string().optional(),
    textPosition: z.string().optional(),
    content: z.string().optional(),
    style: z.string().optional(),
    customStyle: z.string().optional(),
  }),
  philosophicalCard: z.object({
    model: z.string().optional(),
    content: z.string().optional(),
    style: z.string().optional(),
    cardFont: z.string().optional(),
    customStyle: z.string().optional(),
  }),
});

const FONTS = [
  {
    name: "行书",
    value: "/fonts/行书.otf",
    title: "fonts.xingshu",
  },
  {
    name: "宋体",
    value: "/fonts/宋体.otf",
    title: "fonts.songti",
  },
  {
    name: "汇文明朝体",
    value: "/fonts/汇文明朝体.ttf",
    title: "fonts.huiwenmingchao",
  },
  {
    name: "黑体",
    value: "/fonts/黑体.otf",
    title: "fonts.heiti",
  },
];

const LeftPanel = () => {
  const [uiStore, setUiStore] = useAtom(uiStoreAtom);
  const [showQrCode, setShowQrCode] = useState(false);
  const [formStore, setFormStore] = useAtom(formStoreAtom);
  const [historyStore, setHistoryStore] = useAtom(historyStoreAtom);
  const [concurrentTasks, setConcurrentTasks] = useAtom(
    concurrentTaskCountAtom
  );
  const { addHistory, updateHistory, updateHistoryStatus } = useHistory();
  const {
    addPosterHistory,
    updatePosterHistorySvg,
    updatePosterHistoryStatus,
    updatePosterHistory,
  } = usePosterHistory();

  const locale = useLocale();
  const t = useTranslations();
  const [generationStore, setGenerationStore] = useAtom(generationStoreAtom);

  const {
    addPhilosophicalHistory,
    updatePhilosophicalHistoryHtml,
    updatePhilosophicalHistoryStatus,
    updatePhilosophicalHistory,
  } = usePhilosophicalHistory();

  const {
    addQuoteHistory,
    updateQuoteHistoryHtml,
    updateQuoteHistory,
    updateQuoteHistoryStatus,
  } = useGenQuoteHistory();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      knowledgeCard: {
        model: "claude-3-7-sonnet-20250219",
      },
      promotionalPoster: {
        model: "claude-3-7-sonnet-20250219",
      },
      philosophicalCard: {
        model: "claude-3-7-sonnet-20250219",
        cardFont: "汇文明朝体",
      },
      quoteReference: {
        model: "claude-3-7-sonnet-20250219",
        cardFont: "汇文明朝体",
        textPosition: "left",
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
    (contentKey: string) => {
      if (uiStore.activeTab === "input-based") {
        form.setValue("knowledgeCard.content", t(contentKey), {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      } else {
        form.setValue("knowledgeCard.extractKeyContent", t(contentKey), {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    },
    [uiStore.activeTab, form, t]
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
    // Check concurrent task limit
    if (concurrentTasks >= MAX_CONCURRENT_TASKS) {
      toast.error(
        t("toast.task_limit_reached", { limit: MAX_CONCURRENT_TASKS })
      );
      return;
    }

    let historyId: string | undefined;
    let taskStarted = false;
    let updateStatusFunction:
      | ((
          id: string,
          data: { status: "pending" | "success" | "failed" }
        ) => Promise<void>)
      | undefined;

    try {
      if (uiStore.activeCard === "knowledge-card") {
        const { knowledgeCard } = values;
        let content = "";
        if (uiStore.activeTab === "input-based") {
          content = knowledgeCard.content as string;
        } else {
          content = knowledgeCard.extractKeyContent as string;
        }
        // Content validation
        if (!content || content.trim() === "") {
          toast.error(t("toast.content_required"));
          return;
        }

        // Model validation
        if (!knowledgeCard.model) {
          toast.error(t("toast.model_required"));
          return;
        }
        if (formStore.showDate && !knowledgeCard.date) {
          toast.error(t("toast.date_required"));
          return;
        }

        if (formStore.qrType === "genrate" || formStore.qrType === "upload") {
          if (!knowledgeCard.qrCode) {
            toast.error(t("toast.qr_code_required"));
            return;
          }
        }

        let newStyle = knowledgeCard.style as string;
        if (formStore.style === "random") {
          // Randomly select a style from STYLES_LIST
          const randomIndex = Math.floor(Math.random() * STYLES_LIST.length);
          newStyle = STYLES_LIST[randomIndex].description;
        }

        if (formStore.style === "template") {
          newStyle = knowledgeCard.style as string;
          if (!newStyle) {
            toast.error(t("toast.style_required"));
            return;
          }
        }
        if (formStore.style === "custom") {
          newStyle = knowledgeCard.customStyle as string;
          if (!newStyle || newStyle.trim() === "") {
            toast.error(t("toast.custom_style_required"));
            return;
          }
        }

        // Validation passed, start the task
        taskStarted = true;
        setConcurrentTasks((prev) => prev + 1);
        historyId = await addHistory({
          html: "",
          status: "pending",
        });
        updateStatusFunction = async (id, data) =>
          await updateHistory(id, { ...data, html: "" });

        const res = await generateHTML({
          apiKey: apiKey as string,
          model: knowledgeCard.model as string,
          lang: locale as "zh" | "en" | "ja",
          date: knowledgeCard.date as string,
          topic: content,
          style: newStyle,
          qrCode: knowledgeCard.qrCode as string,
          type: uiStore.activeTab,
        });
        await updateHistory(historyId, {
          html: res.html,
          status: "success",
        });
      } else if (uiStore.activeCard === "promotional-poster") {
        const { promotionalPoster } = values;

        // Content validation
        if (
          !promotionalPoster.content ||
          promotionalPoster.content.trim() === ""
        ) {
          toast.error(t("toast.poster_content_required"));
          return;
        }

        // Model validation
        if (!promotionalPoster.model) {
          toast.error(t("toast.model_required"));
          return;
        }

        let newStyle = "";
        if (formStore.style === "random") {
          // Randomly select a style from STYLES_LIST
          const randomIndex = Math.floor(Math.random() * STYLES_LIST.length);
          newStyle = STYLES_LIST[randomIndex].description;
        }

        if (formStore.style === "template") {
          newStyle = promotionalPoster.style as string;
          if (!newStyle) {
            toast.error(t("toast.style_required"));
            return;
          }
        }
        if (formStore.style === "custom") {
          newStyle = promotionalPoster.customStyle as string;
          if (!newStyle || newStyle.trim() === "") {
            toast.error(t("toast.custom_style_required"));
            return;
          }
        }

        // Validation passed, start the task
        taskStarted = true;
        setConcurrentTasks((prev) => prev + 1);
        historyId = await addPosterHistory({
          svg: "",
          status: "pending",
        });
        updateStatusFunction = async (id, data) =>
          await updatePosterHistory(id, { ...data, svg: "" });

        const res = await generateSVG({
          apiKey: apiKey as string,
          model: promotionalPoster.model as string,
          lang: locale as "zh" | "en" | "ja",
          content: promotionalPoster.content as string,
          style: newStyle,
          styleType: formStore.style as "random" | "template" | "custom",
        });
        await updatePosterHistory(historyId, {
          svg: res.stringSVG,
          status: "success",
        });
      } else if (uiStore.activeCard === "philosophical-card") {
        const { philosophicalCard } = values;

        // Content validation
        if (
          !philosophicalCard.content ||
          philosophicalCard.content.trim() === ""
        ) {
          toast.error(t("toast.philosophy_content_required"));
          return;
        }

        // Model validation
        if (!philosophicalCard.model) {
          toast.error(t("toast.model_required"));
          return;
        }

        let style = "";
        if (formStore.style === "random") {
          const randomIndex = Math.floor(
            Math.random() * STYLE_LIST["philosophicalCard"].length
          );
          style = STYLE_LIST["philosophicalCard"][randomIndex].prompt;
        }
        if (formStore.style === "template") {
          style = philosophicalCard.style as string;
          if (!style) {
            toast.error(t("toast.style_required"));
            return;
          }
        }
        if (formStore.style === "custom") {
          style = philosophicalCard.customStyle as string;
          if (!style || style.trim() === "") {
            toast.error(t("toast.custom_style_required"));
            return;
          }
        }

        // Validation passed, start the task
        taskStarted = true;
        setConcurrentTasks((prev) => prev + 1);
        historyId = await addPhilosophicalHistory({
          html: "",
          status: "pending",
        });
        updateStatusFunction = async (id, data) =>
          await updatePhilosophicalHistory(id, { ...data, html: "" });

        const res = await genPhilosophicalCard({
          apiKey: apiKey as string,
          model: philosophicalCard.model as string,
          lang: locale as "zh" | "en" | "ja",
          content: philosophicalCard.content as string,
          style,
          cardFont: philosophicalCard.cardFont as string,
        });
        await updatePhilosophicalHistory(historyId, {
          html: res.html,
          status: "success",
        });
      } else if (uiStore.activeCard === "quote-reference") {
        const { quoteReference } = values;

        // Content validation
        if (!quoteReference.content || quoteReference.content.trim() === "") {
          toast.error(t("toast.quote_content_required"));
          return;
        }

        // Model validation
        if (!quoteReference.model) {
          toast.error(t("toast.model_required"));
          return;
        }

        if (!quoteReference.author) {
          toast.error(t("toast.author_required"));
          return;
        }

        if (!quoteReference.textPosition) {
          toast.error(t("toast.text_position_required"));
          return;
        }

        let style = "";
        if (formStore.style === "random") {
          const randomIndex = Math.floor(
            Math.random() * STYLE_LIST["quoteReference"].length
          );
          style = STYLE_LIST["quoteReference"][randomIndex].prompt;
        }
        if (formStore.style === "template") {
          style = quoteReference.style as string;
          if (!style) {
            toast.error(t("toast.style_required"));
            return;
          }
        }
        if (formStore.style === "custom") {
          style = quoteReference.customStyle as string;
          if (!style || style.trim() === "") {
            toast.error(t("toast.custom_style_required"));
            return;
          }
        }

        // Validation passed, start the task
        taskStarted = true;
        setConcurrentTasks((prev) => prev + 1);
        historyId = await addQuoteHistory({
          html: "",
          status: "pending",
        });
        updateStatusFunction = async (id, data) =>
          await updateQuoteHistory(id, { ...data, html: "" });

        const res = await generateQuoteCard({
          apiKey: apiKey as string,
          model: quoteReference.model as string,
          content: quoteReference.content as string,
          author: quoteReference.author as string,
          cardFont: quoteReference.cardFont as string,
          textPosition: quoteReference.textPosition as string,
          style,
        });
        await updateQuoteHistory(historyId, {
          html: res.html,
          status: "success",
        });
      }
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error(t("toast.generation_failed"));

      // If the task has started and we have historyId and update function, update record to failed
      if (taskStarted && historyId !== undefined && updateStatusFunction) {
        try {
          await updateStatusFunction(historyId, { status: "failed" });
        } catch (updateError) {
          console.error(
            "Failed to update history status to failed:",
            updateError
          );
        }
      }
    } finally {
      // Only decrease the counter if the task actually started
      if (taskStarted) {
        setConcurrentTasks((prev) => Math.max(0, prev - 1)); // Ensure counter never goes below 0
      }
    }
  }

  return (
    <div className="md:sticky md:top-6">
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
                  <div className="space-y-2">
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
                      </div>

                      <TabsContent value="input-based" className="">
                        <FormField
                          control={form.control}
                          name="knowledgeCard.content" // RHF 字段名
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

                      <TabsContent value="extract-key" className="">
                        <FormField
                          control={form.control}
                          name="knowledgeCard.extractKeyContent" // RHF 字段名 (与 schema 对应)
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
                    <div className="flex items-center justify-end space-x-1 text-sm text-gray-500">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={refreshExamples}
                        type="button"
                      >
                        <RefreshCwIcon />
                      </Button>
                      <div className="scrollbar-hide flex max-w-[calc(100%-2rem)] items-center space-x-1 overflow-x-auto">
                        {uiStore.activeTab === "input-based" ? (
                          <>
                            {displayedExamples.map((example, index) => (
                              <span
                                key={`${example.id}-${index}`}
                                className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200"
                                onClick={() =>
                                  fillWithExample(
                                    example.input_based.contentKey
                                  )
                                }
                              >
                                {t(example.input_based.titleKey)}
                              </span>
                            ))}
                          </>
                        ) : (
                          <>
                            {displayedExamples.map((example, index) => (
                              <span
                                key={`${example.id}-${index}`}
                                className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200"
                                onClick={() =>
                                  fillWithExample(
                                    example.extract_key.contentKey
                                  )
                                }
                              >
                                {t(example.extract_key.titleKey)}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {uiStore.activeCard === "promotional-poster" && (
                  <div>
                    <FormField
                      control={form.control}
                      name="promotionalPoster.content"
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
                      name="quoteReference.content"
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
                      name="philosophicalCard.content"
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
                    {uiStore.activeCard === "knowledge-card" && (
                      <FormField
                        control={form.control}
                        name="knowledgeCard.model"
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
                    )}
                    {uiStore.activeCard === "quote-reference" && (
                      <FormField
                        control={form.control}
                        name="quoteReference.model"
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
                    )}
                    {uiStore.activeCard === "philosophical-card" && (
                      <FormField
                        control={form.control}
                        name="philosophicalCard.model"
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
                    )}
                    {uiStore.activeCard === "promotional-poster" && (
                      <FormField
                        control={form.control}
                        name="promotionalPoster.model"
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
                    )}
                  </div>
                </div>
                {uiStore.activeCard === "quote-reference" && (
                  <div>
                    <FormField
                      control={form.control}
                      name="quoteReference.author"
                      render={({ field }) => (
                        <FormItem className="flex w-full items-center justify-between">
                          <FormLabel className="w-full">
                            {t("label.quote_signature")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("toast.author_required")}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quoteReference.cardFont"
                      render={({ field }) => (
                        <FormItem className="flex w-full items-center justify-between">
                          <FormLabel className="w-full">
                            {t("label.card_font")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONTS.map((font) => (
                                  <SelectItem key={font.name} value={font.name}>
                                    {t(font.title)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quoteReference.textPosition"
                      render={({ field }) => (
                        <FormItem className="flex w-full items-center justify-between">
                          <FormLabel className="w-full">
                            {t("label.text_position")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
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
                          name="knowledgeCard.date"
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
                      name="knowledgeCard.qrCode"
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
                      name="philosophicalCard.cardFont"
                      render={({ field }) => (
                        <FormItem className="flex w-full items-center justify-between">
                          <FormLabel className="w-full">
                            {t("label.card_font")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONTS.map((font) => (
                                  <SelectItem key={font.name} value={font.name}>
                                    {t(font.title)}
                                  </SelectItem>
                                ))}
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
                  <StyleContent type="knowledgeCard" />
                )}
                {uiStore.activeCard === "promotional-poster" && (
                  <StyleContent type="promotionalPoster" />
                )}
                {uiStore.activeCard === "quote-reference" && (
                  <StyleContent type="quoteReference" />
                )}
                {uiStore.activeCard === "philosophical-card" && (
                  <StyleContent type="philosophicalCard" />
                )}
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-purple-500 py-6 text-lg hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("button.generate")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LeftPanel;
