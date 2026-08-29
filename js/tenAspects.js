/**
 * 幼児期に身につけたい10の姿・小学校の学びの芽生え
 * ハッシュタグ形式マスター定義 & 学年・クラス階層構造
 */
const TEN_ASPECTS = [
  {
    id: "aspect_1",
    num: 1,
    title: "健康な心と体",
    shortName: "健康な心と体",
    tag: "#健康な心と体",
    description: "自ら体を動かして活動に親しみ、見通しをもって健康・安全に行動する。"
  },
  {
    id: "aspect_2",
    num: 2,
    title: "自立心",
    shortName: "自立心",
    tag: "#自立心",
    description: "自分で力や考えを試し、あきらめずにやり遂げる喜びを味わう。"
  },
  {
    id: "aspect_3",
    num: 3,
    title: "協同性",
    shortName: "協同性",
    tag: "#協同性",
    description: "友達と力を合わせ、共通の目的を持って活動を展開し、達成感を共有する。"
  },
  {
    id: "aspect_4",
    num: 4,
    title: "道徳性・規範意識の芽生え",
    shortName: "道徳性・規範意識",
    tag: "#道徳性規範意識",
    description: "相手の気持ちに気づき、ルールや約束の大切さを理解し、折り合いをつけながら行動する。"
  },
  {
    id: "aspect_5",
    num: 5,
    title: "社会生活との関わり",
    shortName: "社会生活との関わり",
    tag: "#社会生活との関わり",
    description: "学校内外の人々と親しみ、地域社会や公共の場への関心と愛着を深める。"
  },
  {
    id: "aspect_6",
    num: 6,
    title: "思考力の芽生え",
    shortName: "思考力の芽生え",
    tag: "#思考力の芽生え",
    description: "物事の性質や仕組みに興味を持ち、工夫したり予想したりして試行錯誤する。"
  },
  {
    id: "aspect_7",
    num: 7,
    title: "自然との関わり・生命尊重",
    shortName: "自然・生命尊重",
    tag: "#自然生命尊重",
    description: "季節の移り変わりや動植物・自然事象に親しみ、命の大切さに気づき大切にする。"
  },
  {
    id: "aspect_8",
    num: 8,
    title: "数量や図形、標識や文字などへの関心・感覚",
    shortName: "数量・図形・文字への関心",
    tag: "#数量図形文字",
    description: "生活や学習の中で数や量、形、標識、文字などに親しみ、活用しようとする。"
  },
  {
    id: "aspect_9",
    num: 9,
    title: "言葉による伝え合い",
    shortName: "言葉による伝え合い",
    tag: "#言葉による伝え合い",
    description: "経験したことや考えを言葉で伝え合い、相手の話に耳を傾け心を通わせる。"
  },
  {
    id: "aspect_10",
    num: 10,
    title: "豊かな感性と表現",
    shortName: "豊かな感性と表現",
    tag: "#感性と表現",
    description: "美しいものや心を動かす出来事に触れ、イメージを言葉や音、絵や動きで豊かに表現する。"
  }
];

// 小学校向け 学年・クラス階層マスター（設定画面で自由に追加・編集可能）
const DEFAULT_GRADE_HIERARCHY = [
  {
    gradeId: "all",
    gradeName: "全校・すべて",
    icon: "sparkles",
    color: "#2E7D32",
    classes: []
  },
  {
    gradeId: "g1",
    gradeName: "1年",
    icon: "book-open",
    color: "#388E3C",
    classes: ["1年1組", "1年2組", "1年3組"]
  },
  {
    gradeId: "g2",
    gradeName: "2年",
    icon: "smile",
    color: "#43A047",
    classes: ["2年1組", "2年2組"]
  },
  {
    gradeId: "g3",
    gradeName: "3年",
    icon: "compass",
    color: "#66BB6A",
    classes: ["3年1組", "3年2組", "3年3組"]
  },
  {
    gradeId: "g4",
    gradeName: "4年",
    icon: "lightbulb",
    color: "#26A69A",
    classes: ["4年1組", "4年2組"]
  },
  {
    gradeId: "g5",
    gradeName: "5年",
    icon: "users",
    color: "#00897B",
    classes: ["5年1組", "5年2組"]
  },
  {
    gradeId: "g6",
    gradeName: "6年",
    icon: "award",
    color: "#1B5E20",
    classes: ["6年1組", "6年2組", "6年3組"]
  },
  {
    gradeId: "individual",
    gradeName: "個別級",
    icon: "heart",
    color: "#80CBC4",
    classes: ["かがやき1組", "かがやき2組", "たんぽぽ組"]
  },
  {
    gradeId: "specialist",
    gradeName: "専科等",
    icon: "palette",
    color: "#558B2F",
    classes: ["音楽専科", "図工専科", "理科専科", "外国語活動", "学年合同"]
  }
];
