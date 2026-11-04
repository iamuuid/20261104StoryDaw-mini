import type {
  WorldLock,
  StoryBlock,
  StoryboardResult,
  PageBrief,
  PanelBrief,
  Language,
} from '../../src/types';

// Cloudflare Workers / Pages Functions 共通の環境変数・バインディング型定義
export interface AssetsBinding {
  fetch(request: Request | string): Promise<Response>;
}

export interface Env {
  META_API_KEY?: string;
  META_BASE_URL?: string;
  META_MODEL?: string;
  ASSETS?: AssetsBinding;
}

interface GenerateRequestBody {
  worldLock: WorldLock;
  blocks: StoryBlock[];
  lang?: Language;
}

// Meta Model API (/v1/responses) のレスポンスJSONから安全にテキスト本文を抽出するヘルパー関数
// data.output_text, data.output?.[0]?.content?.[0]?.text, data.choices?.[0]?.message?.content 等すべてに対応
export function extractResponseText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;

  // 1. data.output_text (Responses API のトップレベルテキスト)
  if (typeof obj.output_text === 'string' && obj.output_text.trim()) {
    return obj.output_text;
  }

  // 2. data.output 配列 (data.output?.[0]?.content?.[0]?.text 等)
  if (Array.isArray(obj.output)) {
    const collected: string[] = [];
    for (const item of obj.output) {
      if (!item || typeof item !== 'object') continue;
      const itemObj = item as Record<string, unknown>;

      if (typeof itemObj.text === 'string' && itemObj.text.trim()) {
        collected.push(itemObj.text);
      } else if (typeof itemObj.content === 'string' && itemObj.content.trim()) {
        collected.push(itemObj.content);
      } else if (Array.isArray(itemObj.content)) {
        for (const part of itemObj.content) {
          if (typeof part === 'string' && part.trim()) {
            collected.push(part);
          } else if (part && typeof part === 'object') {
            const partObj = part as Record<string, unknown>;
            if (typeof partObj.text === 'string' && partObj.text.trim()) {
              collected.push(partObj.text);
            } else if (typeof partObj.content === 'string' && partObj.content.trim()) {
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

  // 3. data.output が文字列の場合
  if (typeof obj.output === 'string' && obj.output.trim()) {
    return obj.output;
  }

  // 4. data.choices?.[0]?.message?.content (OpenAI Chat Completions 互換)
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const firstChoice = obj.choices[0] as Record<string, unknown>;
    const msg = firstChoice?.message as Record<string, unknown> | undefined;
    if (msg && typeof msg.content === 'string' && msg.content.trim()) {
      return msg.content;
    }
    if (typeof firstChoice?.text === 'string' && firstChoice.text.trim()) {
      return firstChoice.text;
    }
  }

  // 5. data.completion_message?.content (Llama API 互換)
  if (obj.completion_message && typeof obj.completion_message === 'object') {
    const comp = obj.completion_message as Record<string, unknown>;
    if (typeof comp.content === 'string' && comp.content.trim()) return comp.content;
    if (comp.content && typeof comp.content === 'object') {
      const contentObj = comp.content as Record<string, unknown>;
      if (typeof contentObj.text === 'string' && contentObj.text.trim()) return contentObj.text;
    }
  }

  return '';
}

// Markdownのコードブロック記号（```json や ```）を末尾切れの場合も含めて確実に除去し、最初の { から切り出す関数
function stripCodeFencesAndExtractJsonObject(raw: string): string {
  let cleaned = raw.trim();

  // 完全な ```json ... ``` ブロックがあれば中身を取り出す
  const fullBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fullBlockMatch) {
    cleaned = fullBlockMatch[1].trim();
  } else {
    // 出力が途中で切れて閉じの ``` が無い場合でも先頭・末尾のフェンスを確実に除去
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // 最初の { 以降を抽出
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace !== -1) {
    cleaned = cleaned.slice(firstBrace);
  }

  return cleaned;
}

// JSON文字列内の未エスケープ改行・制御文字をサニタイズし、閉じ括弧前の末尾カンマを除去する関数
function sanitizeJsonStringLiterals(input: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === '\n') {
        result += '\\n';
        continue;
      }
      if (ch === '\r') {
        continue;
      }
      if (ch === '\t') {
        result += '\\t';
        continue;
      }
    }
    result += ch;
  }

  // 閉じ括弧の直前にある不正なカンマ (", }" や ", ]") を除去
  return result.replace(/,\s*([}\]])/g, '$1');
}

