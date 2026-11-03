import type {
  WorldLock,
  StoryBlock,
  StoryboardResult,
  PageBrief,
  PanelBrief,
  Language,
} from '../../src/types';

// Cloudflare Pages Functions の環境変数インターフェース
export interface Env {
  META_API_KEY?: string;
  META_BASE_URL?: string;
  META_MODEL?: string;
}

interface GenerateRequestBody {
  worldLock: WorldLock;
  blocks: StoryBlock[];
  lang?: Language;
}

// Meta Model API (/responses) のレスポンスオブジェクトからテキスト本文を安全に抽出するヘルパー関数
function extractResponseText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;

  // 1. トップレベルの output_text フィールド (Responses API 標準)
  if (typeof obj.output_text === 'string' && obj.output_text.trim()) {
    return obj.output_text;
  }

  // 2. output 配列 (例: [{ role: "assistant", content: [{ type: "output_text", text: "..." }] }] 等)
  if (Array.isArray(obj.output)) {
    const collected: string[] = [];
    for (const item of obj.output) {
      if (!item || typeof item !== 'object') continue;
      const itemObj = item as Record<string, unknown>;

      if (typeof itemObj.text === 'string') {
        collected.push(itemObj.text);
      } else if (typeof itemObj.content === 'string') {
        collected.push(itemObj.content);
      } else if (Array.isArray(itemObj.content)) {
        for (const part of itemObj.content) {
          if (typeof part === 'string') {
            collected.push(part);
          } else if (part && typeof part === 'object') {
            const partObj = part as Record<string, unknown>;
            if (typeof partObj.text === 'string') {
              collected.push(partObj.text);
            } else if (typeof partObj.content === 'string') {
              collected.push(partObj.content);
            }
          }
        }
      }
    }
    if (collected.length > 0) {
      return collected.join('\n');
    }
  }

  // 3. output が単一オブジェクトや文字列の場合
  if (typeof obj.output === 'string' && obj.output.trim()) {
    return obj.output;
  }

  // 4. 互換用フォールバック (choices / completion_message)
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const firstChoice = obj.choices[0] as Record<string, unknown>;
    const msg = firstChoice?.message as Record<string, unknown> | undefined;
    if (msg && typeof msg.content === 'string') {
      return msg.content;
    }
    if (typeof firstChoice?.text === 'string') {
      return firstChoice.text;
    }
  }

  if (obj.completion_message && typeof obj.completion_message === 'object') {
    const comp = obj.completion_message as Record<string, unknown>;
    if (typeof comp.content === 'string') return comp.content;
    if (comp.content && typeof comp.content === 'object') {
      const contentObj = comp.content as Record<string, unknown>;
      if (typeof contentObj.text === 'string') return contentObj.text;
    }
  }

  return '';
}

// Markdownコードブロック（```json ... ```）が含まれていても安全にJSONを抽出・パースするラッパー関数
function parseSafeJson(rawContent: string): StoryboardResult {
  const trimmed = rawContent.trim();
  // ```json ... ``` または ``` ... ``` を除去
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate) as StoryboardResult;
  } catch {
    // 万が一前後に説明文が付いていた場合、最初の { から最後の } までを切り出して再試行
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as StoryboardResult;
    }
    throw new Error('Failed to parse JSON response from model.');
  }
}

