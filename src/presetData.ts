import { WorldLock, StoryBlock, StoryboardResult, Language } from './types';

// ==========================================
// 英語版 初期プリセットデータ (EN)
// ==========================================

export const PRESET_WORLD_LOCK: WorldLock = {
  title: 'Neon Ramen 2099',
  setting:
    'A rain-soaked cyberpunk night market where automated drone kitchens have replaced human chefs, except for one last analog ramen stall.',
  theme: 'Preserving human warmth and imperfection in an over-optimized world.',
  characters: [
    {
      id: 'char-akira',
      name: 'Akira',
      role: 'Former AI engineer, now ramen stall owner',
      traits: 'Stoic, observant, speaks in short sentences, wears an oil-stained apron',
    },
    {
      id: 'char-mio',
      name: 'Unit-04 / Mio',
      role: 'Runaway courier android',
      traits: 'Damaged vocal module, curious about human food, carries a locked memory core',
    },
  ],
};

export const PRESET_BLOCKS: StoryBlock[] = [
  {
    id: 'block-ki',
    type: 'ki',
    label: 'Ki (Intro)',
    pages: 1,
    tension: 20,
    event: "On a quiet rainy night, Mio stumbles into Akira's stall with a sparking shoulder unit.",
    characterIds: ['char-akira', 'char-mio'],
  },
  {
    id: 'block-sho',
    type: 'sho',
    label: 'Sho (Development)',
    pages: 1,
    tension: 55,
    event:
      'While Akira repairs her arm, he discovers city surveillance drones scanning the market for her memory core.',
    characterIds: ['char-akira', 'char-mio'],
  },
  {
    id: 'block-ten',
    type: 'ten',
    label: 'Ten (Climax)',
    pages: 1,
    tension: 90,
    event:
      'Enforcer units surround the stall. Akira uses the steam and boiling broth line to blind the sensors and shield Mio.',
    characterIds: ['char-akira', 'char-mio'],
  },
  {
    id: 'block-ketsu',
    type: 'ketsu',
    label: 'Ketsu (Resolution)',
    pages: 1,
    tension: 30,
    event:
      'At dawn, the enforcers are gone. Mio experiences the warmth of a fresh bowl of ramen for the first time.',
    characterIds: ['char-akira', 'char-mio'],
  },
];