// 途中で切れたJSON文字列に対して、開いたままの引用符・オブジェクト・配列（", }, ]）を補完して修復する関数
function closeOpenJsonStructures(fragment: string): string {
  let text = fragment.trim();

  // 末尾がエスケープ用のバックスラッシュ単体で終わっている場合は除去
  if (text.endsWith('\\') && !text.endsWith('\\\\')) {
    text = text.slice(0, -1);
  }

  let inString = false;
  let escaped = false;
  const stack: Array<'}' | ']'> = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') {
        stack.push('}');
      } else if (ch === '[') {
        stack.push(']');
      } else if (ch === '}' || ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ch) {
          stack.pop();
        }
      }
    }
  }

  // 文字列リテラルの途中で切れている場合はまず引用符を閉じる
  if (inString) {
    text += '"';
  }

  // 末尾が不完全なキーやコロン、カンマで終わっている場合を整理
  if (/:\s*$/.test(text)) {
    text += '""';
  }
  text = text.replace(/,\s*"[^"]*"\s*$/, '');
  text = text.replace(/,\s*$/, '');

  // スタックに残っている未閉鎖の括弧を逆順にすべて閉じる
  while (stack.length > 0) {
    text += stack.pop();
  }

  return sanitizeJsonStringLiterals(text);
}

// 取得したStoryboardResultの必須フィールドを検証・補完してフロントでクラッシュしない形に整える関数
function normalizeStoryboardResult(raw: unknown): StoryboardResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.pages) || obj.pages.length === 0) return null;

  const validBlockTypes = new Set(['ki', 'sho', 'ten', 'ketsu']);
  const validSizes = new Set(['large', 'medium', 'small', 'wide']);
  const validDlgTypes = new Set(['speech', 'monologue', 'sfx']);

  const pages: PageBrief[] = obj.pages
    .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
    .map((p, idx) => {
      const rawBlockType = String(p.blockType || 'ki').toLowerCase();
      const blockType = (validBlockTypes.has(rawBlockType) ? rawBlockType : 'ki') as PageBrief['blockType'];
      const rawPanels = Array.isArray(p.panels) ? p.panels : [];

      const panels: PanelBrief[] = rawPanels
        .filter((pn): pn is Record<string, unknown> => Boolean(pn && typeof pn === 'object'))
        .map((pn, pnIdx) => {
          const rawSize = String(pn.size || 'medium').toLowerCase();
          const size = (validSizes.has(rawSize) ? rawSize : 'medium') as PanelBrief['size'];
          const rawDialogues = Array.isArray(pn.dialogues) ? pn.dialogues : [];

          const dialogues = rawDialogues
            .filter((d): d is Record<string, unknown> => Boolean(d && typeof d === 'object'))
            .map((d) => {
              const rawType = String(d.type || 'speech').toLowerCase();
              return {
                character: String(d.character || 'Character'),
                type: (validDlgTypes.has(rawType) ? rawType : 'speech') as
                  | 'speech'
                  | 'monologue'
                  | 'sfx',
                text: String(d.text || ''),
              };
            });

          return {
            panelNumber: Number(pn.panelNumber) || pnIdx + 1,
            size,
            camera: String(pn.camera || 'Medium shot / Eye-level'),
            composition: String(pn.composition || ''),
            dialogues,
          };
        });

      return {
        pageNumber: Number(p.pageNumber) || idx + 1,
        blockType,
        appliedTension:
          typeof p.appliedTension === 'number' ? p.appliedTension : Number(p.appliedTension) || 50,
        pageSummary: String(p.pageSummary || ''),
        panels:
          panels.length > 0
            ? panels
            : [
                {
                  panelNumber: 1,
                  size: 'medium',
                  camera: 'Medium shot / Eye-level',
                  composition: String(p.pageSummary || 'Scene panel'),
                  dialogues: [],
                },
              ],
      };
    });

  return pages.length > 0 ? { pages } : null;
}

