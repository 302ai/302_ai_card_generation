import { useAtom } from "jotai";
import React, { useState } from "react";
import { historyStoreAtom } from "@/stores/slices/history_store";

const RightPanel = () => {
  const [historyStore] = useAtom(historyStoreAtom);
  // htmlContent 是从LLM获取的完整HTML字符串

  // 可以添加状态来控制放大预览
  const [isEnlarged, setIsEnlarged] = useState(false);

  const handlePreviewClick = () => {
    setIsEnlarged(true);
    // 这里可以实现放大预览的逻辑，比如使用 Modal 组件
    console.log("Preview clicked, implement enlargement logic here.");
    // 例如，可以在一个 Modal 中再次渲染这个 iframe，或者仅用 CSS 放大
  };

  // 缩小预览区域的样式 (可以根据需要调整)
  const previewStyle = {
    width: "200px", // 预览区域宽度
    height: "300px", // 预览区域高度
    border: "1px solid #ccc",
    overflow: "hidden", // 隐藏滚动条
    cursor: "pointer",
    transform: "scale(0.5)", // 缩小显示内容，调整比例以适应预览区大小
    transformOrigin: "top left", // 保证从左上角开始缩放
  };

  // iframe 的样式，需要让它充满其容器，但内容按原尺寸渲染，然后通过容器缩放
  const iframeStyle = {
    width: "400px", // 应该与LLM生成卡片的原始宽度一致 (或者稍大以避免内部滚动条)
    height: "600px", // 应该与LLM生成卡片的原始高度大致匹配 (需要估算或调整)
    border: "none", // 移除iframe默认边框
    transform: `scale(${previewStyle.width / 400})`, // 计算缩放比例
    transformOrigin: "top left",
    // 或者更简单的方式，直接让iframe 100% 宽高，让容器去缩放
    // width: '100%',
    // height: '100%',
  };

  // 如果你想让 iframe 适应容器并保持比例缩放 (更现代的方法)
  // 容器样式
  const previewContainerStyle = {
    width: "200px", // 目标预览宽度
    height: "300px", // 目标预览高度
    border: "1px solid #ccc",
    overflow: "hidden",
    cursor: "pointer",
    position: "relative", // 为了绝对定位子元素 (如果需要)
  };

  // Iframe 样式 (使用 viewport 单位或者绝对定位来强制比例)
  // 假设原始卡片大致是 400x600 比例 (2:3)
  const responsiveIframeStyle = {
    border: "none",
    position: "absolute",
    top: 0,
    left: 0,
    width: "400px", // 设置为原始宽度
    height: "600px", // 设置为原始高度 (估算值)
    transform: `scale(${200 / 400})`, // 计算缩放比例 (目标宽度/原始宽度)
    transformOrigin: "top left",
  };

  console.log(historyStore);
  return (
    <div style={previewContainerStyle}>
      <iframe
        srcDoc={historyStore.htmls[0]}
        title="AI Card Preview"
        style={responsiveIframeStyle}
        // sandbox 属性可以增加安全性，但可能禁用某些功能 (如下载、表单提交等)
        // sandbox="allow-scripts allow-same-origin" // 允许脚本和同源请求，根据需要调整
        scrolling="no" // 尝试禁止滚动条，但内容溢出时可能仍会出现
      />
    </div>
  );

  {
    /* 放大预览的 Modal 或其他逻辑 */
  }
  {
    /* {isEnlarged && <EnlargedPreviewModal htmlContent={htmlContent} onClose={() => setIsEnlarged(false)} />} */
  }
};

export default RightPanel;
