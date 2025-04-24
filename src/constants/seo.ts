export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "AI 卡片生成",
      description: "使用AI生成多种类型卡片",
      image: "/images/global/desc_zh.png",
    },
    en: {
      title: "AI Card Generation",
      description: "Using AI to generate multiple types of cards",
      image: "/images/global/desc_en.png",
    },
    ja: {
      title: "AIカード生成",
      description: "AIを用いた複数種類のカードの生成",
      image: "/images/global/desc_ja.png",
    },
  },
};
