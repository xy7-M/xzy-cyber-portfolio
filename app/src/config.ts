// ============================================================
// Site Configuration — 熊昭轶 / 梦逍遥 赛博档案
// 造物 · 求索 · 无限进步
// ============================================================

export interface SiteConfig {
  language: string;
  brandName: string;
}

export const siteConfig: SiteConfig = {
  language: "zh-CN",
  brandName: "梦逍遥 / 熊昭轶",
};

// ============================================================
// Navigation
// ============================================================

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  links: NavLink[];
  ctaText: string;
}

export const navigationConfig: NavigationConfig = {
  links: [
    { label: "能力", href: "#curriculum" },
    { label: "志向", href: "#cinematic" },
    { label: "档案", href: "#alumni" },
    { label: "联系", href: "#footer" },
  ],
  ctaText: "造物 · 求索 · 无限进步",
};

// ============================================================
// Hero
// ============================================================

export interface HeroInfoLine {
  label: string;
  text: string;
}

export interface HeroConfig {
  title: string;
  nickname: string;
  infoLines: HeroInfoLine[];
  ctaText: string;
}

export const heroConfig: HeroConfig = {
  title: "熊昭轶",
  nickname: "梦逍遥",
  infoLines: [
    { label: "EDU", text: "云南大学 · 本科在读" },
    { label: "MOTTO", text: "造物，求索，无限进步" },
    { label: "HOBBY", text: "看书 · 研究 AI" },
  ],
  ctaText: "读取征途",
};

// ============================================================
// Capabilities (Curriculum section)
// ============================================================

export interface CapabilityItem {
  title: string;
  slug: string;
  description: string;
  image: string;
}

export interface CapabilitiesConfig {
  sectionLabel: string;
  items: CapabilityItem[];
}

export const capabilitiesConfig: CapabilitiesConfig = {
  sectionLabel: "能力系统 / SYSTEM",
  items: [
    {
      title: "Agent 驾驶员",
      slug: "agent-driver",
      description:
        "熟练使用 WorkBuddy、Trae、Codex 等 AI Agent，把人工智能变成自己的造物流水线，也让复杂工作可以并行推进。",
      image: "images/capability-1.jpg",
    },
    {
      title: "UI 图设计",
      slug: "ui-design",
      description:
        "掌握 UI 图设计，从视觉稿、信息层级到可落地界面完整覆盖，让产品在第一眼就有清晰表达。",
      image: "images/capability-2.jpg",
    },
    {
      title: "全栈网站",
      slug: "fullstack",
      description:
        "打造全栈网站，前端界面、后端逻辑、数据存储独立交付，完成从想法到上线的完整闭环。",
      image: "images/capability-3.jpg",
    },
    {
      title: "本地交付",
      slug: "local-shipping",
      description:
        "掌握电脑 exe 文件下载与打包交付，把工具做成用户可安装、开箱即用的本地应用。",
      image: "images/capability-4.jpg",
    },
  ],
};

// ============================================================
// Capability Detail (sub-pages)
// ============================================================

export interface CapabilityDetailData {
  title: string;
  subtitle: string;
  paragraphs: string[];
}

export interface CapabilityDetailConfig {
  sectionLabel: string;
  backLinkText: string;
  prevLabel: string;
  nextLabel: string;
  notFoundText: string;
  capabilities: Record<string, CapabilityDetailData>;
}

export const capabilityDetailConfig: CapabilityDetailConfig = {
  sectionLabel: "能力档案 / CAPABILITY",
  backLinkText: "返回首页",
  prevLabel: "上一篇",
  nextLabel: "下一篇",
  notFoundText: "没有找到这个能力域。",
  capabilities: {
    "agent-driver": {
      title: "Agent 驾驶员",
      subtitle: "让 AI 从工具变成外骨骼。",
      paragraphs: [
        "高升大的暑假开始，我深入探索 AI，系统学习并熟练使用 WorkBuddy、Trae、Codex 等 Agent。它们不是简单的生成器，而是可以理解上下文、执行任务、迭代交付的造物伙伴。",
        "我把 Agent 用成了造物流水线：规划目标、拆解步骤、生成代码、检查结果、反复迭代。一个人也能同时推进设计、开发与文档整理，让非计算机专业学生拥有接近专业团队的执行力。",
        "我的目标不是成为参数调优的工程师，而是成为最会使用 AI 的人。工具在谁手里不重要，重要的是谁能把它变成可交付的作品。",
      ],
    },
    "ui-design": {
      title: "UI 图设计",
      subtitle: "先画清楚，再做出来。",
      paragraphs: [
        "我掌握 UI 图设计，从视觉稿开始就把信息层级、交互路径和品牌气质想清楚，再让界面按照设计稿落地。设计不是装饰，而是产品能否被快速理解的骨架。",
        "从赛博 HUD、纸墨手账到功能型后台，我会根据产品属性选择匹配的视觉语言。图标、配色、排版、状态反馈，每一层都服务于真实使用场景。",
        "设计能力让我的项目不只能跑，而且好看、好用、可交付。这是造物链路里我最在意的一环：第一印象也是产品的一部分。",
      ],
    },
    "fullstack": {
      title: "全栈网站",
      subtitle: "从零到上线的完整闭环。",
      paragraphs: [
        "我已独立打造过多个全栈网站项目，包括乔布斯艺术、To-Do List 待办清单、全英视频的摘录等。每一个都是从需求、设计、开发到部署的完整闭环。",
        "前端负责体验，后端负责逻辑，数据负责记录。我会根据项目规模选型，让网站轻量、可维护、能持续迭代，而不是堆砌重型开发框架。",
        "在 GitHub 上持续发布项目，意味着我对自己的作品负责：代码可以被看见、被复用、被改进。造物的终点不是上线，而是持续的版本进化。",
      ],
    },
    "local-shipping": {
      title: "本地交付",
      subtitle: "把工具做成开箱即用。",
      paragraphs: [
        "我掌握电脑 exe 文件的下载与打包交付，能把完成品做成用户不需要折腾环境、双击即可使用的本地应用。",
        "本地交付是造物链路的最后一公里：不是跑得起来就算完成，而是别人也能轻易拿到、安装和使用。",
        "我始终偏好开箱即用的交付方案，而不是把一堆源码和依赖丢给用户。真正的好工具，应该像产品一样被交付。",
      ],
    },
  },
};

