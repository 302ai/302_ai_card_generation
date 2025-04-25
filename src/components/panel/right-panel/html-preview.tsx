import { useEffect, useState } from "react";

interface HtmlPreviewProps {
  html: string;
  children: React.ReactNode;
  title: string;
}

// 添加自定义动画的CSS
const customAnimationStyles = `
.modal-overlay {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.modal-overlay.show {
  opacity: 1;
}
.modal-content {
  transform: scale(0.9);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.modal-content.show {
  transform: scale(1);
  opacity: 1;
}

/* Style for the *iframe's* internal scrollbar if needed (optional) */
.iframe-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.iframe-scrollbar::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}
.iframe-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

/* Style for the *modal body* scrollbar */
.modal-body-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.modal-body-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.modal-body-scrollbar::-webkit-scrollbar-thumb {
  background-color: #a0aec0;
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.modal-body-scrollbar {
   scrollbar-width: thin;
   scrollbar-color: #a0aec0 transparent;
}

  /* 隐藏iframe滚动条 */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
const HtmlPreview = ({ html, children, title }: HtmlPreviewProps) => {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalShow, setModalShow] = useState(false);
  // 修改HTML内容以确保正确渲染，只显示顶部内容
  const optimizeHtmlForPreview = (html: string): string => {
    // 添加CSS以确保内容正确缩放，只显示顶部内容，并隐藏滚动条
    return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
              body { display: block; position: relative; }
              .content-container { width: 400px; max-height: 100%; overflow: hidden; mask-image: linear-gradient(to bottom, black 50%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%); transform-origin: top center; transform: scale(calc(100% / 400 * 100%)); }
              * { box-sizing: border-box; }
              img, svg { max-width: 100%; height: auto; }
              ::-webkit-scrollbar { display: none; width: 0 !important; height: 0 !important; }
              * { scrollbar-width: none; -ms-overflow-style: none; }
            </style>
          </head>
          <body>
            <div class="content-container">
              ${html}
            </div>
          </body>
        </html>
      `;
  };

  // 处理卡片点击
  const handlePreviewClick = (htmlContent: string, index?: number) => {
    setSelectedHtml(htmlContent);
    if (index !== undefined) setSelectedIndex(index);
    setIsEnlarged(true);

    // 延迟显示动画效果
    setTimeout(() => {
      setModalShow(true);
    }, 50);
  };

  // 处理关闭弹窗
  const handleCloseModal = () => {
    setModalShow(false);

    // 动画结束后才真正关闭弹窗
    setTimeout(() => {
      setIsEnlarged(false);
      setSelectedHtml(null);
      setSelectedIndex(null);
    }, 300);
  };

  // 监听ESC键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEnlarged) {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnlarged]);

  // 为完整预览优化的HTML
  const optimizeHtmlForFullPreview = (html: string): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html { scroll-behavior: smooth; }
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100%;
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              box-sizing: border-box;
            }
            .content-container {
              width: 400px;
              max-width: 100%;
              margin: 0 auto;
              padding: 12px;
              box-sizing: border-box;
            }
            * { box-sizing: border-box; }
            img, svg { max-width: 100%; height: auto; display: block; }
            
            body::-webkit-scrollbar { width: 6px; }
            body::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }
            body { scrollbar-width: thin; scrollbar-color: #ccc transparent; }
          </style>
        </head>
        <body class="iframe-scrollbar">
          <div class="content-container">
            ${html}
          </div>
        </body>
      </html>
    `;
  };
  const optimizedHtml = optimizeHtmlForPreview(html);

  return (
    <>
      <style>{customAnimationStyles}</style>
      <div
        className="flex aspect-[2/3] w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
        onClick={() => handlePreviewClick(html)}
      >
        <iframe
          className="pointer-events-none block w-full flex-1 border-0"
          srcDoc={optimizedHtml}
          title={title}
          scrolling="no"
          sandbox="allow-scripts allow-same-origin"
        />
        {children}
      </div>
      {/* 放大预览的 Modal */}
      {isEnlarged && selectedHtml && (
        <div
          className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 ${
            modalShow ? "show" : ""
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`modal-content relative flex w-full flex-col rounded-lg bg-white shadow-xl ${
              modalShow ? "show" : ""
            } h-[90vh] max-w-4xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal 标题栏 */}
            <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-base font-semibold text-gray-700">
                  {selectedIndex !== null
                    ? `知识卡片预览 #${selectedIndex + 1}`
                    : title || "知识卡片预览"}
                </h3>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none"
                  onClick={handleCloseModal}
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 完整预览内容 - 添加滚动区域 */}
            <div className="modal-body-scrollbar flex-grow overflow-y-auto">
              <iframe
                className="block h-full w-full border-0"
                srcDoc={optimizeHtmlForFullPreview(selectedHtml)}
                title="Enlarged Knowledge Card Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HtmlPreview;