// META_API_KEY 未設定時やローカル検証時に、入力された WorldLock と各ブロックの Tension (0-100) / Event / Pages / 言語設定(lang) に応じて
// 動的にネーム指示書を組み立てるフォールバック生成関数
function buildDynamicMockStoryboard(
  worldLock: WorldLock,
  blocks: StoryBlock[],
  lang: Language = 'en'
): StoryboardResult {
  const pages: PageBrief[] = [];
  let currentPageNumber = 1;
  const isJa = lang === 'ja';

  for (const block of blocks) {
    const pageCount = Math.max(1, Math.min(3, Number(block.pages) || 1));
    const tension = Math.max(0, Math.min(100, Number(block.tension) || 0));

    // ブロックに割り当てられた登場キャラクターを取得（未選択時は全体から補完）
    const activeChars = worldLock.characters.filter((c) => block.characterIds.includes(c.id));
    const primaryChar = activeChars[0] ||
      worldLock.characters[0] || {
        id: 'default-1',
        name: isJa ? '主人公' : 'Protagonist',
        role: isJa ? '主要人物' : 'Lead',
        traits: isJa ? '冷静沈着' : 'Focused',
      };
    const secondaryChar = activeChars[1] || worldLock.characters[1] || primaryChar;

    for (let p = 0; p < pageCount; p++) {
      const pageSuffix =
        pageCount > 1
          ? isJa
            ? `（${p + 1}/${pageCount}ページ目）`
            : ` (Part ${p + 1}/${pageCount})`
          : '';
      let panels: PanelBrief[] = [];
      let pageSummary = '';

      if (tension <= 35) {
        // Low Tension (0-35): 4〜5コマ (medium/small中心)、Long shotやEye-level、落ち着いた会話や情景描写
        const isVeryCalm = tension <= 18;
        if (isJa) {
          pageSummary = `【低緊張：${tension}/100】情景描写と静かな空気感を重視した導入・余韻構成${pageSuffix}。「${worldLock.title}」の世界観の中で描かれる場面：${block.event}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'ロングショット ／ アイレベル（状況説明の引き画）',
              composition: `舞台「${worldLock.setting}」の空気感をゆったりと映し出す情景カット。テーマ「${worldLock.theme}」を象徴する静かな光と影。`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'ザーーー……（静かに響く環境音）' },
                {
                  character: primaryChar.name,
                  type: 'monologue',
                  text: '静かな時間だ……。この場所だけは、まだ変わらない温度を保っている。',
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'クローズアップ ／ 手元・小道具のアップ',
              composition: `${primaryChar.name}の特徴（${primaryChar.traits}）が滲み出る細やかな仕草のカット。余白を活かした落ち着いたレイアウト。`,
              dialogues: [{ character: 'SFX', type: 'sfx', text: 'コトン……（静かな物音）' }],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'ミディアムショット ／ アイレベル',
              composition: `${block.event} ${primaryChar.name}と${secondaryChar.name}が穏やかな距離感で同じフレームに収まる。`,
              dialogues: [
                {
                  character: secondaryChar.name,
                  type: 'speech',
                  text: '少しだけ、ここにいてもいいですか……？',
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'small',
              camera: 'ミディアム・クローズアップ ／ 横顔',
              composition: `${primaryChar.name}（${primaryChar.role}）は普段通りの手つきを止めず、静かに頷いて応じる。`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: '……ああ。急ぐ必要はない、そこに座れ。',
                },
              ],
            },
          ];

          if (isVeryCalm) {
            panels.push({
              panelNumber: 5,
              size: 'small',
              camera: 'ロングショット ／ ややハイアングル（余韻の引き）',
              composition: `場面の余韻を残すロングカット。${block.event} の後の静けさが漂う。`,
              dialogues: [
                {
                  character: secondaryChar.name,
                  type: 'monologue',
                  text: '不思議だ……警戒センサーのノイズが、すっと消えていく。',
                },
              ],
            });
          }
        } else {
          pageSummary = `[Low Tension: ${tension}/100] Calm, atmospheric pacing${pageSuffix}. Establishing "${worldLock.title}" setting and quiet character nuances around: ${block.event}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'Long shot / Eye-level',
              composition: `Wide establishing view of ${worldLock.setting} Calm environmental details emphasize the theme: "${worldLock.theme}"`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'SHAAA... (Quiet ambient sound)' },
                {
                  character: primaryChar.name,
                  type: 'monologue',
                  text: `Another quiet hour. Everything moves slowly here.`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'Close-up / Eye-level',
              composition: `Subtle detail shot highlighting ${primaryChar.name}'s traits (${primaryChar.traits}). Gentle lighting and unhurried posture.`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'KOTON... (Soft mechanical/object sound)' },
              ],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'Medium shot / Eye-level',
              composition: `${block.event} ${primaryChar.name} and ${secondaryChar.name} share the frame with generous negative space.`,
              dialogues: [
                {
                  character: secondaryChar.name,
                  type: 'speech',
                  text: `Is it alright if I stay for a moment? The rain hasn't let up.`,
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'small',
              camera: 'Medium close-up / Eye-level',
              composition: `${primaryChar.name} responds calmly without breaking routine, embodying ${primaryChar.role}.`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: `Take a seat. No need to rush.`,
                },
              ],
            },
          ];

          if (isVeryCalm) {
            panels.push({
              panelNumber: 5,
              size: 'small',
              camera: 'Long shot / High angle',
              composition: `Still exterior view lingering on the atmosphere after: ${block.event}`,
              dialogues: [
                {
                  character: secondaryChar.name,
                  type: 'monologue',
                  text: `For the first time today, my sensors register zero threat.`,
                },
              ],
            });
          }
        }
      } else if (tension <= 70) {
        // Mid Tension (36-70): 4〜5コマ、バストアップや切り返し構図、テンポの良い対話
        if (isJa) {
          pageSummary = `【中緊張：${tension}/100】バストアップと切り返し構図によるテンポの良い対話・状況変化${pageSuffix}。展開イベント：${block.event}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'ミディアムショット ／ 肩越し（オーバー・ザ・ショルダー）',
              composition: `${primaryChar.name}の肩越しに事態の変化を捉える。${block.event}`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: '……動くな。この区画にスキャン波長が入り込んできている。',
                },
                {
                  character: secondaryChar.name,
                  type: 'speech',
                  text: 'そ、そんな……予測よりずっと早く追手が……！',
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'ハイアングル（俯瞰トラッキング）',
              composition: `「${worldLock.setting}」の暗がりを切り裂くように、不穏な影と警告光がじわじわと距離を詰めてくる。`,
              dialogues: [{ character: 'SFX', type: 'sfx', text: 'キィィィン……ピピッ！（接近する探知音）' }],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'バストアップ ／ 切り返し構図（ショット・リバース・ショット）',
              composition: `焦りを浮かべる${secondaryChar.name}の表情と、瞬時に周囲の状況を計算する${primaryChar.name}の鋭い視線を対比。`,
              dialogues: [
                {
                  character: secondaryChar.name,
                  type: 'speech',
                  text: '私のコア信号が捕捉されたら、この店まで巻き込まれます！',
                },
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: 'なら捕捉させなければいい。発信器を切れ、今すぐだ。',
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'medium',
              camera: 'クローズアップ ／ ややローアングル',
              composition: `${primaryChar.name}が迷いなく次の一手（対抗策）へと手を伸ばす。緊迫した眼光。`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'monologue',
                  text: 'スキャン到達まで残り10秒……一発で仕留めるぞ。',
                },
              ],
            },
          ];
        } else {
          pageSummary = `[Mid Tension: ${tension}/100] Brisk conversational pacing & shot-reverse-shot framing${pageSuffix}. Escalating situation: ${block.event}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'Medium shot / Over-the-shoulder',
              composition: `Tight framing over ${primaryChar.name}'s shoulder as the situation shifts: ${block.event}`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: `Hold still. Something's scanning this sector.`,
                },
                {
                  character: secondaryChar.name,
                  type: 'speech',
                  text: `They found my signal faster than calculated...`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'High angle / Tracking shot',
              composition: `Tension mounts in the background of ${worldLock.setting} Warning indicators and approaching shadows cut across the frame.`,
              dialogues: [{ character: 'SFX', type: 'sfx', text: 'WHIRRRR—BEEP! (Approaching sweep)' }],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'Shot-reverse-shot / Bust-up',
              composition: `Rapid cut between ${secondaryChar.name}'s tense expression and ${primaryChar.name}'s sharp, observant gaze.`,
              dialogues: [
                {
                  character: secondaryChar.name,
                  type: 'speech',
                  text: `If they lock onto my core, this whole stall will be flagged!`,
                },
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: `Then we don't let them lock on. Cut your output.`,
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'medium',
              camera: 'Close-up / Slight low angle',
              composition: `${primaryChar.name} prepares a decisive countermeasure, hands moving with practiced precision.`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'monologue',
                  text: `Ten seconds before the sweep hits the curtain. Make it count.`,
                },
              ],
            },
          ];
        }
      } else {
        // High Tension (71-100): 2〜3コマ (large/wideの大ゴマ中心)、Extreme close-upやLow/High angle（アオリ・俯瞰）、セリフは極限まで短くインパクト重視
        const isExtremeClimax = tension >= 92;
        if (isJa) {
          pageSummary = `【高緊張：${tension}/100】大ゴマ（Wide/Large）と激しいアオリ・俯瞰によるクライマックス演出${pageSuffix}！ ${block.event}`;
          panels = [
            {
              panelNumber: 1,
              size: 'wide',
              camera: 'ローアングル（強烈なアオリ構図）',
              composition: `ページ横ぶち抜きの特大インパクトコマ！ ${block.event} 激しい集中線と明暗コントラストが画面を支配する！`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'ドゴォォォォン――ブシャアアッ！！' },
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: '伏せろッ！！今すぐだ！',
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'large',
              camera: 'エクストリーム・クローズアップ ／ 斜め構図（ダッチアングル）',
              composition: `火花と白煙が斜めに噴き上がる中、${primaryChar.name}と${secondaryChar.name}の鬼気迫る超アップ！`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'バチバチッ――警告！センサー飽和（ホワイトアウト）！' },
                {
                  character: secondaryChar.name,
                  type: 'monologue',
                  text: 'すごい……熱気と蒸気で敵の目を完全に奪った……！',
                },
              ],
            },
          ];

          if (!isExtremeClimax) {
            panels.push({
              panelNumber: 3,
              size: 'medium',
              camera: '急角度ハイアングル（大俯瞰ショット）',
              composition: `渦巻く蒸気の中で${secondaryChar.name}を背に庇い、仁王立ちする${primaryChar.name}のシルエット。`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: '……息を潜めろ。まだ終わっちゃいない。',
                },
              ],
            });
          }
        } else {
          pageSummary = `[High Tension: ${tension}/100] Explosive climax layout with dominant large/wide panels and extreme angles${pageSuffix}! ${block.event}`;
          panels = [
            {
              panelNumber: 1,
              size: 'wide',
              camera: 'Low angle / Worm’s-eye view (Dramatic Aori)',
              composition: `Full-bleed horizontal impact panel! ${block.event} Dynamic speed lines and high-contrast lighting dominate the frame.`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'GWOOOOOOSH—BOOM!!' },
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: `Get down! NOW!`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'large',
              camera: 'Extreme close-up / Dutch angle',
              composition: `Intense close-up on ${primaryChar.name} and ${secondaryChar.name} amidst the peak action. Sparks and dense steam cut diagonally across the lens.`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'KZZZZT—CRITICAL OVERLOAD!' },
                {
                  character: secondaryChar.name,
                  type: 'monologue',
                  text: `He's blinding their sensors—!`,
                },
              ],
            },
          ];

          if (!isExtremeClimax) {
            panels.push({
              panelNumber: 3,
              size: 'medium',
              camera: 'High angle / Steep bird’s-eye (Fukan)',
              composition: `Sharp overhead view as ${primaryChar.name} shields ${secondaryChar.name} in the aftermath of the surge.`,
              dialogues: [
                {
                  character: primaryChar.name,
                  type: 'speech',
                  text: `Don't move a muscle.`,
                },
              ],
            });
          }
        }
      }

      pages.push({
        pageNumber: currentPageNumber++,
        blockType: block.type,
        appliedTension: tension,
        pageSummary,
        panels,
      });
    }
  }

  return { pages };
}