// Markdown除去・サニタイズ・末尾切れリペアを組み合わせて安全にJSONをパースする関数
export function parseSafeJson(rawContent: string): StoryboardResult {
  const extracted = stripCodeFencesAndExtractJsonObject(rawContent);
  const sanitized = sanitizeJsonStringLiterals(extracted);

  // 1. まずはそのまま（または最後の } までで）パースを試行
  const candidates: string[] = [sanitized];
  const lastBrace = sanitized.lastIndexOf('}');
  if (lastBrace > 0 && lastBrace < sanitized.length - 1) {
    candidates.push(sanitized.slice(0, lastBrace + 1));
  }

  // 2. 末尾切れ補完リペア版を追加
  candidates.push(closeOpenJsonStructures(sanitized));

  // 3. 途中で配列要素が壊れている場合に備え、後ろの `}` から段階的に巻き戻してリペアを試行
  let searchPos = sanitized.length;
  for (let attempt = 0; attempt < 12; attempt++) {
    const prevCloseBrace = sanitized.lastIndexOf('}', searchPos - 1);
    if (prevCloseBrace <= 0) break;
    candidates.push(closeOpenJsonStructures(sanitized.slice(0, prevCloseBrace + 1)));
    searchPos = prevCloseBrace;
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const normalized = normalizeStoryboardResult(parsed);
      if (normalized) {
        return normalized;
      }
    } catch {
      // 次の修復候補を試行
    }
  }

  throw new Error('Unable to parse or repair JSON response from model.');
}

