/**
 * 小学校 投稿 初期サンプルデータ（insta倉m）
 */
const SAMPLE_RECORDS = [
  {
    id: "rec_20260828_01",
    authorName: "佐藤 健一 先生",
    date: "2026-08-28",
    className: "1年1組",
    photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80",
    comment: "生活科「水となかよし」。校庭の砂場でペットボトルやといを使って水を流すコース作り。「こっちにつなぐと滝になるよ！」「もっと高くしよう」と夢中になって試行錯誤していました。",
    aspects: ["aspect_3", "aspect_6", "aspect_7"], // 協同性, 思考力の芽生え, 自然生命尊重
    likes: 8,
    reactions: ["👏", "✨", "🌱"],
    comments: [
      { id: "c_1", author: "高橋 (理科専科)", text: "水の流れの傾斜の実験にもつながる素晴らしい探究ですね！", createdAt: "2026-08-28T12:00:00.000Z" },
      { id: "c_2", author: "田中 (学年主任)", text: "片付けも協力して時間通りにできていて感心しました。", createdAt: "2026-08-28T13:15:00.000Z" }
    ],
    syncedGcs: true,
    createdAt: "2026-08-28T11:30:00.000Z"
  },
  {
    id: "rec_20260827_01",
    authorName: "山田 美咲 先生",
    date: "2026-08-27",
    className: "3年1組",
    photoUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=900&q=80",
    comment: "算数「ぼうグラフと表」。グループごとに校内の好きな場所調べの結果をグラフ化。分からないところを「ここ目盛りいくつ？」と教え合いながら完成させました。",
    aspects: ["aspect_2", "aspect_3", "aspect_8"], // 自立心, 協同性, 数量図形文字
    likes: 12,
    reactions: ["💡", "👏"],
    comments: [
      { id: "c_3", author: "佐藤 健一 先生", text: "1年生の生活科探検のアンケート結果もぜひ使ってください！", createdAt: "2026-08-27T15:20:00.000Z" }
    ],
    syncedGcs: true,
    createdAt: "2026-08-27T14:15:00.000Z"
  },
  {
    id: "rec_20260825_01",
    authorName: "鈴木 航平 先生",
    date: "2026-08-25",
    className: "2年1組",
    photoUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=900&q=80",
    comment: "生活科「生きものを育てよう」。中庭で見つけたバッタやダンゴムシのすみか作り。草や土の湿り気までこだわって観察シートにびっしりスケッチしていました。",
    aspects: ["aspect_7", "aspect_9"], // 自然生命尊重, 言葉による伝え合い
    likes: 7,
    reactions: ["🐛", "🌱", "✨"],
    comments: [],
    syncedGcs: true,
    createdAt: "2026-08-25T10:20:00.000Z"
  },
  {
    id: "rec_20260822_01",
    authorName: "小林 陽子 先生",
    date: "2026-08-22",
    className: "6年1組",
    photoUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=900&q=80",
    comment: "総合的な学習の時間「地域の魅力を発信しよう」。パンフレット作成に向け、構成案をグループで熱心に検討。下級生にもわかりやすい表現を工夫しています。",
    aspects: ["aspect_3", "aspect_5", "aspect_8", "aspect_10"], // 協同性, 社会生活, 数量文字, 感性と表現
    likes: 15,
    reactions: ["🎉", "👏", "❤️"],
    comments: [
      { id: "c_4", author: "校長先生", text: "最高学年らしい主体的な話し合いの姿ですね。", createdAt: "2026-08-22T16:00:00.000Z" }
    ],
    syncedGcs: true,
    createdAt: "2026-08-22T15:40:00.000Z"
  },
  {
    id: "rec_20260818_01",
    authorName: "松本 亮 先生",
    date: "2026-08-18",
    className: "4年1組",
    photoUrl: "https://images.unsplash.com/photo-1596464716127-f2a829822301?auto=format&fit=crop&w=900&q=80",
    comment: "図工「コロコロガーレ」。ビー玉が転がる立体迷路を段ボールで制作。傾斜やトンネルの仕掛けに工夫を凝らし、友達の作品を試走してアドバイスし合っていました。",
    aspects: ["aspect_1", "aspect_6", "aspect_10"], // 健康, 思考力の芽生え, 感性と表現
    likes: 10,
    reactions: ["💡", "✨"],
    comments: [],
    syncedGcs: true,
    createdAt: "2026-08-18T10:00:00.000Z"
  }
];
