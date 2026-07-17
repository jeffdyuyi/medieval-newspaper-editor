import { NewspaperData } from "./types";

export const INITIAL_NEWSPAPER_DATA: NewspaperData = {
  theme: "fantasy",
  header: {
    title: "星辉帝国要闻报",
    subtitle: "「真理之光，永照帝国；剑与魔法，同书纪元」  •  晨刊",
    issueNo: "第 342 期",
    location: "圣塞西尔帝国王都",
    date: "圣光历 742年 暮秋十五日",
    price: "售价：三枚铜币",
    titleFont: "font-mashan",
    headerStyle: "classic",
    footerLeft: "星辉帝国皇家印刷署特许印制局发行",
    footerRight: "帝国时报印刷馆特许发行 © 圣历742年"
  },
  rows: [
    {
      id: "row_1",
      split: "1-2",
      columns: [
        {
          id: "col_1_1",
          blocks: [
            {
              id: "block_img_1",
              type: "image",
              src: "", // Will render the dragon clipart
              filter: "woodblock",
              caption: "南部灰烬山脉观测到的古老黑龙振翅影迹",
              isClipart: true,
              clipartId: "dragon",
              scale: 85
            },
            {
              id: "block_div_1",
              type: "divider",
              style: "ornament",
              ornamentType: "fleur-de-lis"
            },
            {
              id: "block_ad_1",
              type: "ad",
              title: "莫林药水工坊：强效隐形药剂",
              content: "只需两枚银币，遁入阴影，无声无息！适合潜行、避难、潜入高塔。本月购买加赠解毒剂一瓶。",
              price: "售价：2枚银币",
              merchant: "圣塞西尔西街4号 莫林工坊",
              borderStyle: "dashed"
            }
          ]
        },
        {
          id: "col_1_2",
          blocks: [
            {
              id: "block_art_1",
              type: "article",
              title: "黑龙突袭南部秘银矿山 皇家骑士团克日出征",
              subtitle: "帝国矿工行会死伤惨重，教皇下达神圣诏令号召冒险者同往御敌",
              author: "大理石城特约记录官 艾尔温",
              paragraphs: [
                "在古老而寂静的南部灰烬山脉，烈焰之灾再度降临。昨日薄暮时分，一头体型庞大的远古黑龙拍打着如黑夜般深邃的巨翼，突破了南部矿区的魔法防御结界，吐出炽烈的硫磺龙息，导致多座秘银矿坑化为火海。",
                "根据幸存矿工描述，这头恶兽在废墟中搜刮了整整三箱未开采的纯净秘银原石，并将其运往高耸入云的火山巢穴。矿工行会会长拉尔夫老泪纵横地控诉称：'这是近五十年来最惨重的损失，行会的基石被付之一炬！'",
                "圣塞西尔王都今日清晨敲响了十二道金钟。圣骑士团长加拉哈德已奉皇家诏令，亲率精锐狮鹫骑士、皇家法师顾问以及二十名圣光祭司，克日启程前往南部行省，誓要讨伐此獠，夺回秘银。教皇陛下亦降下神圣祝福，号召一切信仰圣光的自由冒险者集结同往。"
              ],
              dropCap: true,
              fontSize: "sm",
              font: "font-serif",
              align: "justify"
            }
          ]
        }
      ]
    },
    {
      id: "row_2",
      split: "1-1-1",
      columns: [
        {
          id: "col_2_1",
          blocks: [
            {
              id: "block_hl_1",
              type: "headline",
              text: "【皇家法师通缉令】",
              subtitle: "危险巫师在逃，提供线索赏金翻倍",
              font: "font-xiaowei",
              size: "normal"
            },
            {
              id: "block_art_2",
              type: "article",
              title: "高塔学徒盗走至高奥术法书",
              subtitle: "疑似叛逃至黑森林",
              author: "至高法师议会",
              paragraphs: [
                "帝国奥术高塔昨日发布紧急悬赏。三级法术学徒里奥涉嫌在夜间巡值时，使用伪造的议会印章，盗走了记载着八阶禁咒《星辰陨落》的古老羊皮纸法书。任何提供其线索或成功将其生擒的冒险者，可前往法师公会领取五百枚金币的巨额赏金。警告：此人极度危险，可能已掌握部分禁忌奥术。"
              ],
              dropCap: false,
              fontSize: "xs",
              font: "font-kai",
              align: "left"
            }
          ]
        },
        {
          id: "col_2_2",
          blocks: [
            {
              id: "block_img_2",
              type: "image",
              src: "", // Will render the spellbook clipart
              filter: "woodblock",
              caption: "被盗的至高法书《星辰陨落》摹本印记",
              isClipart: true,
              clipartId: "spellbook",
              scale: 60
            },
            {
              id: "block_div_2",
              type: "divider",
              style: "dotted"
            },
            {
              id: "block_ad_2",
              type: "ad",
              title: "橡木桶酒馆：招募启事",
              content: "招募洗碗工、后厨帮工与高级吟游诗人各一名。日薪八枚铜币，管两顿黑面包与新鲜麦芽酒。有抗击哥布林或半兽人经验者优先录用！",
              price: "薪资：每日8枚铜币",
              merchant: "王都北广场 橡木桶酒馆",
              borderStyle: "ornate"
            }
          ]
        },
        {
          id: "col_2_3",
          blocks: [
            {
              id: "block_art_3",
              type: "article",
              title: "炼金术士研发出'丰饶之露'",
              subtitle: "作物熟期缩短十天，产量暴增",
              author: "绿野行省农业官",
              paragraphs: [
                "经过长达三年的炼金配方调制，绿野行省的炼金大师们终于宣布，他们利用微量妖精粉尘与腐殖土混合，研制出名为'丰饶之露'的新型农田增产剂。据试验，该药液能使麦田熟期缩短十天，亩产提高近三成。帝国农业部已批准在下月春耕时，于王都周边的皇家麦田进行首批试点推广。"
              ],
              dropCap: true,
              fontSize: "xs",
              font: "font-serif",
              align: "justify"
            }
          ]
        }
      ]
    }
  ]
};