// META_API_KEY 未設定時やフォールバック時に、現在入力されている最新の WorldLock と各ブロックの Tension / Event / Pages / 言語設定(lang) を
// 100%反映して動的にネーム指示書を組み立てる関数（プリセット固有の固定文言は一切含めない）
export function buildDynamicMockStoryboard(
  worldLock: WorldLock,
  blocks: StoryBlock[],
  lang: Language = 'en'
): StoryboardResult {
  const pages: PageBrief[] = [];
  let currentPageNumber = 1;
  const isJa = lang === 'ja';

  const workTitle =
    worldLock.title?.trim() || (isJa ? '無題プロジェクト' : 'Untitled Project');
  const workSetting =
    worldLock.setting?.trim() ||
    (isJa ? '物語の舞台となる空間' : 'The primary setting of the story');
  const workTheme =
    worldLock.theme?.trim() || (isJa ? '登場人物たちの葛藤と選択' : 'Core character conflict and choice');

  const validCharacters = (worldLock.characters || []).filter(
    (c) => c.name?.trim() || c.role?.trim() || c.traits?.trim()
  );

  for (const block of blocks) {
    const pageCount = Math.max(1, Math.min(3, Number(block.pages) || 1));
    const tension = Math.max(0, Math.min(100, Number(block.tension) || 0));
    const sceneEvent =
      block.event?.trim() ||
      (isJa
        ? `${block.label || block.type.toUpperCase()}の重要シーンが展開する。`
        : `Key scene unfolding in ${block.label || block.type.toUpperCase()}.`);

    // ブロックにチェックされた登場キャラクターを取得（未選択時は登録キャラ全体から補完）
    const checkedChars = validCharacters.filter((c) => block.characterIds.includes(c.id));
    const sceneChars = checkedChars.length > 0 ? checkedChars : validCharacters;

    const primaryChar = sceneChars[0] || {
      id: 'default-1',
      name: isJa ? '主人公' : 'Protagonist',
      role: isJa ? '中心人物' : 'Lead character',
      traits: isJa ? '強い意志を持つ' : 'Determined expression',
    };
    const secondaryChar = sceneChars[1] || sceneChars[0] || primaryChar;

    const pName = primaryChar.name?.trim() || (isJa ? 'キャラA' : 'Character A');
    const pRole = primaryChar.role?.trim() || (isJa ? '主要人物' : 'Main role');
    const pTraits = primaryChar.traits?.trim() || (isJa ? '印象的な佇まい' : 'Distinctive presence');

    const sName = secondaryChar.name?.trim() || pName;
    const sTraits = secondaryChar.traits?.trim() || pTraits;

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
          pageSummary = `【低緊張：${tension}/100】『${workTitle}』の空気感と情景を丁寧に描く静かな構成${pageSuffix}。出来事：${sceneEvent}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'ロングショット ／ アイレベル（舞台状況の引き画）',
              composition: `舞台設定「${workSetting}」の全景。テーマ「${workTheme}」を感じさせる穏やかな空気感の中、場面が始まる。`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'スゥ……（静かな環境音）' },
                {
                  character: pName,
                  type: 'monologue',
                  text: `${workTheme}——この場所で、また新しい時間が動き出す。`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'クローズアップ ／ 手元・表情のディテール',
              composition: `${pName}（${pRole}）の細やかな仕草。特徴（${pTraits}）が自然に表れる落ち着いたカット。`,
              dialogues: [{ character: 'SFX', type: 'sfx', text: 'コトン……（小さな物音）' }],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'ミディアムショット ／ アイレベル',
              composition: `【場面の出来事】${sceneEvent} ${pName}と${sName}が余白のある構図で向き合う。`,
              dialogues: [
                {
                  character: sName,
                  type: 'speech',
                  text: `${sceneEvent.slice(0, 45)}${sceneEvent.length > 45 ? '……' : ''}`,
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'small',
              camera: 'ミディアム・クローズアップ ／ 横顔',
              composition: `${sName}（${sTraits}）の様子を受け止め、${pName}が静かに応じる。`,
              dialogues: [
                {
                  character: pName,
                  type: 'speech',
                  text: '……そうだな。まずは落ち着いて状況を見極めよう。',
                },
              ],
            },
          ];

          if (isVeryCalm) {
            panels.push({
              panelNumber: 5,
              size: 'small',
              camera: 'ロングショット ／ ややハイアングル（余韻の引き）',
              composition: `「${workSetting}」の静かな風景へカメラが引き、「${sceneEvent}」の余韻を残す。`,
              dialogues: [
                {
                  character: sName,
                  type: 'monologue',
                  text: '静かだけれど、確かな変化が始まっている……。',
                },
              ],
            });
          }
        } else {
          pageSummary = `[Low Tension: ${tension}/100] Calm, atmospheric pacing for "${workTitle}"${pageSuffix}. Scene beat: ${sceneEvent}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'Long shot / Eye-level',
              composition: `Wide establishing view of the setting: "${workSetting}". Subtle environmental details reflect the theme: "${workTheme}".`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'SHH... (Quiet ambient atmosphere)' },
                {
                  character: pName,
                  type: 'monologue',
                  text: `${workTheme}... Everything begins quietly here.`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'Close-up / Eye-level',
              composition: `Close detail shot capturing ${pName} (${pRole}) and their traits (${pTraits}).`,
              dialogues: [{ character: 'SFX', type: 'sfx', text: 'TAP... (Subtle movement)' }],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'Medium shot / Eye-level',
              composition: `[Scene Event] ${sceneEvent} ${pName} and ${sName} share the frame with calm negative space.`,
              dialogues: [
                {
                  character: sName,
                  type: 'speech',
                  text: `${sceneEvent}`,
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'small',
              camera: 'Medium close-up / Eye-level',
              composition: `${pName} observes ${sName} (${sTraits}) and responds with measured calm.`,
              dialogues: [
                {
                  character: pName,
                  type: 'speech',
                  text: `Let's take this one step at a time.`,
                },
              ],
            },
          ];

          if (isVeryCalm) {
            panels.push({
              panelNumber: 5,
              size: 'small',
              camera: 'Long shot / High angle',
              composition: `Lingering wide shot over "${workSetting}" after: ${sceneEvent}`,
              dialogues: [
                {
                  character: sName,
                  type: 'monologue',
                  text: `A quiet turning point has begun.`,
                },
              ],
            });
          }
        }
      } else if (tension <= 70) {
        // Mid Tension (36-70): 4〜5コマ、バストアップや切り返し構図、テンポの良い対話
        if (isJa) {
          pageSummary = `【中緊張：${tension}/100】『${workTitle}』の展開が加速するバストアップ＆切り返し構成${pageSuffix}。出来事：${sceneEvent}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'ミディアムショット ／ 肩越し（オーバー・ザ・ショルダー）',
              composition: `舞台「${workSetting}」の中で事態が動く。${pName}の肩越しに捉える核心シーン：${sceneEvent}`,
              dialogues: [
                {
                  character: pName,
                  type: 'speech',
                  text: `状況が変わったぞ——「${sceneEvent.slice(0, 35)}${sceneEvent.length > 35 ? '…' : ''}」`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'ハイアングル（状況変化の俯瞰カット）',
              composition: `周囲の空気が一気に張り詰め、「${workTheme}」をめぐる緊張が高まる。`,
              dialogues: [{ character: 'SFX', type: 'sfx', text: 'ザワッ……！（緊迫する空気）' }],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'バストアップ ／ 切り返し構図（ショット・リバース・ショット）',
              composition: `${sName}（${sTraits}）の緊迫した表情と、${pName}（${pTraits}）の鋭い視線をテンポ良く切り返す。`,
              dialogues: [
                {
                  character: sName,
                  type: 'speech',
                  text: 'このままでは引き返せません……どう動きますか！？',
                },
                {
                  character: pName,
                  type: 'speech',
                  text: '迷っている暇はない。正面から 돌파（突破）するぞ。',
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'medium',
              camera: 'クローズアップ ／ ややローアングル',
              composition: `「${sceneEvent}」の渦中で決断を下す${pName}の力強いアップ。`,
              dialogues: [
                {
                  character: pName,
                  type: 'monologue',
                  text: `${workTheme}——その答えをここで証明する。`,
                },
              ],
            },
          ];
        } else {
          pageSummary = `[Mid Tension: ${tension}/100] Brisk conversational pacing & shot-reverse-shot framing for "${workTitle}"${pageSuffix}. Scene beat: ${sceneEvent}`;
          panels = [
            {
              panelNumber: 1,
              size: 'medium',
              camera: 'Medium shot / Over-the-shoulder',
              composition: `Within "${workSetting}", the situation escalates over ${pName}'s shoulder: ${sceneEvent}`,
              dialogues: [
                {
                  character: pName,
                  type: 'speech',
                  text: `Look closely—things are moving fast now.`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'small',
              camera: 'High angle / Tracking shot',
              composition: `Stakes rise around "${workTheme}" as the environment reacts to: ${sceneEvent}`,
              dialogues: [{ character: 'SFX', type: 'sfx', text: 'RUSTLE—TENSION RISING!' }],
            },
            {
              panelNumber: 3,
              size: 'medium',
              camera: 'Shot-reverse-shot / Bust-up',
              composition: `Rapid cut between ${sName} (${sTraits}) and ${pName} (${pTraits}) in tight bust-up framing.`,
              dialogues: [
                {
                  character: sName,
                  type: 'speech',
                  text: `${sceneEvent}`,
                },
                {
                  character: pName,
                  type: 'speech',
                  text: `We don't back down. Stay with me.`,
                },
              ],
            },
            {
              panelNumber: 4,
              size: 'medium',
              camera: 'Close-up / Slight low angle',
              composition: `${pName} (${pRole}) locks eyes on the objective with unwavering resolve.`,
              dialogues: [
                {
                  character: pName,
                  type: 'monologue',
                  text: `This is where "${workTheme}" is put to the test.`,
                },
              ],
            },
          ];
        }
      } else {
        // High Tension (71-100): 2〜3コマ (large/wideの大ゴマ中心)、Extreme close-upやLow/High angle（アオリ・俯瞰）、セリフは極限まで短くインパクト重視
        const isExtremeClimax = tension >= 92;
        if (isJa) {
          pageSummary = `【高緊張：${tension}/100】『${workTitle}』最高潮の大ゴマ（Wide/Large）＆アオリ演出${pageSuffix}！出来事：${sceneEvent}`;
          panels = [
            {
              panelNumber: 1,
              size: 'wide',
              camera: 'ローアングル（強烈なアオリ構図）',
              composition: `ページ横ぶち抜きの特大インパクトコマ！舞台「${workSetting}」で炸裂する決定的な瞬間：${sceneEvent}`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'ドゴォォォォン！！（激しい衝撃音）' },
                {
                  character: pName,
                  type: 'speech',
                  text: '今だッ！！行くぞ！！',
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'large',
              camera: 'エクストリーム・クローズアップ ／ 斜め構図（ダッチアングル）',
              composition: `「${sceneEvent}」のまっただ中、${pName}（${pTraits}）と${sName}の気迫がぶつかり合う超アップ！`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'バチィィッ！！' },
                {
                  character: sName,
                  type: 'monologue',
                  text: `${workTheme}——すべてがこの一瞬に懸かっている……！`,
                },
              ],
            },
          ];

          if (!isExtremeClimax) {
            panels.push({
              panelNumber: 3,
              size: 'medium',
              camera: '急角度ハイアングル（大俯瞰ショット）',
              composition: `激しい動きの直後、「${workSetting}」の中心で立ち向かう${pName}と${sName}のダイナミックな引き画。`,
              dialogues: [
                {
                  character: pName,
                  type: 'speech',
                  text: '……絶対に譲らない！',
                },
              ],
            });
          }
        } else {
          pageSummary = `[High Tension: ${tension}/100] Explosive climax layout for "${workTitle}" with dominant large/wide panels${pageSuffix}! Scene beat: ${sceneEvent}`;
          panels = [
            {
              panelNumber: 1,
              size: 'wide',
              camera: 'Low angle / Worm’s-eye view (Dramatic Aori)',
              composition: `Full-bleed horizontal impact panel in "${workSetting}"! Peak action: ${sceneEvent}`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'BOOOOOOM—CRASH!!' },
                {
                  character: pName,
                  type: 'speech',
                  text: `NOW!! Move!`,
                },
              ],
            },
            {
              panelNumber: 2,
              size: 'large',
              camera: 'Extreme close-up / Dutch angle',
              composition: `Intense close-up on ${pName} (${pTraits}) and ${sName} at the climax of: ${sceneEvent}`,
              dialogues: [
                { character: 'SFX', type: 'sfx', text: 'FLASH—IMPACT!!' },
                {
                  character: sName,
                  type: 'monologue',
                  text: `${workTheme}—everything comes down to this instant!`,
                },
              ],
            },
          ];

          if (!isExtremeClimax) {
            panels.push({
              panelNumber: 3,
              size: 'medium',
              camera: 'High angle / Steep bird’s-eye (Fukan)',
              composition: `Dynamic overhead view across "${workSetting}" as ${pName} and ${sName} hold their ground.`,
              dialogues: [
                {
                  character: pName,
                  type: 'speech',
                  text: `We finish this here!`,
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
export function buildSystemPrompt(lang: Language = 'en'): string {
  const languageDirective =
    lang === 'ja'
      ? `5. LANGUAGE REQUIREMENT: Output all descriptive fields ("pageSummary", "camera", "composition", "dialogues[].character", and "dialogues[].text") in natural, concise JAPANESE suitable for a professional manga storyboard ("漫画のネーム指示書"). Keep each panel composition concise (1-2 sentences) so the entire JSON fits well within token limits. Keep JSON keys and enum values ("blockType", "size", "type") in exact English as specified in the schema.`
      : `5. LANGUAGE REQUIREMENT: Output all descriptive fields ("pageSummary", "camera", "composition", "dialogues[].character", and "dialogues[].text") in clear, concise ENGLISH (1-2 sentences per panel composition).`;

  return `You are a professional manga storyboard director ("Name" / ネーム architect) for StoryDAW Mini.
Your job is to generate a structured, text-only manga storyboard brief in pure JSON format based strictly on the user's provided "worldLock" (title, setting, theme, characters) and "blocks" (Ki-Sho-Ten-Ketsu story beats and tension 0-100).

STRICT RULES:
1. Base EVERY page summary, panel composition, camera angle, and dialogue line 100% on the user's current "worldLock" and each block's "event". Never use unrelated default stories.
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
  let parsedBody: GenerateRequestBody | null = null;

  try {
    parsedBody = (await context.request.json()) as GenerateRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON request body.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { worldLock, blocks } = parsedBody;
  const lang: Language = parsedBody.lang === 'ja' ? 'ja' : 'en';

  if (!worldLock || !Array.isArray(blocks) || blocks.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid request payload: worldLock and blocks are required.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const apiKey = context.env?.META_API_KEY?.trim();
    const hasValidApiKey = Boolean(apiKey && apiKey !== 'your_api_key_here');

    // 環境変数 META_API_KEY が未設定（ローカルテスト時など）の場合は、最新のworldLockとblocksを反映した動的モックJSONを返す
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

    // 公式cURL仕様: デフォルト baseUrl = https://api.meta.ai/v1, デフォルト model = muse-spark-1.3
    const baseUrl = (context.env.META_BASE_URL || 'https://api.meta.ai/v1').replace(/\/+$/, '');
    const model = context.env.META_MODEL || 'muse-spark-1.3';

    // 各ブロックで登場キャラのチェックが外れている場合でも、worldLock.characters 全体を参照できるよう補完
    const allDefinedCharacters = (worldLock.characters || []).map((c) => ({
      name: c.name,
      role: c.role,
      traits: c.traits,
    }));

    const userPrompt = JSON.stringify(
      {
        outputLanguage: lang === 'ja' ? 'Japanese (日本語)' : 'English',
        worldLock: {
          title: worldLock.title,
          setting: worldLock.setting,
          theme: worldLock.theme,
          characters: allDefinedCharacters,
        },
        blocks: blocks.map((b) => {
          const selectedChars = (worldLock.characters || [])
            .filter((c) => b.characterIds.includes(c.id))
            .map((c) => ({ name: c.name, role: c.role, traits: c.traits }));
          return {
            type: b.type,
            label: b.label,
            pages: b.pages,
            tension: b.tension,
            event: b.event,
            charactersInScene: selectedChars.length > 0 ? selectedChars : allDefinedCharacters,
          };
        }),
      },
      null,
      2
    );

    const requestMessages = [
      {
        role: 'system',
        content: buildSystemPrompt(lang),
      },
      {
        role: 'user',
        content: `Generate the complete StoryboardResult JSON in ${
          lang === 'ja' ? 'Japanese (日本語)' : 'English'
        } strictly reflecting the following user-edited WorldLock and Ki-Sho-Ten-Ketsu blocks:\n${userPrompt}`,
      },
    ];

    // まず max_output_tokens: 8192 でリクエストし、もしモデルの上限等で400エラーが返った場合は 4096 で自動再試行
    let response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: requestMessages,
        temperature: 0.7,
        max_output_tokens: 8192,
      }),
    });

    if (!response.ok && response.status === 400) {
      response = await fetch(`${baseUrl}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: requestMessages,
          temperature: 0.7,
          max_output_tokens: 4096,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown API error');
      console.error(`Meta Model API Error (${response.status}):`, errorText);
      const fallbackResult = buildDynamicMockStoryboard(worldLock, blocks, lang);
      return new Response(JSON.stringify(fallbackResult), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-StoryDAW-Mode': 'fallback-after-api-error',
          'X-StoryDAW-Error': encodeURIComponent(`API status ${response.status}`),
        },
      });
    }

    const data = await response.json();
    const rawText = extractResponseText(data);

    if (!rawText) {
      console.error('Empty response text from Meta Model API /responses endpoint.');
      const fallbackResult = buildDynamicMockStoryboard(worldLock, blocks, lang);
      return new Response(JSON.stringify(fallbackResult), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-StoryDAW-Mode': 'fallback-after-empty-response',
        },
      });
    }

    // JSONパース＆自動リペアを試行し、万一修復不可能な場合でも500で停止させず最新の入力内容を反映したフォールバックを返す
    try {
      const parsed = parseSafeJson(rawText);
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-StoryDAW-Mode': 'meta-muse-api',
        },
      });
    } catch (parseErr) {
      const reason = parseErr instanceof Error ? parseErr.message : 'JSON parse error';
      console.error('JSON Parse & Repair failed, returning dynamic fallback:', reason);
      const fallbackResult = buildDynamicMockStoryboard(worldLock, blocks, lang);
      return new Response(JSON.stringify(fallbackResult), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-StoryDAW-Mode': 'fallback-after-parse-error',
          'X-StoryDAW-Error': encodeURIComponent(reason),
        },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unexpected error in /api/generate, returning fallback:', message);
    const fallbackResult = buildDynamicMockStoryboard(worldLock, blocks, lang);
    return new Response(JSON.stringify(fallbackResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-StoryDAW-Mode': 'fallback-after-exception',
        'X-StoryDAW-Error': encodeURIComponent(message),
      },
    });
  }
};
