import {
  customElement,
  internalProperty,
  property,
  PropertyValues,
  UpdatingElement,
} from "lit-element";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import "../../../components/entity/ha-state-label-badge";
import "../../../components/ha-svg-icon";
import type {
  LovelaceBadgeConfig,
  LovelaceCardConfig,
  LovelaceViewConfig,
  LovelaceViewElement,
} from "../../../data/lovelace";
import type { OpenPeerPower } from "../../../types";
import type { HuiErrorCard } from "../cards/hui-error-card";
import { processConfigEntities } from "../common/process-config-entities";
import { createBadgeElement } from "../create-element/create-badge-element";
import { createCardElement } from "../create-element/create-card-element";
import { createViewElement } from "../create-element/create-view-element";
import { showCreateCardDialog } from "../editor/card-editor/show-create-card-dialog";
import { showEditCardDialog } from "../editor/card-editor/show-edit-card-dialog";
import { confDeleteCard } from "../editor/delete-card";
import type { Lovelace, LovelaceBadge, LovelaceCard } from "../types";

const DEFAULT_VIEW_LAYOUT = "masonry";
const PANEL_VIEW_LAYOUT = "panel";

declare global {
  // for fire event
  interface OPPDomEvents {
    "ll-create-card": undefined;
    "ll-edit-card": { path: [number] | [number, number] };
    "ll-delete-card": { path: [number] | [number, number] };
  }
}

