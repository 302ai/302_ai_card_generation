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
import React, { useCallback, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAtom } from "jotai";
import { UiStoreActiveTab, uiStoreAtom } from "@/stores/slices/ui_store";

const LeftPanel = () => {
  const [contentType, setContentType] = useState("knowledge-card");
  const [uiStore, setUiStore] = useAtom(uiStoreAtom);

  const [showQrCode, setShowQrCode] = useState(false);
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

  const onActiveTabChange = useCallback((tab: UiStoreActiveTab) => {
    setUiStore((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  return (
    <div>
      <div className="space-y-4">
        {/* Dropdown */}
        <div>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-full py-3 text-lg">
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
          <div className="flex items-center space-x-2">
            <Tabs
              value={uiStore.activeTab}
              onValueChange={onActiveTabChange}
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
                  {uiStore.activeTab === "input-based" ? (
                    <>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                        知识分享
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                        学习笔记
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                        思维导图
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                        名人名言
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                        经典语录
                      </span>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => console.log("Refresh examples")}
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
                </div>
              </div>

              <TabsContent value="input-based" className="mt-4 space-y-4">
                <Textarea
                  placeholder="请输入您想要的内容..."
                  className="min-h-[200px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">模型选择</span>
                    <Select defaultValue="default">
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">默认</SelectItem>
                        <SelectItem value="creative">创意</SelectItem>
                        <SelectItem value="professional">专业</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    生成
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="extract-key" className="mt-4 space-y-4">
                <Textarea
                  placeholder="请输入文章，我们将提取金句..."
                  className="min-h-[200px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">模型选择</span>
                    <Select defaultValue="default">
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">默认</SelectItem>
                        <SelectItem value="creative">创意</SelectItem>
                        <SelectItem value="professional">专业</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    提取
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Additional Controls */}
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">模型选择</span>
            <Button variant="outline" size="sm" className="h-8">
              下载框
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm">日期显示</span>
              <div className="relative inline-block w-10 select-none align-middle">
                <input
                  type="checkbox"
                  name="toggle"
                  id="toggle"
                  className="peer sr-only"
                />
                <label
                  htmlFor="toggle"
                  className="block h-6 w-11 cursor-pointer rounded-full bg-gray-200 peer-checked:bg-purple-500"
                >
                  <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 peer-checked:left-6"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">二维码</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowQrCode(!showQrCode)}
            >
              下载框
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">页格设置</span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 bg-purple-500 px-3 text-white hover:bg-purple-600"
              >
                随机
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3">
                样板
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-3">
                自定义
              </Button>
            </div>
          </div>

          <Button className="w-full bg-purple-500 py-6 text-lg hover:bg-purple-600">
            生成
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
