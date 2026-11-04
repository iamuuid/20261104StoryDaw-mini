import React, { useState, useEffect, useRef } from 'react';
import {
  WorldLock,
  StoryBlock,
  StoryboardResult,
  Character,
  PanelBrief,
  Dialogue,
  Language,
  BlockType,
} from './types';
import { getPresetByLang } from './presetData';

const STORAGE_KEY = 'storydaw_mini_state_v3';

// 英語 (en) / 日本語 (ja) のUIラベル辞書
const UI_DICT = {
  en: {
    subtitle:
      'Visual Story Structure & Text-Only Manga Storyboard Designer powered by Meta Muse',
    newBlank: 'NEW BLANK',
    confirmNewBlank: 'Clear all inputs and start a new blank project?',
    resetPreset: 'Reset to Preset',
    saveLocal: 'Save to Local',
    exportJson: 'Export JSON',
    worldLockHeader: 'WORLD LOCK (FIXED CONSTANTS)',
    worldLockSub: 'Locked Constants for AI',
    immutableBadge: 'Immutable',
    projectTitle: 'PROJECT TITLE',
    projectTitlePlaceholder: 'Enter project title...',
    worldSetting: 'WORLD SETTING',
    worldSettingPlaceholder: 'Describe world setting, era, and rules...',
    coreTheme: 'CORE THEME',
    coreThemePlaceholder: 'Describe central theme or emotional core...',
    lockedCharacters: 'LOCKED CHARACTERS',
    addCharacter: '+ ADD CHARACTER',
    removeChar: 'Remove',
    charName: 'Name',
    charNamePlaceholder: 'Character name...',
    charRole: 'Role',
    charRolePlaceholder: 'Role in the story...',
    charTraits: 'Traits & Speech Pattern',
    charTraitsPlaceholder: 'Personality, visual traits, speech style...',
    noCharactersHint: 'No characters added yet. Click "+ ADD CHARACTER" above.',
    timelineHeader: 'KI-SHO-TEN-KETSU & TENSION CURVE',
    timelineSub: 'DAW Automation Lane — Controls Panel Density & Camera',
    tracksBadge: '4 Tracks',
    tensionCurveTitle: 'TENSION CURVE (REAL-TIME)',
    tensionCurveRule: 'High(>70): Large | Low(≤35): 4-5 Calm',
    tensionLabel: 'TENSION',
    pagesLabel: 'Pages',
    sceneEvent: 'SCENE EVENT / PLOT BEAT',
    sceneEventPlaceholder: 'Describe what happens in this block...',
    charactersInScene: 'CHARACTERS IN SCENE',
    generateBtn: '▶ GENERATE STORYBOARD BRIEF (META MUSE API)',
    generatingBtn: 'Generating Storyboard Brief...',
    viewerHeader: 'STORYBOARD BRIEF VIEWER (TEXT-ONLY BLUEPRINT)',
    viewerSubPrefix: 'Engine:',
    viewerSubSuffix: '— Inline Editable',
    showDiff: 'SHOW DIFF (BEFORE / AFTER)',
    allPages: 'All Pages',
    presetReadyTitle: 'Preset Loaded — Ready to Generate',
    presetReadyBody:
      '[Preset Loaded] Click the "▶ GENERATE STORYBOARD BRIEF (META MUSE API)" button below to automatically generate a 4-page storyboard brief linked to your World Lock and Tension Curve.',
    emptyViewerTitle: 'Blank Storyboard Canvas',
    emptyViewerBody:
      'Fill in the World Lock (left column) and Ki-Sho-Ten-Ketsu tracks (center column), then click "▶ GENERATE STORYBOARD BRIEF (META MUSE API)" to generate your storyboard blueprint.',
    diffWaitingTitle: 'Diff View Ready — Waiting for Regeneration',
    diffWaitingBody:
      'Adjust any block’s Tension slider in the center column and click "GENERATE STORYBOARD BRIEF (META MUSE API)" to compare Before vs. After panel counts, sizes, camera angles, and dialogue side-by-side.',
    pageSummaryLabel: 'Summary:',
    diffBannerTitle: '⚡ Before / After Structural Diff',
    panelsUnit: 'Panels',
    cameraAngle: 'CAMERA ANGLE',
    compositionAction: 'COMPOSITION & ACTION',
    dialoguesSfx: 'DIALOGUES & SFX',
    addLine: '+ Line',
    speechType: 'Speech',
    monoType: 'Mono',
    sfxType: 'SFX',
  },
  ja: {
    subtitle:
      'Meta Muse 搭載 — 物語構造（起承転結・緊張度）＆ 文字コンテ（ネーム指示書）設計ツール',
    newBlank: '新規作成',
    confirmNewBlank: '入力内容をクリアして新規作成しますか？',
    resetPreset: 'プリセットに戻す',
    saveLocal: 'ローカル保存',
    exportJson: 'JSON出力',
    worldLockHeader: '世界観ロック（AI変更不可の固定設定）',
    worldLockSub: 'AIが改変しない絶対ルール',
    immutableBadge: '固定定数',
    projectTitle: '作品タイトル',
    projectTitlePlaceholder: '作品タイトルを入力...',
    worldSetting: '舞台・世界観設定',
    worldSettingPlaceholder: '時代背景、舞台、世界のルールなどを入力...',
    coreTheme: '物語の軸・テーマ',
    coreThemePlaceholder: '物語を貫くテーマや描きたい感情を入力...',
    lockedCharacters: '固定キャラクター',
    addCharacter: '+ キャラ追加',
    removeChar: '削除',
    charName: '名前',
    charNamePlaceholder: 'キャラクター名を入力...',
    charRole: '役割・立場',
    charRolePlaceholder: '主人公、相棒、敵役など...',
    charTraits: '特徴・口調・外見',
    charTraitsPlaceholder: '性格、口調、外見の特徴などを入力...',
    noCharactersHint: 'キャラクターが未登録です。「+ キャラ追加」から追加できます。',
    timelineHeader: '起承転結ブロック ＆ 緊張度グラフ',
    timelineSub: 'DAWオートメーション — コマ数・サイズ・カメラを自動制御',
    tracksBadge: '全4トラック',
    tensionCurveTitle: '緊張度カーブ（リアルタイム連動）',
    tensionCurveRule: '高(>70): 大ゴマ2-3 ｜ 低(≤35): 情景4-5コマ',
    tensionLabel: '緊張度 (TENSION)',
    pagesLabel: 'ページ数',
    sceneEvent: 'この場面で起きる出来事',
    sceneEventPlaceholder: 'このパートで起きる出来事・プロットを入力...',
    charactersInScene: '登場キャラ',
    generateBtn: '▶ ネーム指示書を生成（Meta Muse API）',
    generatingBtn: 'ネーム指示書を生成中...',
    viewerHeader: 'ネーム指示書ビューア（文字コンテ設計図）',
    viewerSubPrefix: '生成エンジン:',
    viewerSubSuffix: '— 全項目クリックで直接編集可能',
    showDiff: '前後比較（Diff表示）',
    allPages: '全ページ表示',
    presetReadyTitle: 'プリセット読込完了（未生成）',
    presetReadyBody:
      '【プリセット読込完了】下の「▶ ネーム指示書を生成 (META MUSE API)」ボタンを押すと、世界観とテンションカーブに連動した4ページのネーム指示書が自動生成されます。',
    emptyViewerTitle: '新規キャンバス（未生成）',
    emptyViewerBody:
      '左カラム（世界観ロック）と中央カラム（起承転結トラック）を入力し、下の「▶ ネーム指示書を生成（Meta Muse API）」ボタンを押してください。',
    diffWaitingTitle: '前後比較（Diff）待機中 — 再生成すると比較が表示されます',
    diffWaitingBody:
      '中央カラムの緊張度（Tension）スライダーを変更し、「ネーム指示書を生成（Meta Muse API）」ボタンを押すと、変更前後のコマ数・サイズ・構図・セリフの変化を並べて比較できます。',
    pageSummaryLabel: 'ページ演出要約:',
    diffBannerTitle: '⚡ 再生成前後の構造比較（Before / After Diff）',
    panelsUnit: 'コマ',
    cameraAngle: 'カメラアングル',
    compositionAction: '構図・キャラの演技指示',
    dialoguesSfx: 'セリフ・効果音（SFX）',
    addLine: '+ セリフ追加',
    speechType: '通常セリフ',
    monoType: 'モノローグ',
    sfxType: '効果音(SFX)',
  },
} as const;

