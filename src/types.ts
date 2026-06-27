export type ColumnSplit = "1" | "1-1" | "1-2" | "2-1" | "1-1-1";

export type BlockType = "headline" | "article" | "image" | "divider" | "ad";

export interface HeadlineBlock {
  id: string;
  type: "headline";
  text: string;
  subtitle: string;
  font: string;
  size: "normal" | "large" | "epic";
  align?: "left" | "center" | "right" | "justify";
  subtitleFont?: string;
  subtitleFontSize?: "xs" | "sm" | "md" | "lg";
  subtitleAlign?: "left" | "center" | "right" | "justify";
}

export interface ArticleBlock {
  id: string;
  type: "article";
  title: string;
  subtitle: string;
  author: string;
  publishOffice?: string; // 署名单位 (如：圣塞西尔记录署印)
  paragraphs: string[];
  dropCap: boolean;
  fontSize: "xs" | "sm" | "md" | "lg";
  font: string;
  align: "left" | "justify" | "center";
  titleFont?: string;
  titleFontSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleAlign?: "left" | "center" | "right" | "justify";
  subtitleFont?: string;
  subtitleFontSize?: "xs" | "sm" | "md" | "lg";
  subtitleAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: "tight" | "normal" | "relaxed" | "loose";
  letterSpacing?: "tight" | "normal" | "wide" | "widest";
}

export interface ImageBlock {
  id: string;
  type: "image";
  src: string; // File base64 or custom URL
  filter: "woodblock" | "none" | "sepia" | "high-contrast";
  caption: string;
  isClipart: boolean;
  clipartId?: string;
  scale: number; // Percentage scale
  aspectRatio?: "auto" | "16-9" | "4-3" | "1-1";
  objectFit?: "cover" | "contain" | "fill";
}

export interface DividerBlock {
  id: string;
  type: "divider";
  style: "double" | "single" | "ornament" | "dotted";
  ornamentType?: "fleur-de-lis" | "floral" | "star" | "sword";
}

export interface AdBlock {
  id: string;
  type: "ad";
  title: string;
  content: string;
  price: string;
  merchant: string;
  borderStyle: "dashed" | "solid" | "ornate";
  titleFont?: string;
  titleFontSize?: "xs" | "sm" | "md" | "lg";
  titleAlign?: "left" | "center" | "right" | "justify";
  contentFont?: string;
  contentFontSize?: "xs" | "sm" | "md" | "lg";
  contentAlign?: "left" | "center" | "right" | "justify";
}

export type Block = HeadlineBlock | ArticleBlock | ImageBlock | DividerBlock | AdBlock;

export interface Column {
  id: string;
  blocks: Block[];
}

export interface Row {
  id: string;
  split: ColumnSplit; // '1' (full), '1-1' (even halves), '1-2' (left small, right wide), '2-1' (left wide, right small), '1-1-1' (three thirds)
  columns: Column[]; // array of columns corresponding to the split
}

export interface NewspaperHeader {
  title: string;
  subtitle: string; // The top motto, e.g., "Morning Issue - The truth shall enlighten the Realm"
  issueNo: string;
  location: string;
  date: string;
  price: string;
  titleFont: string;
  headerStyle: "classic" | "royal" | "minimal";
  royalTitle?: string; // 皇家御览副标题文本
  footerLeft?: string; // 页脚左侧发行单位
  footerRight?: string; // 页脚右侧版权标识
}

export interface NewspaperData {
  header: NewspaperHeader;
  rows: Row[];
}

export interface ClipartItem {
  id: string;
  name: string;
  category: string;
  svgPath: string; // SVG paths or full SVG content
}