// システムプロンプトの構築（WorldLock厳守・Tension別演出ルール・言語指定・純粋JSON出力指定）
function buildSystemPrompt(lang: Language = 'en'): string {
  const languageDirective =
    lang === 'ja'
      ? `5. LANGUAGE REQUIREMENT: Output all descriptive fields ("pageSummary", "camera", "composition", "dialogues[].character", and "dialogues[].text") in natural, vivid JAPANESE suitable for a professional manga storyboard ("漫画のネーム指示書"). Keep JSON keys and enum values ("blockType", "size", "type") in exact English as specified in the schema.`
      : `5. LANGUAGE REQUIREMENT: Output all descriptive fields ("pageSummary", "camera", "composition", "dialogues[].character", and "dialogues[].text") in clear, vivid ENGLISH.`;

  return `You are a professional manga storyboard director ("Name" / ネーム architect) for StoryDAW Mini.
Your job is to generate a structured, text-only manga storyboard brief in pure JSON format based on the user's "WorldLock" (fixed world & character constants) and "Ki-Sho-Ten-Ketsu" story blocks with specific "tension" parameters (0 to 100).

STRICT RULES:
1. NEVER alter or contradict the WorldLock constants (title, setting, theme, and each character's role, traits, and speech patterns).
2. Direct the visual pacing, panel count, panel sizes, camera angles, and dialogue length strictly according to each block's "tension" (0-100):
   - Low Tension (0-35):
     * 4 to 5 panels per page (mostly "medium" and "small" sizes).
     * Camera: Long shots, Eye-level, calm establishing shots, subtle close-ups.
     * Pacing: Atmospheric environmental descriptions and unhurried, reflective dialogue.
   - Mid Tension (36-70):
     * 4 to 5 panels per page ("medium" and "small" sizes).
     * Camera: Bust-up shots, Over-the-shoulder, Shot-reverse-shot framing.
     * Pacing: Brisk, engaging back-and-forth dialogue and escalating stakes.
   - High Tension (71-100):
     * 2 to 3 panels per page (dominated by "large" and "wide" impact panels).
     * Camera: Extreme close-ups, dramatic Low angle (worm's-eye / aori) or High angle (bird's-eye / fukan), Dutch angles.
     * Pacing: Ultra-short, high-impact dialogue and bold sound effects (SFX).
3. Respect the requested number of pages ("pages": 1 to 3) for each block.
4. Output ONLY valid, raw JSON matching the exact TypeScript schema below. Do NOT wrap in markdown code fences or add explanatory text.
${languageDirective}

SCHEMA:
{
  "pages": [
    {
      "pageNumber": 1,
      "blockType": "ki" | "sho" | "ten" | "ketsu",
      "appliedTension": number,
      "pageSummary": "string",
      "panels": [
        {
          "panelNumber": 1,
          "size": "large" | "medium" | "small" | "wide",
          "camera": "string",
          "composition": "string",
          "dialogues": [
            {
              "character": "string",
              "type": "speech" | "monologue" | "sfx",
              "text": "string"
            }
          ]
        }
      ]
    }
  ]
}`;
}

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  try {
    const body = (await context.request.json()) as GenerateRequestBody;
    const { worldLock, blocks } = body;
    const lang: Language = body.lang === 'ja' ? 'ja' : 'en';

    if (!worldLock || !Array.isArray(blocks) || blocks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request payload: worldLock and blocks are required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const apiKey = context.env?.META_API_KEY?.trim();
    const hasValidApiKey = Boolean(apiKey && apiKey !== 'your_api_key_here');

    // 環境変数 META_API_KEY が未設定（ローカルテスト時など）の場合は言語に応じた動的モックJSONを返す
    if (!hasValidApiKey) {
      const mockResult = buildDynamicMockStoryboard(worldLock, blocks, lang);
      return new Response(JSON.stringify(mockResult), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-StoryDAW-Mode': 'fallback-mock',
        },
      });
    }

    const baseUrl = (context.env.META_BASE_URL || 'https://api.llama.com/v1').replace(/\/+$/, '');
    const model = context.env.META_MODEL || 'muse-spark-1.3';

    const userPrompt = JSON.stringify(
      {
        outputLanguage: lang === 'ja' ? 'Japanese (日本語)' : 'English',
        worldLock,
        blocks: blocks.map((b) => ({
          type: b.type,
          label: b.label,
          pages: b.pages,
          tension: b.tension,
          event: b.event,
          charactersInScene: worldLock.characters
            .filter((c) => b.characterIds.includes(c.id))
            .map((c) => ({ name: c.name, role: c.role, traits: c.traits })),
        })),
      },
      null,
      2
    );

    // Meta Model API (Muse Spark 1.3) 公式仕様: POST ${META_BASE_URL}/responses
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: buildSystemPrompt(lang),
          },
          {
            role: 'user',
            content: `Generate the complete StoryboardResult JSON in ${
              lang === 'ja' ? 'Japanese (日本語)' : 'English'
            } for the following WorldLock and Ki-Sho-Ten-Ketsu blocks:\n${userPrompt}`,
          },
        ],
        temperature: 1,
        max_output_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown API error');
      console.error(`Meta Model API Error (${response.status}):`, errorText);
      const fallbackResult = buildDynamicMockStoryboard(worldLock, blocks, lang);
      return new Response(JSON.stringify(fallbackResult), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-StoryDAW-Mode': 'fallback-after-api-error',
        },
      });
    }

    const data = await response.json();
    const rawText = extractResponseText(data);

    if (!rawText) {
      throw new Error('Empty response text from Meta Model API /responses endpoint.');
    }

    const parsed = parseSafeJson(rawText);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-StoryDAW-Mode': 'meta-muse-api',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