// 新規作成（ブランク）用の初期起承転結トラック生成ヘルパー（標準Tension: 20, 50, 80, 30）
function createBlankBlocks(lang: Language): StoryBlock[] {
  return [
    {
      id: 'block-ki',
      type: 'ki',
      label: lang === 'ja' ? '起（導入）' : 'Ki (Intro)',
      pages: 1,
      tension: 20,
      event: '',
      characterIds: [],
    },
    {
      id: 'block-sho',
      type: 'sho',
      label: lang === 'ja' ? '承（展開）' : 'Sho (Development)',
      pages: 1,
      tension: 50,
      event: '',
      characterIds: [],
    },
    {
      id: 'block-ten',
      type: 'ten',
      label: lang === 'ja' ? '転（山場・転換）' : 'Ten (Climax)',
      pages: 1,
      tension: 80,
      event: '',
      characterIds: [],
    },
    {
      id: 'block-ketsu',
      type: 'ketsu',
      label: lang === 'ja' ? '結（結末・余韻）' : 'Ketsu (Resolution)',
      pages: 1,
      tension: 30,
      event: '',
      characterIds: [],
    },
  ];
}

// 起承転結トラックの言語別見出し生成ヘルパー
function getTrackHeaderLabel(index: number, type: BlockType, lang: Language): string {
  if (lang === 'ja') {
    const mapJa: Record<BlockType, string> = {
      ki: '起（導入）',
      sho: '承（展開）',
      ten: '転（山場・転換）',
      ketsu: '結（結末・余韻）',
    };
    return `トラック${index + 1}: ${mapJa[type]}`;
  }
  const mapEn: Record<BlockType, string> = {
    ki: 'KI (Intro)',
    sho: 'SHO (Development)',
    ten: 'TEN (Climax)',
    ketsu: 'KETSU (Resolution)',
  };
  return `TRACK ${index + 1}: ${mapEn[type]}`;
}

// ページ切り替えタブおよびページヘッダー用の短いフェーズ表記
function getBlockShortLabel(type: BlockType, lang: Language): string {
  if (lang === 'ja') {
    const mapJa: Record<BlockType, string> = {
      ki: '起',
      sho: '承',
      ten: '転',
      ketsu: '結',
    };
    return `${type.toUpperCase()}/${mapJa[type]}`;
  }
  return type.toUpperCase();
}

// Tension値に応じた演出モード名を返すヘルパー関数
function getTensionTierLabel(tension: number, lang: Language): string {
  if (lang === 'ja') {
    if (tension <= 35) return '低 (4-5コマ / 情景・静寂)';
    if (tension <= 70) return '中 (4-5コマ / 対話・切り返し)';
    return '高 (2-3コマ / 大ゴマ・迫力)';
  }
  if (tension <= 35) return 'LOW (4-5 Panels / Calm)';
  if (tension <= 70) return 'MID (4-5 Panels / Dialogue)';
  return 'HIGH (2-3 Panels / Impact)';
}