// ============================================================
// Architecture (CinematicVision section)
// ============================================================

export interface ArchitectureConfig {
  sectionLabel: string;
  videoPath: string;
  title: string;
  description: string;
}

export const architectureConfig: ArchitectureConfig = {
  sectionLabel: "志向 / GOAL",
  videoPath: "videos/cinematic-vision.mp4",
  title: "非计算机专业 × AI 深度探索。",
  description:
    "高中一年，我从全班倒数第 10 进步到全班第二、年级前三十；拥有数学竞赛经历，高考物理 95+。高升大的暑假，我深入探索 AI，熟练使用 WorkBuddy、Trae、Codex 等 Agent，并在 GitHub 发布多个项目。造物，求索，无限进步——这不是口号，而是我每天运行的操作系统。",
};

// ============================================================
// Research (AlumniArchives section)
// ============================================================

export interface ResearchProject {
  title: string;
  year: string;
  discipline: string;
  image: string;
}

export interface ResearchConfig {
  sectionLabel: string;
  projects: ResearchProject[];
}

export const researchConfig: ResearchConfig = {
  sectionLabel: "项目档案 / ARCHIVES",
  projects: [
    {
      title: "乔布斯艺术",
      year: "2026",
      discipline: "GitHub · 创作系统",
      image: "images/research-1.jpg",
    },
    {
      title: "To-Do List 待办清单",
      year: "2026",
      discipline: "GitHub · 效率工具",
      image: "images/research-2.jpg",
    },
    {
      title: "全英视频的摘录",
      year: "2026",
      discipline: "GitHub · 信息提炼",
      image: "images/research-3.jpg",
    },
    {
      title: "高考物理 95+",
      year: "2025",
      discipline: "物理成绩",
      image: "images/research-4.jpg",
    },
    {
      title: "全班第二 · 年级前三十",
      year: "2025",
      discipline: "一年学习跃迁",
      image: "images/research-1.jpg",
    },
    {
      title: "数学竞赛经历",
      year: "2024",
      discipline: "学科竞赛",
      image: "images/research-2.jpg",
    },
    {
      title: "AI Agent 深度探索",
      year: "2025",
      discipline: "WorkBuddy / Trae / Codex",
      image: "images/research-3.jpg",
    },
    {
      title: "云南大学本科在读",
      year: "2025",
      discipline: "高校 · 在读",
      image: "images/research-4.jpg",
    },
  ],
};

// ============================================================
// Footer
// ============================================================

export interface FooterLinkColumn {
  title: string;
  links: string[];
}

export interface FooterBottomLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  heading: string;
  columns: FooterLinkColumn[];
  copyright: string;
  bottomLinks: FooterBottomLink[];
}

export const footerConfig: FooterConfig = {
  heading: "造物，求索，无限进步。",
  columns: [
    {
      title: "导航",
      links: ["身份", "征途", "能力系统", "项目档案"],
    },
    {
      title: "联系",
      links: ["GitHub · xy7-M", "云南大学 · 本科在读", "非计算机专业 × AI"],
    },
  ],
  copyright: "© 2026 熊昭轶 · 梦逍遥. All rights reserved.",
  bottomLinks: [
    { label: "回到顶部", href: "#hero" },
    { label: "能力域", href: "#curriculum" },
    { label: "项目档案", href: "#alumni" },
  ],
};

// ============================================================
// Personal Card (个人博客 · 3D 物理工牌)
// ============================================================

export interface PersonalCardConfig {
  sectionLabel: string;
  title: string;
  paragraphs: string[];
  hint: string;
  fallbackText: string;
}

export const personalCardConfig: PersonalCardConfig = {
  sectionLabel: "个人博客 / PROFILE",
  title: "我是谁，交给这张工牌。",
  paragraphs: [
    "熊昭轶，网名梦逍遥。云南大学本科在读，非计算机专业，却把 AI 用成了自己的外骨骼。",
    "右侧这张工牌是一个真实的 3D 物理对象：挂绳由多段刚体串联并带阻尼，拖动它会晃动，松手会自然回弹。",
    "造物，求索，无限进步——这不是口号，是我每天运行的操作系统。",
  ],
  hint: "按住工牌拖动 · 松手自然回弹",
  fallbackText: "正在装配 3D 工牌…",
};
