// StoryDAW Mini のコアデータ型定義

export type Language = 'en' | 'ja';

export interface Character {
  id: string;
  name: string;
  role: string;
  traits: string;
}

export interface WorldLock {
  title: string;
  setting: string;
  theme: string;
  characters: Character[];
}

export type BlockType = 'ki' | 'sho' | 'ten' | 'ketsu';

export interface StoryBlock {
  id: string;
  type: BlockType;
  label: string;
  pages: number;
  tension: number; // 0〜100 の緊張度パラメータ
  event: string;
  characterIds: string[];
}

export interface Dialogue {
  character: string;
  type: 'speech' | 'monologue' | 'sfx';
  text: string;
}

export interface PanelBrief {
  panelNumber: number;
  size: 'large' | 'medium' | 'small' | 'wide';
  camera: string;
  composition: string;
  dialogues: Dialogue[];
}

export interface PageBrief {
  pageNumber: number;
  blockType: BlockType;
  appliedTension: number;
  pageSummary: string;
  panels: PanelBrief[];
}

export interface StoryboardResult {
  pages: PageBrief[];
}