export const REPUBLICAN_NEWSPAPER_DATA: NewspaperData = {
  theme: "republican",
  header: {
    title: "时事新報",
    subtitle: "中华民国十二年七月十六日",
    issueNo: "第 一六五 號",
    location: "上海山東路一六三號",
    date: "民國十二年 癸亥年 六月初三",
    price: "本埠每份四角，外埠每份六角",
    titleFont: "font-serif",
    headerStyle: "classic",
    republicanHeaderStyle: "vertical-box",
    publisherEn: "THE CHINA TIMES",
    publisherOffice: "上海山東路一六三號印刷發行",
    footerLeft: "時事新報社印刷部承印",
    footerRight: "版權所有 民國十二年"
  },
  rows: [
    {
      id: "rep_row_1",
      split: "1-1-1",
      height: 500,
      columns: [
        {
          id: "rep_col_1_1",
          blocks: [
            {
              id: "rep_block_art_1",
              type: "article",
              title: "孫中山大元帥誓師北伐宣言",
              subtitle: "廣州大本營發布動員令，各路軍閥震動",
              author: "本報特派員",
              publishOffice: "廣州電",
              paragraphs: [
                "孫中山大元帥昨日在廣州大本營發表慷慨激昂之北伐宣言，宣稱「革命尚未成功，同志仍須努力」，號召全體國民黨人及志同道合之各界人士，奮起討伐北洋軍閥，掃清阻礙中華民族復興之一切勢力。",
                "宣言發表後，廣州各界民衆數萬人自發聚集於大元帥府前，高呼口號，士氣振奮。黃埔軍校學生亦整隊入場，誓死效忠大元帥，為革命大業肝腦塗地。",
                "北方各省軍閥聞訊後大為震動，急電北京政府商議對策。各方觀察人士認爲，此次北伐若能成功，必將從根本上改變全國政治格局，結束軍閥割據之亂局。"
              ],
              dropCap: false,
              fontSize: "sm",
              font: "font-serif",
              align: "justify",
              titleMarker: "square"
            }
          ]
        },
        {
          id: "rep_col_1_2",
          blocks: [
            {
              id: "rep_block_art_2",
              type: "article",
              title: "上海大世界夏季遊園盛況",
              subtitle: "海上名伶傾巢出動，觀者如雲",
              author: "本報記者",
              publishOffice: "滬上訊",
              paragraphs: [
                "上海大世界遊樂場昨晚舉行夏季遊園會，邀請滬上各大班社名伶，連袂登臺獻藝。場內歌舞昇平，燈火輝煌，市民扶老攜幼前往觀賞者不計其數，盛況空前。",
                "此次遊園會特邀梅蘭芳、周信芳諸名家演出，票房大賣，一票難求。主辦方表示，此後每逢週末均將舉辦類似活動，以饗市民。"
              ],
              dropCap: false,
              fontSize: "sm",
              font: "font-serif",
              align: "justify",
              titleMarker: "triangle"
            },
            {
              id: "rep_block_div_1",
              type: "divider",
              style: "wenwu"
            },
            {
              id: "rep_block_art_3",
              type: "article",
              title: "各省旱澇災情時訊",
              subtitle: "",
              author: "本報電訊彙集",
              paragraphs: [
                "▲湖南電：長沙連日大雨，湘江水位暴漲，低窪地帶居民已開始轉移。▲四川電：成都平原旱情持續，糧食歉收，各地粥廠施粥以救貧民。▲山東電：黃河堤壩數處告急，當局正組織民夫加固，嚴防決口。"
              ],
              dropCap: false,
              fontSize: "xs",
              font: "font-serif",
              align: "justify",
              titleMarker: "none"
            }
          ]
        },
        {
          id: "rep_col_1_3",
          blocks: [
            {
              id: "rep_block_ad_1",
              type: "ad",
              title: "五洲大藥房廉價大展覽",
              content: "本房爲提倡國貨、普及衛生起見，特舉辦廉價大展覽。各種國產良藥、補品，一律八折優待。歡迎各界人士蒞臨參觀選購，以強身健體，保家衛國。",
              price: "特優惠價：八折起",
              merchant: "上海福州路 五洲大藥房",
              borderStyle: "wenwu"
            },
            {
              id: "rep_block_div_2",
              type: "divider",
              style: "single"
            },
            {
              id: "rep_block_ad_2",
              type: "ad",
              title: "翠鳥牌香煙大英牌 正在盛銷",
              content: "本公司出品之翠鳥牌香煙，採用上等烟葉精製而成，醇香細膩，一吸難忘。各大煙號、雜貨鋪均有代售，請認明翠鳥商標，勿購仿冒。",
              price: "每盒洋兩角",
              merchant: "水泰和煙草股份有限公司總理",
              borderStyle: "yunwen"
            }
          ]
        }
      ]
    }
  ]
};