export const INITIAL_STORYBOARD: StoryboardResult = {
  pages: [
    {
      pageNumber: 1,
      blockType: 'ki',
      appliedTension: 20,
      pageSummary:
        'Low-tension atmospheric introduction. Rain falls steadily over the neon-lit alley as Mio stumbles under the warm noren curtain of Akira’s stall.',
      panels: [
        {
          panelNumber: 1,
          size: 'medium',
          camera: 'Long shot / Eye-level',
          composition:
            'Wide alley view of the automated cyberpunk night market in pouring rain. A lone wooden ramen cart glows warmly at the corner.',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'SHAAA... (Heavy rain hitting tin roof)' },
            {
              character: 'Akira',
              type: 'monologue',
              text: 'Midnight. Even the delivery drones have docked for maintenance.',
            },
          ],
        },
        {
          panelNumber: 2,
          size: 'small',
          camera: 'Close-up / Eye-level',
          composition:
            'Akira’s calloused hands skimming simmering pork bone broth with a mesh ladle. Steam rises gently.',
          dialogues: [{ character: 'SFX', type: 'sfx', text: 'GUTSU... GUTSU... (Simmering broth)' }],
        },
        {
          panelNumber: 3,
          size: 'medium',
          camera: 'Medium shot / Eye-level',
          composition:
            'The damp noren curtain parts. Unit-04 / Mio leans against the wooden counter, blue sparks popping from her torn left shoulder joint.',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'BZZT—CRACK!' },
            {
              character: 'Unit-04 / Mio',
              type: 'speech',
              text: 'Ex-excuse me... heat source detected. Requesting... temporary shelter.',
            },
          ],
        },
        {
          panelNumber: 4,
          size: 'medium',
          camera: 'Medium shot / Over-the-shoulder',
          composition:
            'Akira doesn’t look surprised. He sets down his ladle, wipes his hands on his oil-stained apron, and reaches for an old toolkit under the counter.',
          dialogues: [
            { character: 'Akira', type: 'speech', text: 'Sit. You’re dripping coolant on the counter.' },
          ],
        },
      ],
    },
    {
      pageNumber: 2,
      blockType: 'sho',
      appliedTension: 55,
      pageSummary:
        'Rising tension. Akira solders Mio’s damaged actuator while red laser sweeps from city surveillance drones cut through the alley fog.',
      panels: [
        {
          panelNumber: 1,
          size: 'medium',
          camera: 'Medium close-up / Eye-level',
          composition:
            'Akira uses a micro-soldering iron on Mio’s exposed shoulder servo. His eyes narrow as he spots a military-grade seal on her chest housing.',
          dialogues: [
            { character: 'Akira', type: 'speech', text: 'Courier model? No. That core is encrypted.' },
            {
              character: 'Unit-04 / Mio',
              type: 'speech',
              text: 'I—I do not know what is inside. Only that I must not be formatted.',
            },
          ],
        },
        {
          panelNumber: 2,
          size: 'small',
          camera: 'High angle / Bird’s-eye view',
          composition:
            'Three sleek municipal surveillance drones glide down into the narrow market street, projecting crimson grid lasers across the wet pavement.',
          dialogues: [{ character: 'SFX', type: 'sfx', text: 'WHIRRRRR—PING!' }],
        },
        {
          panelNumber: 3,
          size: 'medium',
          camera: 'Shot-reverse-shot / Bust-up',
          composition:
            'Mio’s optical sensors dilate in panic as a red scan line brushes the edge of the stall curtain. Akira grabs her wrist firmly.',
          dialogues: [
            {
              character: 'Unit-04 / Mio',
              type: 'speech',
              text: 'Seeker drones... Te-telemetry sweep in 10 seconds!',
            },
            { character: 'Akira', type: 'speech', text: 'Power down your transceiver. Now.' },
          ],
        },
        {
          panelNumber: 4,
          size: 'medium',
          camera: 'Close-up / Low angle',
          composition:
            'Akira’s hand grips the main pressure valve of the stall’s high-output steam boiler. His expression is cold and resolved.',
          dialogues: [{ character: 'Akira', type: 'monologue', text: 'Thermal optics hate boiling grease.' }],
        },
      ],
    },
    {
      pageNumber: 3,
      blockType: 'ten',
      appliedTension: 90,
      pageSummary:
        'High-tension climax! Dynamic large panels as Akira ruptures the high-pressure broth steam line to blind the enforcer units surrounding the stall.',
      panels: [
        {
          panelNumber: 1,
          size: 'wide',
          camera: 'Low angle / Worm’s-eye view',
          composition:
            'Armed Enforcer units surround the wooden cart, weapons raised. In the foreground, Akira wrenches the brass pressure release valve full open!',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'GWOOOOOOSH!! (Explosive steam blast)' },
            { character: 'Akira', type: 'speech', text: 'Get down!' },
          ],
        },
        {
          panelNumber: 2,
          size: 'large',
          camera: 'Extreme close-up / Dutch angle',
          composition:
            'Dense, superheated cloud of tonkotsu steam and aerosolized oil engulfs the alley. Enforcer thermal visors glitch violently with warning static.',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'KZZZZT—ERROR! THERMAL WHITE-OUT!' },
            { character: 'Unit-04 / Mio', type: 'monologue', text: 'He masked my core signature with the boiler heat...!' },
          ],
        },
        {
          panelNumber: 3,
          size: 'medium',
          camera: 'High angle / Dynamic action shot',
          composition:
            'Through the swirling white vapor, Akira stands like a wall in front of crouched Mio, holding a heavy iron ladle as the blinded drones veer away.',
          dialogues: [{ character: 'Akira', type: 'speech', text: 'Stay quiet. Let them chase ghosts.' }],
        },
      ],
    },
    {
      pageNumber: 4,
      blockType: 'ketsu',
      appliedTension: 30,
      pageSummary:
        'Calm resolution at dawn. The rain stops, and Mio experiences the warmth of a freshly made bowl of ramen.',
      panels: [
        {
          panelNumber: 1,
          size: 'medium',
          camera: 'Long shot / Eye-level',
          composition:
            'Pale morning light reflects off puddles in the quiet alley. The drones are gone, and gentle steam still drifts from the battered stall.',
          dialogues: [{ character: 'SFX', type: 'sfx', text: 'CHUN... CHUN... (Distant morning synth-birds)' }],
        },
        {
          panelNumber: 2,
          size: 'medium',
          camera: 'Close-up / High angle',
          composition:
            'A ceramic bowl of rich tonkotsu ramen is placed on the wooden counter—chashu, soft-boiled egg, green onions, shimmering broth.',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'KOTON. (Bowl placed on wood)' },
            { character: 'Akira', type: 'speech', text: 'Leftover stock. Don’t let it go to waste.' },
          ],
        },
        {
          panelNumber: 3,
          size: 'small',
          camera: 'Close-up / Eye-level',
          composition:
            'Mio wraps both repaired hands around the warm ceramic bowl. Her vocal module clicks softly as her optical sensors soften.',
          dialogues: [
            {
              character: 'Unit-04 / Mio',
              type: 'speech',
              text: 'Temperature: 68 degrees Celsius... It feels... very safe.',
            },
          ],
        },
        {
          panelNumber: 4,
          size: 'medium',
          camera: 'Medium shot / Profile view',
          composition:
            'Akira turns back to wash his pots, hiding a faint, almost imperceptible smile while Mio leans into the rising steam.',
          dialogues: [{ character: 'Akira', type: 'speech', text: 'Eat up. The city wakes up soon.' }],
        },
      ],
    },
  ],
};

