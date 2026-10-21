export type FeedLang = "en" | "ja";
export type ReadingCategory = "news" | "magazine";
export type ListeningCategory = "podcast" | "speech" | "learning";

export interface FeedSource {
  id: string;
  name: string;
  description: string;
  url: string;
  lang: FeedLang;
  category: ReadingCategory | ListeningCategory;
  siteUrl: string;
}

export const readingFeeds: FeedSource[] = [
  {
    id: "bbc-world",
    name: "BBC World News",
    description: "BBC 国际新闻，适合精读与积累时事表达",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    lang: "en",
    category: "news",
    siteUrl: "https://www.bbc.com/news/world",
  },
  {
    id: "guardian-world",
    name: "The Guardian World",
    description: "卫报国际新闻，长句与观点表达丰富",
    url: "https://www.theguardian.com/world/rss",
    lang: "en",
    category: "news",
    siteUrl: "https://www.theguardian.com/world",
  },
  {
    id: "guardian-long-read",
    name: "The Guardian Long Read",
    description: "卫报长读，深度报道与叙事写作",
    url: "https://www.theguardian.com/news/series/the-long-read/rss",
    lang: "en",
    category: "magazine",
    siteUrl: "https://www.theguardian.com/news/series/the-long-read",
  },
  {
    id: "japan-times",
    name: "The Japan Times",
    description: "日本英文媒体，适合用英语了解日本",
    url: "https://www.japantimes.co.jp/feed/",
    lang: "en",
    category: "news",
    siteUrl: "https://www.japantimes.co.jp/",
  },
  {
    id: "nhk-news",
    name: "NHK 新闻",
    description: "NHK 日语新闻，练习日语阅读与新闻词汇",
    url: "https://www.nhk.or.jp/rss/news/cat0.xml",
    lang: "ja",
    category: "news",
    siteUrl: "https://www3.nhk.or.jp/news/",
  },
];

export const listeningFeeds: FeedSource[] = [
  {
    id: "bbc-global-news",
    name: "BBC Global News Podcast",
    description: "BBC 全球新闻播客，每天两期，语速自然",
    url: "https://podcasts.files.bbci.co.uk/p02nq0gn.rss",
    lang: "en",
    category: "podcast",
    siteUrl: "https://www.bbc.co.uk/programmes/p02nq0gn",
  },
  {
    id: "bbc-6min-english",
    name: "BBC 6 Minute English",
    description: "六分钟英语，适合中高级听力训练",
    url: "https://podcasts.files.bbci.co.uk/p02pc9tn.rss",
    lang: "en",
    category: "learning",
    siteUrl:
      "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english",
  },
  {
    id: "bbc-learning-english-conversations",
    name: "BBC Learning English Conversations",
    description: "日常英语对话与地道表达，适合通勤泛听",
    url: "https://podcasts.files.bbci.co.uk/p02pc9zn.rss",
    lang: "en",
    category: "learning",
    siteUrl:
      "https://www.bbc.co.uk/learningenglish/english/features/the-english-we-speak",
  },
];

export interface SpeechItem {
  id: string;
  title: string;
  speaker: string;
  year: number;
  description: string;
  audioUrl: string;
  sourceUrl: string;
  lang: FeedLang;
}

/** 公共领域演讲（美国政府作品），音频托管在本站 public/audio */
export const speeches: SpeechItem[] = [
  {
    id: "jfk-inaugural",
    title: "Inaugural Address",
    speaker: "John F. Kennedy",
    year: 1961,
    description:
      "肯尼迪就职演说：Ask not what your country can do for you — ask what you can do for your country.",
    audioUrl: "/audio/jfk-inaugural.ogg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:JFK_inaugural_address.ogg",
    lang: "en",
  },
  {
    id: "fdr-fireside-1",
    title: "First Fireside Chat: On the Banking Crisis",
    speaker: "Franklin D. Roosevelt",
    year: 1933,
    description:
      "罗斯福第一次炉边谈话：用平实语言向公众解释银行危机，适合练习听懂解释性表达。",
    audioUrl: "/audio/fdr-fireside-1.ogg",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Fireside_Chat_1_On_the_Banking_Crisis_(March_12,_1933)_Franklin_Delano_Roosevelt.ogg",
    lang: "en",
  },
];
