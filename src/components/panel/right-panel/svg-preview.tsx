import { useEffect, useState } from "react";

interface SvgPreviewProps {
  svg: string;
  children?: React.ReactNode;
  title?: string;
}

// Utility function to extract SVG content from various formats
const extractSvgContent = (content: string): string => {
  try {
    let svgContent = "";

    // Check if it's already a valid SVG
    if (content.trim().startsWith("<svg") && content.includes("</svg>")) {
      svgContent = content;
    }
    // Check if SVG is wrapped in markdown code blocks
    else if (content.includes("```")) {
      const cleaned = content
        .replace(/```+svg/g, "")
        .replace(/```+/g, "")
        .trim();

      if (cleaned.startsWith("<svg") && cleaned.includes("</svg>")) {
        svgContent = cleaned;
      }
    }
    // Check if content starts with "svg" followed by actual SVG content
    else if (content.trim().startsWith("svg") && content.includes("<svg")) {
      svgContent = content.trim().substring(3).trim();
    }
    // Try to extract SVG from JSON
    else {
      try {
        if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
          const parsed = JSON.parse(content);
          if (typeof parsed === "string" && parsed.includes("<svg")) {
            svgContent = parsed;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }

      // Find any SVG content in the string if not found yet
      if (!svgContent) {
        const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/);
        if (svgMatch) {
          svgContent = svgMatch[0];
        } else {
          svgContent = content;
        }
      }
    }

    // Ensure SVG has proper viewport attributes for poster dimensions
    if (svgContent.includes("<svg")) {
      // Check if SVG already has viewBox
      if (!svgContent.includes("viewBox=")) {
        // Add viewBox if missing with poster dimensions (A3 ratio: 800x1120)
        svgContent = svgContent.replace(/<svg/, '<svg viewBox="0 0 800 1120"');
      }

      // Make sure SVG has width and height attributes for proper scaling
      if (!svgContent.includes("width=")) {
        svgContent = svgContent.replace(/<svg/, '<svg width="100%"');
      } else {
        // Replace any fixed width with 100%
        svgContent = svgContent.replace(/width="[^"]*"/, 'width="100%"');
      }

      if (!svgContent.includes("height=")) {
        svgContent = svgContent.replace(/<svg/, '<svg height="100%"');
      } else {
        // Replace any fixed height with 100%
        svgContent = svgContent.replace(/height="[^"]*"/, 'height="100%"');
      }

      // Add preserveAspectRatio attribute if not present to maintain poster ratio
      if (!svgContent.includes("preserveAspectRatio=")) {
        svgContent = svgContent.replace(
          /<svg/,
          '<svg preserveAspectRatio="xMidYMid meet"'
        );
      }
    }

    return svgContent;
  } catch (error) {
    console.error("Error extracting SVG content:", error);
    return content;
  }
};

// 为预览卡片优化SVG
const optimizeSvgForPreview = (svgContent: string, title: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;
};

// 为放大预览优化SVG
const optimizeSvgForFullPreview = (
  svgContent: string,
  title: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          .svg-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          svg {
            max-width: 100%;
            max-height: 90vh;
            width: auto;
            height: auto;
            display: block;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="svg-container">
          ${svgContent}
        </div>
      </body>
    </html>
  `;
};

// 添加自定义动画的CSS
const customAnimationStyles = `
  /* Modal 动画 */
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
  
  /* SVG 样式 */
  .svg-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    background-color: white;
    overflow: hidden;
    aspect-ratio: 800 / 1120; /* Poster aspect ratio (A3-like) */
  }

  .svg-preview-card {
    position: relative;
  }
`;

const SvgPreview = ({
  svg,
  children,
  title = "SVG Preview",
}: SvgPreviewProps) => {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [modalShow, setModalShow] = useState(false);

  // Extract SVG content from input
  const svgContent = extractSvgContent(svg);
  const previewHtml = optimizeSvgForPreview(svgContent, title);
  const fullPreviewHtml = optimizeSvgForFullPreview(svgContent, title);

  // 处理卡片点击
  const handlePreviewClick = () => {
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

  // 防止iframe捕获点击事件
  const divClickHandler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePreviewClick();
  };

  return (
    <>
      <style>{customAnimationStyles}</style>

      <div
        className="svg-preview-card flex aspect-[2/3] w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
        onClick={divClickHandler}
      >
        <div className="svg-container flex w-full flex-1 items-center justify-center p-2">
          <iframe
            title={`SVG Preview: ${title}`}
            className="pointer-events-none h-full w-full border-0"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            scrolling="no"
          />
        </div>
        {children}
      </div>

      {/* 放大预览的 Modal */}
      {isEnlarged && (
        <div
          className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 ${
            modalShow ? "show" : ""
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`modal-content relative flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl ${
              modalShow ? "show" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal 标题栏 */}
            <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-base font-semibold text-gray-700">
                  {title}
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

            {/* SVG 完整预览 */}
            <div className="flex-grow overflow-auto">
              <iframe
                title={`SVG Full Preview: ${title}`}
                className="h-full w-full border-0"
                srcDoc={fullPreviewHtml}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SvgPreview;
