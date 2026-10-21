/** 国内可直连的 Bing 搜索链接 */
export function bingSearchUrl(query: string): string {
  return `https://cn.bing.com/search?q=${encodeURIComponent(query)}`;
}

export function bingTranslateUrl(text: string, from: "en" | "ja"): string {
  return `https://cn.bing.com/translator?text=${encodeURIComponent(
    text
  )}&from=${from}&to=zh-Hans`;
}
