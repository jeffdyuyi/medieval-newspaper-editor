export type ColumnSplit = "1" | "1-1" | "1-2" | "2-1" | "1-1-1";

export type BlockType = 
  | "headline" 
  | "article" 
  | "image" 
  | "divider" 
  | "ad"
  | "bounty"
  | "briefs"
  | "table"
  | "seal"
  | "letter"
  | "obituary";

export type NewspaperTheme = "fantasy" | "republican";

export type PaperTone = "default" | "aged" | "antique" | "bright";

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
  // Republican theme extras
  titleMarker?: "none" | "square" | "triangle" | "circle";
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
  // Republican theme extras
  titleMarker?: "none" | "square" | "triangle" | "circle";
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
  style: "double" | "single" | "ornament" | "dotted" | "wenwu" | "yunwen";
  ornamentType?: "fleur-de-lis" | "floral" | "star" | "sword" | "diamond";
}

export interface AdBlock {
  id: string;
  type: "ad";
  title: string;
  content: string;
  price: string;
  merchant: string;
  borderStyle: "dashed" | "solid" | "ornate" | "wenwu" | "yunwen";
  titleFont?: string;
  titleFontSize?: "xs" | "sm" | "md" | "lg";
  titleAlign?: "left" | "center" | "right" | "justify";
  contentFont?: string;
  contentFontSize?: "xs" | "sm" | "md" | "lg";
  contentAlign?: "left" | "center" | "right" | "justify";
}

export interface BountyBlock {
  id: string;
  type: "bounty";
  headerText: string; // e.g. "✦ 懸賞通緝 ✦" or "WANTED"
  bountyAmount: string; // e.g. "賞金：5,000 金幣 · 生死不論"
  targetName: string; // e.g. "暗夜刺客·維克托"
  crimeDetails: string; // 罪名或案由
  issuedBy: string; // 簽發公署 / 治安判事署
  avatarType?: "clipart" | "image";
  avatarSrc?: string;
  clipartId?: string;
  borderStyle?: "wood" | "metal" | "dashed" | "wenwu";
  avatarSize?: number; // 画像尺寸 48 ~ 180 px，默认 72
  avatarFilter?: "woodblock" | "sepia" | "high-contrast" | "none"; // 画像滤镜风格
}

export interface BriefItem {
  id: string;
  tag?: string; // e.g. "【西境要塞】" / "【法租界訊】"
  prefix?: string; // e.g. "◆", "▲", "·"
  text: string;
}

export interface BriefsBlock {
  id: string;
  type: "briefs";
  title: string;
  items: BriefItem[];
  borderStyle?: "vintage" | "simple" | "boxed";
}

export interface TableBlock {
  id: string;
  type: "table";
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  style?: "classic" | "boxed" | "striped";
}

export interface SealBlock {
  id: string;
  type: "seal";
  text: string; // 印章文字，如 "聖塞西爾·御審" / "淞滬警備司·驗訖"
  subtext?: string; // 副标，如 "聖歷七四二年" / "民國十二年"
  sealShape: "wax" | "circle" | "oval" | "square";
  color: "crimson" | "red" | "indigo" | "black";
  rotation?: number; // 倾斜角度，如 -6
  align?: "left" | "center" | "right";
}

export interface LetterBlock {
  id: string;
  type: "letter";
  title?: string; // e.g. "【讀者投書】" / "【鄭重聲明】"
  recipient?: string; // e.g. "致 帝國時報總編閣下："
  content: string; // 信件/声明正文
  sender: string; // e.g. "遠境巡林客·阿蘭 謹上"
  date?: string; // 日期/署期
  borderStyle?: "paper" | "quote" | "vintage";
}

export interface ObituaryBlock {
  id: string;
  type: "obituary";
  headerBadge?: string; // e.g. "✦ 沉痛哀告 ✦" or "【訃 告】"
  deceasedName: string; // 逝者姓名
  titleOrRole?: string; // 头衔/身份
  dates: string; // 生卒年月与享年
  message: string; // 悼念文辞与安息叙述
  mourners: string; // 治丧组织/家属名录
  serviceInfo?: string; // 追思弥撒/公祭地址时间
  borderStyle?: "black-thick" | "ornate-black" | "double-black";
}

export type Block = 
  | HeadlineBlock 
  | ArticleBlock 
  | ImageBlock 
  | DividerBlock 
  | AdBlock
  | BountyBlock
  | BriefsBlock
  | TableBlock
  | SealBlock
  | LetterBlock
  | ObituaryBlock;

export interface Column {
  id: string;
  blocks: Block[];
}

export interface Row {
  id: string;
  split: ColumnSplit; // '1' (full), '1-1' (even halves), '1-2' (left small, right wide), '2-1' (left wide, right small), '1-1-1' (three thirds)
  columns: Column[]; // array of columns corresponding to the split
  height?: number; // Optional row height in pixels (used for republican vertical layout)
  /** Continuous column width fractions (e.g. [1, 2] = 1:2).
   *  Overrides the discrete `split` ratio when present.
   *  Length must match columns.length. */
  columnFractions?: number[];
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
  // Republican theme extras
  republicanHeaderStyle?: "vertical-box" | "horizontal-rtl";
  publisherEn?: string; // 英文刊名 e.g. "THE CHINA TIMES"
  publisherOffice?: string; // 发行局/印刷所 e.g. "上海山东路一六三号"
}

export interface FloatingSeal {
  id: string;
  shape: "wax" | "circle" | "oval" | "square";
  color: "crimson" | "red" | "indigo" | "black" | "gold";
  text: string;     // 主印文，如 "帝国特许" / "审核验讫"
  subtext?: string; // 副印文，如 "圣历742年" / "第307号"
  x: number;        // 百分比 0 ~ 100，相对报纸容器
  y: number;        // 百分比 0 ~ 100，相对报纸容器
  rotation: number; // 倾角 -180 ~ 180，默认 -8
  scale: number;    // 缩放 0.5 ~ 2.0，默认 1.0
  opacity?: number; // 透明度 0.3 ~ 1.0，默认 0.95
}

export interface NewspaperData {
  theme?: NewspaperTheme;
  header: NewspaperHeader;
  rows: Row[];
  floatingSeals?: FloatingSeal[];
}

export interface ClipartItem {
  id: string;
  name: string;
  category: string;
  themeGroup?: "fantasy" | "republican" | "universal"; // Optional grouping by theme
  svgPath: string; // SVG paths or full SVG content
}
