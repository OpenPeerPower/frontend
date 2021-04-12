import {
  LovelaceBadgeConfig,
  LovelaceCardConfig,
  LovelaceConfig,
} from "../../data/lovelace";
import { FrontendTranslationData } from "../../data/translation";
import { Constructor, OpenPeerPower } from "../../types";
import { LovelaceRow, LovelaceRowConfig } from "./entity-rows/types";
import { LovelaceHeaderFooterConfig } from "./header-footer/types";

declare global {
  // eslint-disable-next-line
  interface OPPDomEvents {
    "ll-rebuild": Record<string, unknown>;
    "ll-badge-rebuild": Record<string, unknown>;
  }
}

export interface Lovelace {
  config: LovelaceConfig;
  editMode: boolean;
  urlPath: string | null;
  mode: "generated" | "yaml" | "storage";
  locale: FrontendTranslationData;
  enableFullEditMode: () => void;
  setEditMode: (editMode: boolean) => void;
  saveConfig: (newConfig: LovelaceConfig) => Promise<void>;
  deleteConfig: () => Promise<void>;
}

export interface LovelaceBadge extends HTMLElement {
  opp?: OpenPeerPower;
  setConfig(config: LovelaceBadgeConfig): void;
}

export interface LovelaceCard extends HTMLElement {
  opp?: OpenPeerPower;
  isPanel?: boolean;
  editMode?: boolean;
  getCardSize(): number | Promise<number>;
  setConfig(config: LovelaceCardConfig): void;
}

export interface LovelaceCardConstructor extends Constructor<LovelaceCard> {
  getStubConfig?: (
    opp: OpenPeerPower,
    entities: string[],
    entitiesFallback: string[]
  ) => LovelaceCardConfig;
  getConfigElement?: () => LovelaceCardEditor;
}

export interface LovelaceHeaderFooterConstructor
  extends Constructor<LovelaceHeaderFooter> {
  getStubConfig?: (
    opp: OpenPeerPower,
    entities: string[],
    entitiesFallback: string[]
  ) => LovelaceHeaderFooterConfig;
  getConfigElement?: () => LovelaceHeaderFooterEditor;
}

export interface LovelaceRowConstructor extends Constructor<LovelaceRow> {
  getConfigElement?: () => LovelaceRowEditor;
}

export interface LovelaceHeaderFooter extends HTMLElement {
  opp?: OpenPeerPower;
  getCardSize(): number | Promise<number>;
  setConfig(config: LovelaceHeaderFooterConfig): void;
}

export interface LovelaceCardEditor extends LovelaceGenericElementEditor {
  setConfig(config: LovelaceCardConfig): void;
}

export interface LovelaceHeaderFooterEditor
  extends LovelaceGenericElementEditor {
  setConfig(config: LovelaceHeaderFooterConfig): void;
}

export interface LovelaceRowEditor extends LovelaceGenericElementEditor {
  setConfig(config: LovelaceRowConfig): void;
}

export interface LovelaceGenericElementEditor extends HTMLElement {
  opp?: OpenPeerPower;
  lovelace?: LovelaceConfig;
  setConfig(config: any): void;
  focusYamlEditor?: () => void;
}
