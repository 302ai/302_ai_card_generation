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

const formSchema = z.object({
  "knowledge-card": z.object({
    model: z.string(),
    content: z.string().optional(),
    // 添加一个新字段用于 "提取金句" 的 textarea
    extractKeyContent: z.string().optional(),
    date: z.string().optional(),
    qrCode: z.string().optional(),
    style: z.string().optional(),
  }),
  "promotional-poster": z.object({
    model: z.string(),
    content: z.string().optional(),
    style: z.string(),
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

  const historyItems = [
    {
      id: 1,
      type: "知识卡片",
      content: "人工智能的发展历程",
      date: "2023-05-15",
    },
    { id: 2, type: "宣传海报", content: "春季新品发布会", date: "2023-05-14" },
    { id: 3, type: "哲理卡片", content: "坚持的力量", date: "2023-05-13" },
    { id: 4, type: "语录引用", content: "生活中的小确幸", date: "2023-05-12" },
    { id: 5, type: "知识卡片", content: "量子计算基础", date: "2023-05-11" },
    { id: 6, type: "宣传海报", content: "夏日促销活动", date: "2023-05-10" },
    { id: 7, type: "哲理卡片", content: "成长的烦恼", date: "2023-05-09" },
  ];
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (uiStore.activeCard === "knowledge-card") {
      const historyId = crypto.randomUUID();
      const {
        "knowledge-card": knowledgeCard,
        "promotional-poster": promotionalPoster,
      } = values;
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
          model: knowledgeCard.model,
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
          model: promotionalPoster.model,
          lang: "cn",
          content: promotionalPoster.content as string,
          style: formStore.style,
        });
        await addPosterHistory({
          svg: res.stringSVG,
          status: "success",
        });
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
                  <SelectItem value="knowledge-card">知识卡片</SelectItem>
                  <SelectItem value="promotional-poster">宣传海报</SelectItem>
                  <SelectItem value="philosophical-card">哲理卡片</SelectItem>
                  <SelectItem value="quote-reference">语录引用</SelectItem>
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
                          基于输入
                        </TabsTrigger>
                        <TabsTrigger
                          value="extract-key"
                          className="px-3 py-1.5 text-sm"
                        >
                          提取金句
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={refreshExamples}
                          title="刷新示例"
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
                                placeholder="请输入主题词或文章，AI基于输入生成卡片..."
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
                                placeholder="请输入主题词或文章，AI提取金句创建..."
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
                            placeholder="请输入宣传海报内容..."
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
                        <FormLabel>模型选择</FormLabel>
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

              {uiStore.activeCard === "knowledge-card" && (
                <>
                  <div className="flex">
                    <div className="flex w-full items-center justify-between">
                      <FormField
                        control={form.control}
                        name="knowledge-card.date"
                        render={({ field }) => (
                          <FormItem className="flex w-full items-center justify-between">
                            <FormLabel>日期显示</FormLabel>
                            <FormControl>
                              <DateSwitch field={field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">二维码</span>
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
              <div className="flex items-center">
                <span className="flex-1">风格设置</span>
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
            </div>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-purple-500 py-6 text-lg hover:bg-purple-600"
        >
          生成
        </Button>
      </form>
    </Form>
  );
};

export default LeftPanel;
