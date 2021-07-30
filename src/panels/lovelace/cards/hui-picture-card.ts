import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { ifDefined } from "lit-html/directives/if-defined";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import "../../../components/ha-card";
import { ActionHandlerEvent } from "../../../data/lovelace";
import { OpenPeerPower } from "../../../types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { LovelaceCard, LovelaceCardEditor } from "../types";
import { PictureCardConfig } from "./types";

@customElement("hui-picture-card")
export class HuiPictureCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-picture-card-editor");
    return document.createElement("hui-picture-card-editor");
  }

  public static getStubConfig(): PictureCardConfig {
    return {
      type: "picture",
      image: "https://demo.openpeerpower.io/stub_config/t-shirt-promo.png",
      tap_action: { action: "none" },
      hold_action: { action: "none" },
    };
  }

  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() protected _config?: PictureCardConfig;

  public getCardSize(): number {
    return 5;
  }

  public setConfig(config: PictureCardConfig): void {
    if (!config || !config.image) {
      throw new Error("Image required");
    }

    this._config = config;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.size === 1 && changedProps.has("opp")) {
      return !changedProps.get("opp");
    }
    return true;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.opp) {
      return;
    }
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProps.get("_config") as
      | PictureCardConfig
      | undefined;

    if (
      !oldOpp ||
      !oldConfig ||
      oldOpp.themes !== this.opp.themes ||
      oldConfig.theme !== this._config.theme
    ) {
      applyThemesOnElement(this, this.opp.themes, this._config.theme);
    }
  }

  protected render(): TemplateResult {
    if (!this._config || !this.opp) {
      return html``;
    }

    return html`
      <op-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config!.hold_action),
          hasDoubleClick: hasAction(this._config!.double_tap_action),
        })}
        tabindex=${ifDefined(
          hasAction(this._config.tap_action) ? "0" : undefined
        )}
        class="${classMap({
          clickable: Boolean(
            this._config.tap_action ||
              this._config.hold_action ||
              this._config.double_tap_action
          ),
        })}"
      >
        <img src="${this.opp.oppUrl(this._config.image)}" />
      </op-card>
    `;
  }

  static get styles(): CSSResult {
    return css`
      ha-card {
        overflow: hidden;
        height: 100%;
      }

      ha-card.clickable {
        cursor: pointer;
      }

      img {
        display: block;
        width: 100%;
      }
    `;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.opp!, this._config!, ev.detail.action!);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-picture-card": HuiPictureCard;
  }
}