export function App() {
  // 言語状態（初期値はテスト・確認しやすいよう 'ja'）
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lang === 'en' || parsed.lang === 'ja') return parsed.lang;
      }
    } catch {
      // 無視
    }
    return 'ja';
  });

  // ユーザーがプリセットからテキスト等を編集したかどうかを追跡（言語切替時に編集内容が上書きされるのを防ぐ）
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.hasUserEdited === 'boolean') return parsed.hasUserEdited;
      }
    } catch {
      // 無視
    }
    return false;
  });

  // 世界観設定（World Lock）の状態管理
  const [worldLock, setWorldLock] = useState<WorldLock>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.worldLock) return parsed.worldLock;
      }
    } catch {
      // パース失敗時は初期言語プリセットを使用
    }
    return getPresetByLang('ja').worldLock;
  });

  // 起承転結ブロック（Ki-Sho-Ten-Ketsu）の状態管理
  const [blocks, setBlocks] = useState<StoryBlock[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.blocks) && parsed.blocks.length > 0) return parsed.blocks;
      }
    } catch {
      // パース失敗時は初期言語プリセットを使用
    }
    return getPresetByLang('ja').blocks;
  });

  // 現在表示中のネーム指示書（StoryboardResult）の状態管理（初期表示は未生成の { pages: [] }）
  const [storyboard, setStoryboard] = useState<StoryboardResult>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.storyboard?.pages)) return parsed.storyboard;
      }
    } catch {
      // パース失敗時は未生成状態を使用
    }
    return { pages: [] };
  });

  // 再生成前後の比較（Diff View）用に直前のStoryboardを保持
  const [previousStoryboard, setPreviousStoryboard] = useState<StoryboardResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.previousStoryboard?.pages) return parsed.previousStoryboard;
      }
    } catch {
      // 無視
    }
    return null;
  });

  // GENERATEボタン押下時に常に最新の入力Stateを参照するためのRef（プリセット編集時・新規作成時共通）
  const latestWorldLockRef = useRef<WorldLock>(worldLock);
  const latestBlocksRef = useRef<StoryBlock[]>(blocks);
  const latestLangRef = useRef<Language>(lang);

  latestWorldLockRef.current = worldLock;
  latestBlocksRef.current = blocks;
  latestLangRef.current = lang;

  // UI状態の管理（デフォルトは1ページ目=インデックス0を表示）
  const [activePageTab, setActivePageTab] = useState<number | 'all'>(0);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('準備完了 — プリセット読込済（未生成）');
  const [generationMode, setGenerationMode] = useState<string>('Standby (未生成)');

  const t = UI_DICT[lang];

  // ページ数が減少した際に選択中タブが範囲外にならないよう補正
  useEffect(() => {
    if (
      activePageTab !== 'all' &&
      storyboard.pages.length > 0 &&
      activePageTab >= storyboard.pages.length
    ) {
      setActivePageTab(0);
    }
  }, [storyboard.pages.length, activePageTab]);

  // 状態変更時にlocalStorageへ自動保存するエフェクト
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lang,
          hasUserEdited,
          worldLock,
          blocks,
          storyboard,
          previousStoryboard,
        })
      );
    } catch {
      // localStorage容量制限等は無視
    }
  }, [lang, hasUserEdited, worldLock, blocks, storyboard, previousStoryboard]);

  // WorldLockのトップレベルフィールド（title, setting, theme）更新ハンドラ
  const handleUpdateWorldField = (field: 'title' | 'setting' | 'theme', value: string) => {
    setHasUserEdited(true);
    setWorldLock((prev) => {
      const next = { ...prev, [field]: value };
      latestWorldLockRef.current = next;
      return next;
    });
  };

  // 言語切り替えハンドラ（未編集の初期プリセット状態の時のみ、プリセットの言語を切り替える）
  const handleSwitchLanguage = (nextLang: Language) => {
    if (nextLang === lang) return;
    setLang(nextLang);
    latestLangRef.current = nextLang;

    if (!hasUserEdited) {
      const targetPreset = getPresetByLang(nextLang);
      setWorldLock(targetPreset.worldLock);
      latestWorldLockRef.current = targetPreset.worldLock;

      setBlocks((prevBlocks) => {
        const nextBlocks = prevBlocks.map((b) => {
          const matchedPresetBlock = targetPreset.blocks.find((pb) => pb.type === b.type);
          if (!matchedPresetBlock) return b;
          return {
            ...b,
            label: matchedPresetBlock.label,
            event: matchedPresetBlock.event,
          };
        });
        latestBlocksRef.current = nextBlocks;
        return nextBlocks;
      });
    }

    setStatusMessage(
      nextLang === 'ja'
        ? '表示言語を「日本語」に切り替えました'
        : 'Switched language to English (EN)'
    );
  };

  // 新規作成（すべての入力とプレビューを空にクリアする）ハンドラ
  const handleNewBlank = () => {
    if (!window.confirm(t.confirmNewBlank)) {
      return;
    }

    const defaultCharId = `char-${Date.now()}`;
    const blankWorldLock: WorldLock = {
      title: '',
      setting: '',
      theme: '',
      characters: [
        {
          id: defaultCharId,
          name: '',
          role: '',
          traits: '',
        },
      ],
    };
    const blankBlocks = createBlankBlocks(lang);

    setHasUserEdited(true);
    setWorldLock(blankWorldLock);
    latestWorldLockRef.current = blankWorldLock;
    setBlocks(blankBlocks);
    latestBlocksRef.current = blankBlocks;
    setPreviousStoryboard(null);
    setStoryboard({ pages: [] });
    setActivePageTab(0);
    setShowDiff(false);
    setGenerationMode(lang === 'ja' ? '未生成（新規キャンバス）' : 'Blank Canvas');
    setStatusMessage(
      lang === 'ja'
        ? '入力内容をクリアして新規作成モードにしました'
        : 'Cleared all fields — Ready for new story'
    );
  };

  // 手動でLocalStorageに保存するハンドラ
  const handleSaveToLocal = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lang: latestLangRef.current,
          hasUserEdited,
          worldLock: latestWorldLockRef.current,
          blocks: latestBlocksRef.current,
          storyboard,
          previousStoryboard,
        })
      );
      setStatusMessage(
        lang === 'ja'
          ? `ローカルに保存しました (${new Date().toLocaleTimeString()})`
          : `Saved to localStorage (${new Date().toLocaleTimeString()})`
      );
    } catch {
      setStatusMessage(
        lang === 'ja' ? 'ローカル保存に失敗しました' : 'Failed to save to localStorage'
      );
    }
  };

  // 現在の言語の初期プリセットへリセットするハンドラ（右カラムは未生成状態にする）
  const handleResetToPreset = () => {
    const preset = getPresetByLang(lang);
    setHasUserEdited(false);
    setWorldLock(preset.worldLock);
    latestWorldLockRef.current = preset.worldLock;
    setBlocks(preset.blocks);
    latestBlocksRef.current = preset.blocks;
    setPreviousStoryboard(null);
    setStoryboard({ pages: [] });
    setActivePageTab(0);
    setShowDiff(false);
    setGenerationMode(lang === 'ja' ? 'Standby (未生成)' : 'Standby (Ungenerated)');
    setStatusMessage(
      lang === 'ja'
        ? '初期プリセット「ネオン・ラーメン 2099」を読み込みました（未生成）'
        : 'Loaded "Neon Ramen 2099" Preset (Ready to Generate)'
    );
  };

  // プロジェクト全体をJSONファイルとしてエクスポートするハンドラ
  const handleExportJson = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      lang: latestLangRef.current,
      worldLock: latestWorldLockRef.current,
      blocks: latestBlocksRef.current,
      storyboard,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = (latestWorldLockRef.current.title || 'storydaw-project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    a.href = url;
    a.download = `${safeTitle || 'storydaw-project'}-storyboard.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage(lang === 'ja' ? 'JSONファイルを出力しました' : 'Exported JSON file');
  };

  // キャラクターの更新・追加・削除ハンドラ
  const handleUpdateCharacter = (id: string, field: keyof Character, value: string) => {
    setHasUserEdited(true);
    setWorldLock((prev) => {
      const next = {
        ...prev,
        characters: prev.characters.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      };
      latestWorldLockRef.current = next;
      return next;
    });
  };

  const handleAddCharacter = () => {
    setHasUserEdited(true);
    const newId = `char-${Date.now()}`;
    const newChar: Character = {
      id: newId,
      name: '',
      role: '',
      traits: '',
    };
    setWorldLock((prev) => {
      const next = {
        ...prev,
        characters: [...prev.characters, newChar],
      };
      latestWorldLockRef.current = next;
      return next;
    });
    // 追加したキャラクターをデフォルトで各ブロックの登場キャラにも追加
    setBlocks((prev) => {
      const next = prev.map((b) => ({
        ...b,
        characterIds: [...b.characterIds, newId],
      }));
      latestBlocksRef.current = next;
      return next;
    });
  };

  const handleRemoveCharacter = (id: string) => {
    setHasUserEdited(true);
    setWorldLock((prev) => {
      const next = {
        ...prev,
        characters: prev.characters.filter((c) => c.id !== id),
      };
      latestWorldLockRef.current = next;
      return next;
    });
    // 各ブロックの登場キャラ選択からも除外
    setBlocks((prev) => {
      const next = prev.map((b) => ({
        ...b,
        characterIds: b.characterIds.filter((cid) => cid !== id),
      }));
      latestBlocksRef.current = next;
      return next;
    });
  };

  // 起承転結ブロックの順序入れ替え（↑ / ↓）ハンドラ
  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    setHasUserEdited(true);
    setBlocks((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      latestBlocksRef.current = next;
      return next;
    });
  };

  // 起承転結ブロックのフィールド更新ハンドラ
  const handleUpdateBlock = <K extends keyof StoryBlock>(
    id: string,
    field: K,
    value: StoryBlock[K]
  ) => {
    setHasUserEdited(true);
    setBlocks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, [field]: value } : b));
      latestBlocksRef.current = next;
      return next;
    });
  };

  // ブロック内の登場キャラクター選択トグル
  const handleToggleBlockCharacter = (blockId: string, charId: string) => {
    setHasUserEdited(true);
    setBlocks((prev) => {
      const next = prev.map((b) => {
        if (b.id !== blockId) return b;
        const exists = b.characterIds.includes(charId);
        return {
          ...b,
          characterIds: exists
            ? b.characterIds.filter((id) => id !== charId)
            : [...b.characterIds, charId],
        };
      });
      latestBlocksRef.current = next;
      return next;
    });
  };

  // バックエンドAPI (/api/generate) を呼び出してネーム指示書を生成するハンドラ
  // 新規作成時・プリセット編集時ともに同一のフローで最新のState（latestWorldLockRef / latestBlocksRef）を送信する
  const handleGenerateStoryboard = async () => {
    const currentWorldLock = latestWorldLockRef.current;
    const currentBlocks = latestBlocksRef.current;
    const currentLang = latestLangRef.current;

    setIsGenerating(true);
    setStatusMessage(
      currentLang === 'ja'
        ? 'Meta Muse API でネーム指示書を生成中...'
        : 'Generating storyboard brief via Meta Muse API...'
    );

    // Diff比較用に現在のStoryboard（ページが存在する場合のみ）を「Before」として保存
    const snapshotBefore: StoryboardResult | null =
      storyboard.pages.length > 0 ? JSON.parse(JSON.stringify(storyboard)) : null;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldLock: currentWorldLock,
          blocks: currentBlocks,
          lang: currentLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const modeHeader = response.headers.get('X-StoryDAW-Mode') || 'api';
      const result = (await response.json()) as StoryboardResult;

      if (result && Array.isArray(result.pages)) {
        if (snapshotBefore) {
          setPreviousStoryboard(snapshotBefore);
        }
        setStoryboard(result);
        setActivePageTab(0);
        setGenerationMode(
          modeHeader === 'meta-muse-api'
            ? 'Meta Muse API (Live)'
            : currentLang === 'ja'
            ? 'Dynamic Tension Engine (最新入力反映)'
            : 'Dynamic Tension Engine (Live Input)'
        );
        setStatusMessage(
          currentLang === 'ja'
            ? `「${currentWorldLock.title || '無題'}」の全${result.pages.length}ページを生成しました。`
            : `Generated ${result.pages.length} pages for "${currentWorldLock.title || 'Untitled'}".`
        );
      } else {
        throw new Error('Malformed StoryboardResult format');
      }
    } catch (error) {
      setStatusMessage(
        `Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 右カラム：ページ要約のインライン編集ハンドラ
  const handleUpdatePageSummary = (pageIndex: number, newSummary: string) => {
    setStoryboard((prev) => ({
      ...prev,
      pages: prev.pages.map((p, idx) =>
        idx === pageIndex ? { ...p, pageSummary: newSummary } : p
      ),
    }));
  };

  // 右カラム：コマ（PanelBrief）のインライン編集ハンドラ
  const handleUpdatePanel = <K extends keyof PanelBrief>(
    pageIndex: number,
    panelIndex: number,
    field: K,
    value: PanelBrief[K]
  ) => {
    setStoryboard((prev) => ({
      ...prev,
      pages: prev.pages.map((page, pIdx) => {
        if (pIdx !== pageIndex) return page;
        return {
          ...page,
          panels: page.panels.map((panel, pnIdx) =>
            pnIdx === panelIndex ? { ...panel, [field]: value } : panel
          ),
        };
      }),
    }));
  };

  // 右カラム：セリフ（Dialogue）のインライン編集ハンドラ
  const handleUpdateDialogue = <K extends keyof Dialogue>(
    pageIndex: number,
    panelIndex: number,
    dialogueIndex: number,
    field: K,
    value: Dialogue[K]
  ) => {
    setStoryboard((prev) => ({
      ...prev,
      pages: prev.pages.map((page, pIdx) => {
        if (pIdx !== pageIndex) return page;
        return {
          ...page,
          panels: page.panels.map((panel, pnIdx) => {
            if (pnIdx !== panelIndex) return panel;
            return {
              ...panel,
              dialogues: panel.dialogues.map((dlg, dIdx) =>
                dIdx === dialogueIndex ? { ...dlg, [field]: value } : dlg
              ),
            };
          }),
        };
      }),
    }));
  };

  // 右カラム：セリフ行の追加・削除ハンドラ
  const handleAddDialogue = (pageIndex: number, panelIndex: number) => {
    const defaultSpeaker =
      worldLock.characters[0]?.name?.trim() || (lang === 'ja' ? 'キャラ' : 'Character');
    setStoryboard((prev) => ({
      ...prev,
      pages: prev.pages.map((page, pIdx) => {
        if (pIdx !== pageIndex) return page;
        return {
          ...page,
          panels: page.panels.map((panel, pnIdx) => {
            if (pnIdx !== panelIndex) return panel;
            return {
              ...panel,
              dialogues: [
                ...panel.dialogues,
                {
                  character: defaultSpeaker,
                  type: 'speech',
                  text: lang === 'ja' ? '新しいセリフ...' : 'New line...',
                },
              ],
            };
          }),
        };
      }),
    }));
  };

  const handleRemoveDialogue = (pageIndex: number, panelIndex: number, dialogueIndex: number) => {
    setStoryboard((prev) => ({
      ...prev,
      pages: prev.pages.map((page, pIdx) => {
        if (pIdx !== pageIndex) return page;
        return {
          ...page,
          panels: page.panels.map((panel, pnIdx) => {
            if (pnIdx !== panelIndex) return panel;
            return {
              ...panel,
              dialogues: panel.dialogues.filter((_, dIdx) => dIdx !== dialogueIndex),
            };
          }),
        };
      }),
    }));
  };

  // SVG折れ線グラフの座標計算（4つのブロックのTension 0〜100を頂点に変換）
  const svgWidth = 520;
  const svgHeight = 128;
  const padLeft = 38;
  const padRight = 28;
  const padTop = 18;
  const padBottom = 24;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const graphPoints = blocks.map((block, index) => {
    const x =
      blocks.length > 1
        ? padLeft + (index / (blocks.length - 1)) * plotWidth
        : padLeft + plotWidth / 2;
    const clampedTension = Math.max(0, Math.min(100, block.tension));
    const y = padTop + ((100 - clampedTension) / 100) * plotHeight;
    return { x, y, block };
  });

  const polylinePointsString = graphPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  // 右カラムに表示する対象ページ配列（実際のpageIndexを保持してインライン編集やDiffと連動）
  const visiblePageEntries = storyboard.pages
    .map((page, pageIndex) => ({ page, pageIndex }))
    .filter(({ pageIndex }) => activePageTab === 'all' || activePageTab === pageIndex);

  // 左・中央カラムにプリセット（または入力内容）が入っているか判定
  const hasStoryInputs = Boolean(
    worldLock.title.trim() ||
      worldLock.setting.trim() ||
      blocks.some((b) => b.event.trim().length > 0)
  );

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] text-[#18181B] flex flex-col font-sans">
      {/* 1. Header (固定高さ shrink-0) */}
      <header className="shrink-0 bg-[#FFFFFF] border-b-2 border-[#18181B] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-3 h-3 bg-[#2563EB] border border-[#18181B]" />
            <h1 className="text-lg font-black tracking-tight uppercase leading-none">
              StoryDAW Mini
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-[#18181B] bg-[#FAFAFA]">
              Blueprint v1.0
            </span>
          </div>
          <p className="text-[11px] text-[#18181B]/80 mt-0.5 font-medium">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-1 bg-[#FAFAFA] border border-[#18181B]">
            {statusMessage}
          </span>

          {/* EN / 日本語 言語切り替えトグルボタン */}
          <div
            className="inline-flex border-2 border-[#18181B] bg-[#FAFAFA]"
            role="group"
            aria-label="Language toggle"
          >
            <button
              type="button"
              onClick={() => handleSwitchLanguage('en')}
              className={`text-xs font-mono font-bold px-2.5 py-1 transition cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#FFFFFF] text-[#18181B] hover:bg-[#FAFAFA]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLanguage('ja')}
              className={`text-xs font-bold px-2.5 py-1 border-l-2 border-[#18181B] transition cursor-pointer ${
                lang === 'ja'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#FFFFFF] text-[#18181B] hover:bg-[#FAFAFA]'
              }`}
            >
              日本語
            </button>
          </div>

          {/* 新規作成（クリア）ボタン */}
          <button
            type="button"
            onClick={handleNewBlank}
            className="text-xs font-bold uppercase px-2.5 py-1 bg-[#FFFFFF] text-[#18181B] border-2 border-[#18181B] hover:bg-[#18181B] hover:text-white active:translate-y-0.5 transition cursor-pointer"
          >
            {t.newBlank}
          </button>

          {/* プリセットに戻すボタン */}
          <button
            type="button"
            onClick={handleResetToPreset}
            className="text-xs font-bold uppercase px-2.5 py-1 bg-[#FFFFFF] text-[#18181B] border-2 border-[#18181B] hover:bg-[#FAFAFA] active:translate-y-0.5 transition cursor-pointer"
          >
            {t.resetPreset}
          </button>
          <button
            type="button"
            onClick={handleSaveToLocal}
            className="text-xs font-bold uppercase px-2.5 py-1 bg-[#FFFFFF] text-[#18181B] border-2 border-[#18181B] hover:bg-[#FAFAFA] active:translate-y-0.5 transition cursor-pointer"
          >
            {t.saveLocal}
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="text-xs font-bold uppercase px-2.5 py-1 bg-[#2563EB] text-white border-2 border-[#18181B] hover:opacity-95 active:translate-y-0.5 transition cursor-pointer"
          >
            {t.exportJson}
          </button>
        </div>
      </header>

      {/* Main 3-Column DAW Layout (残り画面高さを100%使い、各カラムが独立スクロール) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 max-w-[1920px] w-full mx-auto overflow-hidden">
        {/* 2. Left Column: World Lock Panel (Fixed Constants) */}
        <section className="lg:col-span-3 h-full min-h-0 bg-[#FFFFFF] border-2 border-[#18181B] flex flex-col overflow-hidden">
          {/* カラムヘッダー (固定) */}
          <div className="shrink-0 p-3 border-b-2 border-[#18181B] bg-[#FFFFFF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-6 h-6 bg-[#18181B] text-white text-xs font-bold"
                title={t.worldLockSub}
              >
                🔒
              </span>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">
                  {t.worldLockHeader}
                </h2>
                <p className="text-[10px] font-mono text-[#2563EB] font-bold">
                  {t.worldLockSub}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-[#18181B] bg-[#FAFAFA]">
              {t.immutableBadge}
            </span>
          </div>

          {/* カラム内部スクロール領域 */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
            {/* Title, Setting, Theme 入力欄 */}
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  🔒 {t.projectTitle}
                </label>
                <input
                  type="text"
                  value={worldLock.title}
                  onChange={(e) => handleUpdateWorldField('title', e.target.value)}
                  placeholder={t.projectTitlePlaceholder}
                  className="w-full text-xs font-bold px-2 py-1.5 bg-[#FAFAFA] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  🔒 {t.worldSetting}
                </label>
                <textarea
                  rows={3}
                  value={worldLock.setting}
                  onChange={(e) => handleUpdateWorldField('setting', e.target.value)}
                  placeholder={t.worldSettingPlaceholder}
                  className="w-full text-xs leading-snug px-2 py-1.5 bg-[#FAFAFA] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                  🔒 {t.coreTheme}
                </label>
                <textarea
                  rows={2}
                  value={worldLock.theme}
                  onChange={(e) => handleUpdateWorldField('theme', e.target.value)}
                  placeholder={t.coreThemePlaceholder}
                  className="w-full text-xs leading-snug px-2 py-1.5 bg-[#FAFAFA] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* Characters 編集・追加・削除リスト */}
            <div className="border-t-2 border-[#18181B] pt-2.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider">
                  🔒 {t.lockedCharacters} ({worldLock.characters.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddCharacter}
                  className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#2563EB] text-white border border-[#18181B] hover:opacity-90 cursor-pointer"
                >
                  {t.addCharacter}
                </button>
              </div>

              {worldLock.characters.length === 0 ? (
                <div className="p-2.5 bg-[#FAFAFA] border border-dashed border-[#18181B] text-[11px] text-[#18181B]/70 font-mono">
                  {t.noCharactersHint}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {worldLock.characters.map((char, idx) => (
                    <div
                      key={char.id}
                      className="p-2 bg-[#FAFAFA] border border-[#18181B] flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-[#18181B] text-white">
                          CHAR #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCharacter(char.id)}
                          className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-[#18181B] bg-[#FFFFFF] hover:bg-[#18181B] hover:text-white transition cursor-pointer"
                        >
                          {t.removeChar}
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase">
                          {t.charName}
                        </label>
                        <input
                          type="text"
                          value={char.name}
                          onChange={(e) => handleUpdateCharacter(char.id, 'name', e.target.value)}
                          placeholder={t.charNamePlaceholder}
                          className="w-full text-xs font-bold px-2 py-1 bg-[#FFFFFF] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase">
                          {t.charRole}
                        </label>
                        <input
                          type="text"
                          value={char.role}
                          onChange={(e) => handleUpdateCharacter(char.id, 'role', e.target.value)}
                          placeholder={t.charRolePlaceholder}
                          className="w-full text-xs px-2 py-1 bg-[#FFFFFF] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase">
                          {t.charTraits}
                        </label>
                        <textarea
                          rows={2}
                          value={char.traits}
                          onChange={(e) => handleUpdateCharacter(char.id, 'traits', e.target.value)}
                          placeholder={t.charTraitsPlaceholder}
                          className="w-full text-xs leading-snug px-2 py-1 bg-[#FFFFFF] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Center Column: Ki-Sho-Ten-Ketsu Timeline & Tension Graph */}
        <section className="lg:col-span-4 h-full min-h-0 bg-[#FFFFFF] border-2 border-[#18181B] flex flex-col overflow-hidden">
          {/* 上部固定エリア: カラムヘッダー + Tension Line Graph (常時表示) */}
          <div className="shrink-0 p-3 border-b-2 border-[#18181B] bg-[#FFFFFF] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">{t.timelineHeader}</h2>
                <p className="text-[10px] font-mono text-[#18181B]/70">{t.timelineSub}</p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#2563EB] text-white border border-[#18181B]">
                {t.tracksBadge}
              </span>
            </div>

            {/* 標準 <svg> (<polyline> と <circle>) による Tension Line Graph */}
            <div className="bg-[#FAFAFA] border border-[#18181B] p-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1 px-1">
                <span className="font-bold">{t.tensionCurveTitle}</span>
                <span className="text-[#2563EB] font-bold">{t.tensionCurveRule}</span>
              </div>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-28 bg-[#FFFFFF] border border-[#18181B] block"
                role="img"
                aria-label="Tension Line Graph across 4 story blocks"
              >
                {/* 背景の水平グリッド線 (100, 70, 35, 0) */}
                {[100, 70, 35, 0].map((val) => {
                  const y = padTop + ((100 - val) / 100) * plotHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                        stroke="#18181B"
                        strokeOpacity={val === 70 || val === 35 ? 0.35 : 0.15}
                        strokeDasharray={val === 70 || val === 35 ? '4 4' : undefined}
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 5}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        fontFamily="monospace"
                        fill="#18181B"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* 各ブロックの垂直ガイド線とX軸ラベル */}
                {graphPoints.map((pt, idx) => (
                  <g key={pt.block.id}>
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={svgHeight - padBottom}
                      stroke="#18181B"
                      strokeOpacity="0.15"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={svgHeight - 7}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="#18181B"
                    >
                      {idx + 1}.{getBlockShortLabel(pt.block.type, lang)}
                    </text>
                  </g>
                ))}

                {/* 4ブロックのTension値を結ぶ折れ線 (<polyline>) */}
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  points={polylinePointsString}
                />

                {/* 各ブロックの頂点 (<circle>) と数値ラベル */}
                {graphPoints.map((pt) => (
                  <g key={`vertex-${pt.block.id}`}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#2563EB"
                      stroke="#18181B"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="#18181B"
                    >
                      {pt.block.tension}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* 中央スクロール領域: コンパクトに引き締めた4つの起承転結トラックカード */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="p-2 bg-[#FAFAFA] border border-[#18181B] flex flex-col gap-1.5"
              >
                {/* カードヘッダーと順序入れ替えボタン (↑ / ↓) */}
                <div className="flex items-center justify-between border-b border-[#18181B]/30 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#18181B] text-white">
                      {getTrackHeaderLabel(index, block.type, lang)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveBlock(index, -1)}
                      disabled={index === 0}
                      title="Move Block Up"
                      className="w-5 h-5 text-[10px] font-bold border border-[#18181B] bg-[#FFFFFF] disabled:opacity-30 hover:bg-[#2563EB] hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBlock(index, 1)}
                      disabled={index === blocks.length - 1}
                      title="Move Block Down"
                      className="w-5 h-5 text-[10px] font-bold border border-[#18181B] bg-[#FFFFFF] disabled:opacity-30 hover:bg-[#2563EB] hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {/* Tension スライダー (0-100) と Pages (1-3) を1行にコンパクト配置 */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-9">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                      <span className="font-bold">
                        {t.tensionLabel}: <strong className="text-[#2563EB]">{block.tension}</strong>
                      </span>
                      <span className="text-[9px] px-1 py-0.2 border border-[#18181B] bg-[#FFFFFF]">
                        {getTensionTierLabel(block.tension, lang)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={block.tension}
                      onChange={(e) =>
                        handleUpdateBlock(block.id, 'tension', Number(e.target.value))
                      }
                      className="w-full h-1.5 accent-[#2563EB] cursor-pointer"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[9px] font-mono font-bold uppercase mb-0.5">
                      {t.pagesLabel}
                    </label>
                    <select
                      value={block.pages}
                      onChange={(e) =>
                        handleUpdateBlock(block.id, 'pages', Number(e.target.value))
                      }
                      className="w-full text-[11px] font-mono font-bold px-1.5 py-0.5 bg-[#FFFFFF] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value={1}>1p</option>
                      <option value={2}>2p</option>
                      <option value={3}>3p</option>
                    </select>
                  </div>
                </div>

                {/* Event テキストエリア (rows=2 でコンパクトに) */}
                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-[#18181B]/75 mb-0.5">
                    {t.sceneEvent}
                  </label>
                  <textarea
                    rows={2}
                    value={block.event}
                    onChange={(e) => handleUpdateBlock(block.id, 'event', e.target.value)}
                    placeholder={t.sceneEventPlaceholder}
                    className="w-full text-xs leading-snug px-2 py-1 bg-[#FFFFFF] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* 登場キャラクターのチェックボックス */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold uppercase text-[#18181B]/75 mr-0.5">
                    {t.charactersInScene}:
                  </span>
                  {worldLock.characters.map((char, charIdx) => {
                    const checked = block.characterIds.includes(char.id);
                    const displayCharName = char.name.trim() || `CHAR #${charIdx + 1}`;
                    return (
                      <label
                        key={char.id}
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 border border-[#18181B] cursor-pointer select-none ${
                          checked ? 'bg-[#2563EB] text-white font-semibold' : 'bg-[#FFFFFF]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleBlockCharacter(block.id, char.id)}
                          className="sr-only"
                        />
                        <span>{checked ? '☑' : '☐'}</span>
                        <span>{displayCharName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 下部固定アクション: 大きく目立つ Generate Storyboard Brief ボタン (常時表示) */}
          <div className="shrink-0 p-2.5 border-t-2 border-[#18181B] bg-[#FFFFFF]">
            <button
              type="button"
              onClick={handleGenerateStoryboard}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 bg-[#2563EB] text-white font-black uppercase tracking-wider text-xs border-2 border-[#18181B] shadow-[3px_3px_0px_#18181B] hover:opacity-95 active:translate-y-0.5 active:shadow-[1px_1px_0px_#18181B] disabled:opacity-60 transition cursor-pointer"
            >
              {isGenerating ? t.generatingBtn : t.generateBtn}
            </button>
          </div>
        </section>

        {/* 4. Right Column: Storyboard Brief Viewer (Text-Only Output) */}
        <section className="lg:col-span-5 h-full min-h-0 bg-[#FFFFFF] border-2 border-[#18181B] flex flex-col overflow-hidden">
          {/* 右カラム上部固定ヘッダー + ページ切り替えタブ */}
          <div className="shrink-0 p-3 border-b-2 border-[#18181B] bg-[#FFFFFF] flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider">{t.viewerHeader}</h2>
                <p className="text-[10px] font-mono text-[#18181B]/70">
                  {t.viewerSubPrefix}{' '}
                  <strong className="text-[#2563EB]">{generationMode}</strong> {t.viewerSubSuffix}
                </p>
              </div>

              {/* Diff View (Before / After) トグル */}
              <label className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase px-2.5 py-1 border-2 border-[#18181B] bg-[#FAFAFA] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDiff}
                  onChange={(e) => setShowDiff(e.target.checked)}
                  className="accent-[#2563EB] w-3.5 h-3.5 cursor-pointer"
                />
                <span>{t.showDiff}</span>
              </label>
            </div>

            {/* ページ切り替えタブバー (ページが存在する場合のみ表示) */}
            {storyboard.pages.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {storyboard.pages.map((p, idx) => {
                  const isActive = activePageTab === idx;
                  return (
                    <button
                      key={`tab-page-${p.pageNumber}-${idx}`}
                      type="button"
                      onClick={() => setActivePageTab(idx)}
                      className={`text-[11px] font-mono font-bold uppercase px-2.5 py-1 border border-[#18181B] transition cursor-pointer ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-[2px_2px_0px_#18181B]'
                          : 'bg-[#FAFAFA] text-[#18181B] hover:bg-[#18181B]/5'
                      }`}
                    >
                      Page {p.pageNumber} ({getBlockShortLabel(p.blockType, lang)})
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setActivePageTab('all')}
                  className={`text-[11px] font-mono font-bold uppercase px-2.5 py-1 border border-[#18181B] transition cursor-pointer ml-auto ${
                    activePageTab === 'all'
                      ? 'bg-[#18181B] text-white shadow-[2px_2px_0px_#2563EB]'
                      : 'bg-[#FAFAFA] text-[#18181B] hover:bg-[#18181B]/5'
                  }`}
                >
                  {t.allPages} ({storyboard.pages.length})
                </button>
              </div>
            )}
          </div>

          {/* 右カラム独立スクロール領域 */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
            {/* 未生成（プリセット読込時・新規作成時）のプレースホルダー表示 */}
            {storyboard.pages.length === 0 ? (
              <div className="my-auto p-6 bg-[#FAFAFA] border-2 border-dashed border-[#18181B] text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-[#2563EB] text-white border-2 border-[#18181B] flex items-center justify-center font-mono font-black text-lg">
                  ▶
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {hasStoryInputs ? t.presetReadyTitle : t.emptyViewerTitle}
                </h3>
                <p className="text-xs leading-relaxed text-[#18181B] max-w-md font-medium">
                  {hasStoryInputs ? t.presetReadyBody : t.emptyViewerBody}
                </p>
              </div>
            ) : (
              <>
                {/* Diff モードがONで、まだ再生成を行っていない場合の案内バナー */}
                {showDiff && !previousStoryboard && (
                  <div className="p-2.5 bg-[#FAFAFA] border-2 border-[#2563EB] text-xs font-mono">
                    <strong className="text-[#2563EB] uppercase block mb-0.5">
                      {t.diffWaitingTitle}
                    </strong>
                    {t.diffWaitingBody}
                  </div>
                )}

                {/* 選択中のページ（または全ページ）の階層カード表示 */}
                {visiblePageEntries.map(({ page, pageIndex }) => {
                  const prevPage = previousStoryboard?.pages[pageIndex];
                  const tensionChanged =
                    prevPage !== undefined && prevPage.appliedTension !== page.appliedTension;
                  const panelCountChanged =
                    prevPage !== undefined && prevPage.panels.length !== page.panels.length;

                  return (
                    <div
                      key={`page-${page.pageNumber}-${pageIndex}`}
                      className="border-2 border-[#18181B] bg-[#FAFAFA] p-2.5 flex flex-col gap-2"
                    >
                      {/* ページヘッダー */}
                      <div className="bg-[#18181B] text-white px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider">
                            Page {page.pageNumber} [{getBlockShortLabel(page.blockType, lang)}] —
                            Tension: {page.appliedTension}
                          </span>
                          {showDiff && prevPage && tensionChanged && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#2563EB] text-white">
                              Before: {prevPage.appliedTension} → After: {page.appliedTension}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span>
                            {page.panels.length} {t.panelsUnit}
                          </span>
                          {showDiff && prevPage && panelCountChanged && (
                            <span className="px-1.5 py-0.5 bg-[#2563EB] text-white font-bold">
                              Δ {prevPage.panels.length} → {page.panels.length} {t.panelsUnit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Page Summary (インライン編集可能) */}
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[10px] font-mono font-bold uppercase">
                          {t.pageSummaryLabel}
                        </span>
                        <input
                          type="text"
                          value={page.pageSummary}
                          onChange={(e) => handleUpdatePageSummary(pageIndex, e.target.value)}
                          className="w-full text-xs px-2 py-1 bg-[#FFFFFF] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      {/* Diff View ON かつ前回データがある場合：Before / After 比較サマリー */}
                      {showDiff && prevPage && (
                        <div className="p-2 bg-[#FFFFFF] border-2 border-[#2563EB] flex flex-col gap-1.5">
                          <div className="flex items-center justify-between border-b border-[#18181B]/20 pb-1">
                            <span className="text-[10px] font-mono font-bold uppercase text-[#2563EB]">
                              {t.diffBannerTitle} (Page {page.pageNumber})
                            </span>
                            <span className="text-[10px] font-mono">
                              Tension: {prevPage.appliedTension} → {page.appliedTension} |{' '}
                              {t.panelsUnit}: {prevPage.panels.length} → {page.panels.length}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {/* Before Column */}
                            <div className="p-1.5 bg-[#FAFAFA] border border-[#18181B]">
                              <div className="font-mono font-bold uppercase text-[10px] mb-1 pb-0.5 border-b border-[#18181B]">
                                BEFORE (Tension {prevPage.appliedTension} / {prevPage.panels.length}{' '}
                                {t.panelsUnit})
                              </div>
                              <div className="flex flex-col gap-1">
                                {prevPage.panels.map((bPanel) => (
                                  <div
                                    key={`before-p-${bPanel.panelNumber}`}
                                    className="p-1.5 bg-[#FFFFFF] border border-[#18181B]/60 text-[11px]"
                                  >
                                    <div className="font-mono font-bold flex items-center justify-between">
                                      <span>Panel #{bPanel.panelNumber}</span>
                                      <span className="uppercase px-1 bg-[#FAFAFA] border border-[#18181B] text-[10px]">
                                        {bPanel.size}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-mono text-[#18181B]/80">
                                      {t.cameraAngle}: {bPanel.camera}
                                    </div>
                                    <div className="mt-0.5 line-clamp-2 text-[11px]">
                                      {bPanel.composition}
                                    </div>
                                    {bPanel.dialogues.map((d, di) => (
                                      <div key={di} className="text-[10px] font-mono mt-0.5">
                                        <strong>{d.character}:</strong> &ldquo;{d.text}&rdquo;
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* After Column */}
                            <div className="p-1.5 bg-[#FAFAFA] border-2 border-[#2563EB]">
                              <div className="font-mono font-bold uppercase text-[10px] text-[#2563EB] mb-1 pb-0.5 border-b border-[#2563EB]">
                                AFTER (Tension {page.appliedTension} / {page.panels.length}{' '}
                                {t.panelsUnit})
                              </div>
                              <div className="flex flex-col gap-1">
                                {page.panels.map((aPanel, idx) => {
                                  const bPanel = prevPage.panels[idx];
                                  const isChanged =
                                    !bPanel ||
                                    bPanel.size !== aPanel.size ||
                                    bPanel.camera !== aPanel.camera ||
                                    bPanel.composition !== aPanel.composition;
                                  return (
                                    <div
                                      key={`after-p-${aPanel.panelNumber}`}
                                      className={`p-1.5 bg-[#FFFFFF] border text-[11px] ${
                                        isChanged ? 'border-[#2563EB]' : 'border-[#18181B]/60'
                                      }`}
                                    >
                                      <div className="font-mono font-bold flex items-center justify-between">
                                        <span>
                                          Panel #{aPanel.panelNumber}{' '}
                                          {isChanged && (
                                            <span className="text-[9px] text-[#2563EB] uppercase">
                                              [Updated]
                                            </span>
                                          )}
                                        </span>
                                        <span className="uppercase px-1 bg-[#2563EB] text-white text-[10px]">
                                          {aPanel.size}
                                        </span>
                                      </div>
                                      <div className="text-[10px] font-mono text-[#2563EB]">
                                        {t.cameraAngle}: {aPanel.camera}
                                      </div>
                                      <div className="mt-0.5 line-clamp-2 text-[11px]">
                                        {aPanel.composition}
                                      </div>
                                      {aPanel.dialogues.map((d, di) => (
                                        <div key={di} className="text-[10px] font-mono mt-0.5">
                                          <strong>{d.character}:</strong> &ldquo;{d.text}&rdquo;
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 各コマ（PanelBrief）の設計図カードリスト（1ページ4コマが一覧しやすいコンパクト設計） */}
                      <div className="flex flex-col gap-2">
                        {page.panels.map((panel, panelIndex) => {
                          const prevPanel = prevPage?.panels[panelIndex];
                          const sizeChanged = prevPanel && prevPanel.size !== panel.size;
                          const cameraChanged = prevPanel && prevPanel.camera !== panel.camera;

                          // コマサイズに応じた設計図風の枠線スタイル強調
                          const sizeFrameStyle =
                            panel.size === 'wide' || panel.size === 'large'
                              ? 'border-2 border-[#18181B] shadow-[2px_2px_0px_#2563EB]'
                              : 'border border-[#18181B]';

                          return (
                            <div
                              key={`panel-${page.pageNumber}-${panel.panelNumber}-${panelIndex}`}
                              className={`bg-[#FFFFFF] p-2 flex flex-col gap-1.5 ${sizeFrameStyle}`}
                            >
                              {/* コマヘッダー：Panel # と Size Badge + CAMERA ANGLE を1行に統合 */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#18181B]/30 pb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-mono font-black uppercase px-1.5 py-0.5 bg-[#18181B] text-white">
                                    Panel #{panel.panelNumber}
                                  </span>
                                  <select
                                    value={panel.size}
                                    onChange={(e) =>
                                      handleUpdatePanel(
                                        pageIndex,
                                        panelIndex,
                                        'size',
                                        e.target.value as PanelBrief['size']
                                      )
                                    }
                                    className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 border border-[#18181B] cursor-pointer ${
                                      panel.size === 'large' || panel.size === 'wide'
                                        ? 'bg-[#2563EB] text-white'
                                        : 'bg-[#FAFAFA] text-[#18181B]'
                                    }`}
                                  >
                                    <option value="small">SMALL</option>
                                    <option value="medium">MEDIUM</option>
                                    <option value="large">LARGE</option>
                                    <option value="wide">WIDE</option>
                                  </select>
                                  {showDiff && sizeChanged && (
                                    <span className="text-[10px] font-mono font-bold text-[#2563EB]">
                                      ({prevPanel.size.toUpperCase()}→{panel.size.toUpperCase()})
                                    </span>
                                  )}
                                </div>

                                {/* CAMERA ANGLE インライン入力 */}
                                <div className="flex items-center gap-1 flex-1 min-w-[200px] justify-end">
                                  <span className="text-[10px] font-mono font-bold uppercase text-[#18181B]/75 shrink-0">
                                    {t.cameraAngle}:
                                  </span>
                                  <input
                                    type="text"
                                    value={panel.camera}
                                    onChange={(e) =>
                                      handleUpdatePanel(
                                        pageIndex,
                                        panelIndex,
                                        'camera',
                                        e.target.value
                                      )
                                    }
                                    className="w-full max-w-[240px] text-[11px] font-mono px-1.5 py-0.5 bg-[#FAFAFA] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                                  />
                                  {showDiff && cameraChanged && (
                                    <span
                                      className="text-[9px] font-mono text-[#2563EB] shrink-0"
                                      title={`Before: ${prevPanel.camera}`}
                                    >
                                      *CamΔ
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* COMPOSITION & ACTION (構図・キャラの演技指示) インライン編集 */}
                              <div>
                                <label className="block text-[9px] font-mono font-bold uppercase text-[#18181B]/75 mb-0.5">
                                  {t.compositionAction}
                                </label>
                                <textarea
                                  rows={2}
                                  value={panel.composition}
                                  onChange={(e) =>
                                    handleUpdatePanel(
                                      pageIndex,
                                      panelIndex,
                                      'composition',
                                      e.target.value
                                    )
                                  }
                                  className="w-full text-xs leading-snug px-2 py-1 bg-[#FAFAFA] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                                />
                              </div>

                              {/* DIALOGUES & SFX (セリフ・効果音) インライン編集 */}
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono font-bold uppercase text-[#18181B]/75">
                                    {t.dialoguesSfx} ({panel.dialogues.length})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddDialogue(pageIndex, panelIndex)}
                                    className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 border border-[#18181B] bg-[#FAFAFA] hover:bg-[#2563EB] hover:text-white transition cursor-pointer"
                                  >
                                    {t.addLine}
                                  </button>
                                </div>

                                {panel.dialogues.map((dlg, dlgIndex) => (
                                  <div
                                    key={`dlg-${dlgIndex}`}
                                    className="grid grid-cols-12 gap-1 items-center"
                                  >
                                    <input
                                      type="text"
                                      value={dlg.character}
                                      onChange={(e) =>
                                        handleUpdateDialogue(
                                          pageIndex,
                                          panelIndex,
                                          dlgIndex,
                                          'character',
                                          e.target.value
                                        )
                                      }
                                      className="col-span-3 text-[11px] font-bold px-1.5 py-0.5 bg-[#FAFAFA] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                                    />
                                    <select
                                      value={dlg.type}
                                      onChange={(e) =>
                                        handleUpdateDialogue(
                                          pageIndex,
                                          panelIndex,
                                          dlgIndex,
                                          'type',
                                          e.target.value as Dialogue['type']
                                        )
                                      }
                                      className="col-span-2 text-[10px] font-mono uppercase px-1 py-0.5 bg-[#FAFAFA] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                                    >
                                      <option value="speech">{t.speechType}</option>
                                      <option value="monologue">{t.monoType}</option>
                                      <option value="sfx">{t.sfxType}</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={dlg.text}
                                      onChange={(e) =>
                                        handleUpdateDialogue(
                                          pageIndex,
                                          panelIndex,
                                          dlgIndex,
                                          'text',
                                          e.target.value
                                        )
                                      }
                                      className="col-span-6 text-[11px] px-1.5 py-0.5 bg-[#FFFFFF] border border-[#18181B] focus:outline-none focus:border-[#2563EB]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveDialogue(pageIndex, panelIndex, dlgIndex)
                                      }
                                      title="Remove Dialogue Line"
                                      className="col-span-1 text-[11px] font-mono border border-[#18181B] py-0.5 bg-[#FAFAFA] hover:bg-[#18181B] hover:text-white transition cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