// ==========================================
// 日本語版 初期プリセットデータ (JA)
// ==========================================

export const PRESET_WORLD_LOCK_JA: WorldLock = {
  title: 'ネオン・ラーメン 2099',
  setting:
    '全自動ドローン厨房が人間の料理人を駆逐した、雨降りしきるサイバーパンクの闇市。路地裏にただ一軒だけ、直火と寸胴鍋でスープを炊き続けるアナログな屋台が残っていた。',
  theme: '過剰に最適化された管理社会の中で、人間の温もりと「不完全さ」を守り抜くこと。',
  characters: [
    {
      id: 'char-akira',
      name: 'アキラ',
      role: '元AIエンジニア、現在は屋台ラーメンの店主',
      traits: '寡黙で観察眼が鋭い。短文でぶっきらぼうに話す。油染みのついたエプロンを愛用。',
    },
    {
      id: 'char-mio',
      name: 'Unit-04 / ミオ',
      role: '逃亡中のクーリエ（運び屋）型アンドロイド',
      traits: '音声モジュールが一部破損し少しノイズが混じる。人間の食事に強い好奇心を持つ。暗号化されたメモリコアを内蔵。',
    },
  ],
};

export const PRESET_BLOCKS_JA: StoryBlock[] = [
  {
    id: 'block-ki',
    type: 'ki',
    label: '起（導入）',
    pages: 1,
    tension: 20,
    event: '静かな雨の深夜、肩の関節ユニットから青い火花を散らしたミオが、アキラの屋台の暖簾へと倒れ込んでくる。',
    characterIds: ['char-akira', 'char-mio'],
  },
  {
    id: 'block-sho',
    type: 'sho',
    label: '承（展開）',
    pages: 1,
    tension: 55,
    event: 'アキラがミオの腕をハンダ付けで応急修理する最中、彼女のメモリコアを追う都市監視ドローンの赤いレーザー網が市場をスキャンし始める。',
    characterIds: ['char-akira', 'char-mio'],
  },
  {
    id: 'block-ten',
    type: 'ten',
    label: '転（山場・転換）',
    pages: 1,
    tension: 90,
    event: '武装エンフォーサー機体が屋台を包囲！アキラは高圧寸胴ボイラーの蒸気弁を全開にし、白濁した熱気と脂の霧で赤外線センサーを完全に無力化してミオを盾となって守る。',
    characterIds: ['char-akira', 'char-mio'],
  },
  {
    id: 'block-ketsu',
    type: 'ketsu',
    label: '結（結末・余韻）',
    pages: 1,
    tension: 30,
    event: '夜明け。追手は去り、雨上がりの屋台でミオは生まれて初めて「出来立ての一杯のラーメン」の温もりに触れる。',
    characterIds: ['char-akira', 'char-mio'],
  },
];