@customElement("hui-view")
export class HUIView extends UpdatingElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property({ attribute: false }) public lovelace?: Lovelace;

  @property({ type: Boolean }) public narrow!: boolean;

  @property({ type: Number }) public index?: number;

  @internalProperty() private _cards: Array<LovelaceCard | HuiErrorCard> = [];

  @internalProperty() private _badges: LovelaceBadge[] = [];

  private _layoutElementType?: string;

  private _layoutElement?: LovelaceViewElement;

  // Public to make demo happy
  public createCardElement(cardConfig: LovelaceCardConfig) {
    const element = createCardElement(cardConfig) as LovelaceCard;
    element.opp = this.opp;
    element.addEventListener(
      "ll-rebuild",
      (ev: Event) => {
        // In edit mode let it go to hui-root and rebuild whole view.
        if (!this.lovelace!.editMode) {
          ev.stopPropagation();
          this._rebuildCard(element, cardConfig);
        }
      },
      { once: true }
    );
    return element;
  }

  public createBadgeElement(badgeConfig: LovelaceBadgeConfig) {
    const element = createBadgeElement(badgeConfig) as LovelaceBadge;
    element.opp = this.opp;
    element.addEventListener(
      "ll-badge-rebuild",
      () => {
        this._rebuildBadge(element, badgeConfig);
      },
      { once: true }
    );
    return element;
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    const opp = this.opp!;
    const lovelace = this.lovelace!;

    const oppChanged = changedProperties.has("opp");
    const oldLovelace = changedProperties.get("lovelace") as Lovelace;

    let editModeChanged = false;
    let configChanged = false;

    if (changedProperties.has("index")) {
      configChanged = true;
    } else if (changedProperties.has("lovelace")) {
      editModeChanged =
        oldLovelace && lovelace.editMode !== oldLovelace.editMode;
      configChanged = !oldLovelace || lovelace.config !== oldLovelace.config;
    }

    let viewConfig: LovelaceViewConfig | undefined;

    if (configChanged) {
      viewConfig = lovelace.config.views[this.index!];
      viewConfig = {
        ...viewConfig,
        type: viewConfig.panel
          ? PANEL_VIEW_LAYOUT
          : viewConfig.type || DEFAULT_VIEW_LAYOUT,
      };
    }

    let replace = false;

    if (
      configChanged &&
      (!this._layoutElement || this._layoutElementType !== viewConfig!.type)
    ) {
      replace = true;
      this._layoutElement = createViewElement(viewConfig!);
      this._layoutElementType = viewConfig!.type;
      this._layoutElement.addEventListener("ll-create-card", () => {
        showCreateCardDialog(this, {
          lovelaceConfig: this.lovelace!.config,
          saveConfig: this.lovelace!.saveConfig,
          path: [this.index!],
        });
      });
      this._layoutElement.addEventListener("ll-edit-card", (ev) => {
        showEditCardDialog(this, {
          lovelaceConfig: this.lovelace!.config,
          saveConfig: this.lovelace!.saveConfig,
          path: ev.detail.path,
        });
      });
      this._layoutElement.addEventListener("ll-delete-card", (ev) => {
        confDeleteCard(this, this.opp!, this.lovelace!, ev.detail.path);
      });
    }

    if (configChanged) {
      this._createBadges(viewConfig!);
      this._createCards(viewConfig!);

      this._layoutElement!.opp = this.opp;
      this._layoutElement!.narrow = this.narrow;
      this._layoutElement!.lovelace = lovelace;
      this._layoutElement!.index = this.index;
    }

    if (oppChanged) {
      this._badges.forEach((badge) => {
        badge.opp = opp;
      });

      this._cards.forEach((element) => {
        element.opp = opp;
      });

      this._layoutElement!.opp = this.opp;
    }

    if (changedProperties.has("narrow")) {
      this._layoutElement!.narrow = this.narrow;
    }

    if (editModeChanged) {
      this._layoutElement!.lovelace = lovelace;
    }

    if (
      configChanged ||
      oppChanged ||
      editModeChanged ||
      changedProperties.has("_cards") ||
      changedProperties.has("_badges")
    ) {
      this._layoutElement!.cards = this._cards;
      this._layoutElement!.badges = this._badges;
    }

    const oldOpp = changedProperties.get("opp") as this["opp"] | undefined;

    if (
      configChanged ||
      editModeChanged ||
      (oppChanged &&
        oldOpp &&
        (opp.themes !== oldOpp.themes ||
          opp.selectedTheme !== oldOpp.selectedTheme))
    ) {
      applyThemesOnElement(
        this,
        opp.themes,
        lovelace.config.views[this.index!].theme
      );
    }

    if (this._layoutElement && replace) {
      while (this.lastChild) {
        this.removeChild(this.lastChild);
      }
      this.appendChild(this._layoutElement);
    }
  }

  private _createBadges(config: LovelaceViewConfig): void {
    if (!config || !config.badges || !Array.isArray(config.badges)) {
      this._badges = [];
      return;
    }

    const badges = processConfigEntities(config.badges as any);
    this._badges = badges.map((badge) => {
      const element = createBadgeElement(badge);
      element.opp = this.opp;
      return element;
    });
  }

  private _createCards(config: LovelaceViewConfig): void {
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      this._cards = [];
      return;
    }

    this._cards = config.cards.map((cardConfig) => {
      const element = this.createCardElement(cardConfig);
      element.opp = this.opp;
      return element;
    });
  }

  private _rebuildCard(
    cardElToReplace: LovelaceCard,
    config: LovelaceCardConfig
  ): void {
    const newCardEl = this.createCardElement(config);
    newCardEl.opp = this.opp;
    if (cardElToReplace.parentElement) {
      cardElToReplace.parentElement!.replaceChild(newCardEl, cardElToReplace);
    }
    this._cards = this._cards!.map((curCardEl) =>
      curCardEl === cardElToReplace ? newCardEl : curCardEl
    );
  }

  private _rebuildBadge(
    badgeElToReplace: LovelaceBadge,
    config: LovelaceBadgeConfig
  ): void {
    const newBadgeEl = this.createBadgeElement(config);
    newBadgeEl.opp = this.opp;
    if (badgeElToReplace.parentElement) {
      badgeElToReplace.parentElement!.replaceChild(
        newBadgeEl,
        badgeElToReplace
      );
    }
    this._badges = this._badges!.map((curBadgeEl) =>
      curBadgeEl === badgeElToReplace ? newBadgeEl : curBadgeEl
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-view": HUIView;
  }
}