export const INITIAL_STORYBOARD_JA: StoryboardResult = {
  pages: [
    {
      pageNumber: 1,
      blockType: 'ki',
      appliedTension: 20,
      pageSummary:
        '【低緊張：20】雨音が響く静かな導入。ネオン街の路地裏に佇む屋台の暖簾をくぐり、傷ついたミオが転がり込んでくる。',
      panels: [
        {
          panelNumber: 1,
          size: 'medium',
          camera: 'ロングショット ／ アイレベル（俯瞰気味の導入）',
          composition:
            '土砂降りのサイバーパンク夜市。無人ドローンが行き交う冷たい路地の片隅で、木製のラーメン屋台だけが温かい提灯の光を灯している。',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'ザーーーッ……（トタン屋根を叩く雨音）' },
            {
              character: 'アキラ',
              type: 'monologue',
              text: '午前零時過ぎか……。配達ドローンすら充電ドックに戻る時間だ。',
            },
          ],
        },
        {
          panelNumber: 2,
          size: 'small',
          camera: 'クローズアップ ／ 手元アップ',
          composition:
            '寸胴鍋で白濁した豚骨スープが静かに沸き立ち、アキラの無骨な手が平ザルで丁寧にアクをすくい取る。湯気がふわりと昇る。',
          dialogues: [{ character: 'SFX', type: 'sfx', text: 'グツ……グツ……（スープが煮える音）' }],
        },
        {
          panelNumber: 3,
          size: 'medium',
          camera: 'ミディアムショット ／ 正面アイレベル',
          composition:
            '濡れた暖簾が乱暴に揺れ、左肩の装甲が裂けて青いスパークを散らすミオ（Unit-04）がカウンターに手をつく。',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'バチッ……ジジッ！' },
            {
              character: 'Unit-04 / ミオ',
              type: 'speech',
              text: 'す、すみません……熱源反応を検知……一時的な、雨宿りを申請します……。',
            },
          ],
        },
        {
          panelNumber: 4,
          size: 'medium',
          camera: '肩越しショット（オーバー・ザ・ショルダー）',
          composition:
            'アキラは動じる様子もなくレードルを置き、油染みのエプロンで手を拭くと、カウンター下から年季の入った工具箱を取り出す。',
          dialogues: [
            { character: 'アキラ', type: 'speech', text: '……座れ。冷却液がカウンターに垂れてるぞ。' },
          ],
        },
      ],
    },
    {
      pageNumber: 2,
      blockType: 'sho',
      appliedTension: 55,
      pageSummary:
        '【中緊張：55】高まる緊迫感。アキラがミオの肩を応急修理する中、路地の上空から都市監視ドローンの赤いスキャンレーザーが迫る。',
      panels: [
        {
          panelNumber: 1,
          size: 'medium',
          camera: 'ミディアム・クローズアップ ／ アイレベル',
          composition:
            '精密ハンダごてでミオの肩部サーボを繋ぐアキラ。彼女の胸部フレームの奥に軍用規格の暗号化メモリコアを見つけ、鋭く目を細める。',
          dialogues: [
            { character: 'アキラ', type: 'speech', text: 'ただの運び屋型じゃないな。そのコア、重機密指定だぞ。' },
            {
              character: 'Unit-04 / ミオ',
              type: 'speech',
              text: 'わ、私にも中身は分かりません。ただ……初期化（フォーマット）されるわけにはいかないんです。',
            },
          ],
        },
        {
          panelNumber: 2,
          size: 'small',
          camera: 'ハイアングル（俯瞰ショット）',
          composition:
            '霧雨の路地裏へ3機の都市監視ドローンが滑るように降下し、濡れたアスファルトに真紅のグリッドレーザーを照射する。',
          dialogues: [{ character: 'SFX', type: 'sfx', text: 'キィィィン……ピピッ！' }],
        },
        {
          panelNumber: 3,
          size: 'medium',
          camera: 'バストアップ ／ 切り返し構図',
          composition:
            '暖簾の裾を赤いレーザーがかすめ、ミオの光学センサー（瞳）が恐怖で見開かれる。アキラが素早く彼女の手首を掴む。',
          dialogues: [
            {
              character: 'Unit-04 / ミオ',
              type: 'speech',
              text: 'シーカー・ドローン……！あ、あと10秒で生体・電装スキャンが到達します！',
            },
            { character: 'アキラ', type: 'speech', text: '通信機を完全に切れ。今すぐだ。' },
          ],
        },
        {
          panelNumber: 4,
          size: 'medium',
          camera: 'クローズアップ ／ ややローアングル',
          composition:
            '屋台の心臓部である高圧蒸気ボイラーの真鍮バルブに手をかけるアキラ。その横顔は冷徹な覚悟に満ちている。',
          dialogues: [{ character: 'アキラ', type: 'monologue', text: '最新鋭の熱光学センサーも、煮えたぎる脂の霧には無力だ。' }],
        },
      ],
    },
    {
      pageNumber: 3,
      blockType: 'ten',
      appliedTension: 90,
      pageSummary:
        '【高緊張：90】クライマックスの大ゴマ演出！包囲する武装機体に対し、アキラが高圧豚骨ボイラーの蒸気を爆ぜさせて視界とセンサーを奪う！',
      panels: [
        {
          panelNumber: 1,
          size: 'wide',
          camera: 'ローアングル（強いアオリ構図）',
          composition:
            '横ぶち抜きの大ゴマ！武装エンフォーサー機体が屋台を包囲し銃口を向ける瞬間、手前のアキラが真鍮の圧力解放バルブを限界まで捻り開ける！',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'ブシャアアアアアッ！！（爆音と共に噴き出す高圧蒸気）' },
            { character: 'アキラ', type: 'speech', text: '伏せろッ！！' },
          ],
        },
        {
          panelNumber: 2,
          size: 'large',
          camera: 'エクストリーム・クローズアップ ／ 斜め構図（ダッチアングル）',
          composition:
            '画面全体を覆い尽くす超高熱の白濁湯気と油煙！エンフォーサーのサーマルバイザーが真っ白に飽和し、警告ノイズが激しく明滅する。',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'バチバチッ――ERROR!! 熱源検知不能（ホワイトアウト）！' },
            { character: 'Unit-04 / ミオ', type: 'monologue', text: 'ボイラーの熱量で、私のコア反応を完全にカモフラージュした……！？' },
          ],
        },
        {
          panelNumber: 3,
          size: 'medium',
          camera: 'ハイアングル ／ ダイナミックアクション',
          composition:
            '渦巻く白い湯気の中、うずくまるミオの前に壁のように立ちはだかるアキラ。センサーを狂わされたドローン群が路地の奥へと逸れていく。',
          dialogues: [{ character: 'アキラ', type: 'speech', text: '息を殺してろ。奴らには湯気の亡霊でも追わせておけ。' }],
        },
      ],
    },
    {
      pageNumber: 4,
      blockType: 'ketsu',
      appliedTension: 30,
      pageSummary:
        '【低緊張：30】夜明けの静かな余韻。嵐が去った屋台で、ミオは生まれて初めて温かいラーメンの器を両手で包み込む。',
      panels: [
        {
          panelNumber: 1,
          size: 'medium',
          camera: 'ロングショット ／ アイレベル',
          composition:
            '雨が上がり、淡い朝焼けが路地の水たまりを照らす。追手の姿は消え、湯気の残る屋台に静寂が戻っている。',
          dialogues: [{ character: 'SFX', type: 'sfx', text: 'ポタ……ポタ……（軒先から落ちる雫の音）' }],
        },
        {
          panelNumber: 2,
          size: 'medium',
          camera: 'クローズアップ ／ やや俯瞰',
          composition:
            '木製カウンターの上に置かれる湯気立つ豚骨ラーメンの丼。チャーシュー、半熟味玉、刻みネギが黄金色の脂に輝く。',
          dialogues: [
            { character: 'SFX', type: 'sfx', text: 'コトン……' },
            { character: 'アキラ', type: 'speech', text: '残り物のスープだ。冷めないうちに食え。' },
          ],
        },
        {
          panelNumber: 3,
          size: 'small',
          camera: 'クローズアップ ／ 正面アイレベル',
          composition:
            '修理されたばかりの両手で、温かい陶器の丼をそっと包み込むミオ。彼女の光学センサーが柔らかく細められる。',
          dialogues: [
            {
              character: 'Unit-04 / ミオ',
              type: 'speech',
              text: '器表面温度、68度……すごく、安心する温度です。',
            },
          ],
        },
        {
          panelNumber: 4,
          size: 'medium',
          camera: 'ミディアムショット ／ 横顔（プロファイル）',
          composition:
            '背を向けて寸胴を洗い始めるアキラの口元に、ほんのわずかな笑みが浮かぶ。湯気の向こうでミオが幸せそうに顔を寄せる。',
          dialogues: [{ character: 'アキラ', type: 'speech', text: 'さっさと食えよ。じきに街が目を覚ます。' }],
        },
      ],
    },
  ],
};

// 言語に応じたプリセット一式をディープコピーして返すヘルパー関数（定数の参照共有による意図しない書き換えを防止）
export function getPresetByLang(lang: Language): {
  worldLock: WorldLock;
  blocks: StoryBlock[];
  storyboard: StoryboardResult;
} {
  if (lang === 'ja') {
    return {
      worldLock: JSON.parse(JSON.stringify(PRESET_WORLD_LOCK_JA)) as WorldLock,
      blocks: JSON.parse(JSON.stringify(PRESET_BLOCKS_JA)) as StoryBlock[],
      storyboard: JSON.parse(JSON.stringify(INITIAL_STORYBOARD_JA)) as StoryboardResult,
    };
  }
  return {
    worldLock: JSON.parse(JSON.stringify(PRESET_WORLD_LOCK)) as WorldLock,
    blocks: JSON.parse(JSON.stringify(PRESET_BLOCKS)) as StoryBlock[],
    storyboard: JSON.parse(JSON.stringify(INITIAL_STORYBOARD)) as StoryboardResult,
  };
}
