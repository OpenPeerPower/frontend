import "@polymer/paper-input/paper-textarea";
import { property, PropertyValues, UpdatingElement } from "lit-element";
import { computeRTL } from "../../../../common/util/compute_rtl";
import { LovelaceCardConfig } from "../../../../data/lovelace";
import { OpenPeerPower } from "../../../../types";
import { createCardElement } from "../../create-element/create-card-element";
import { createErrorCardConfig } from "../../create-element/create-element-base";
import { LovelaceCard } from "../../types";

export class HuiCardPreview extends UpdatingElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public config?: LovelaceCardConfig;

  private _element?: LovelaceCard;

  private get _error() {
    return this._element?.tagName === "HUI-ERROR-CARD";
  }

  constructor() {
    super();
    this.addEventListener("ll-rebuild", () => {
      this._cleanup();
      if (this.config) {
        this._createCard(this.config);
      }
    });
  }

  protected update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has("config")) {
      const oldConfig = changedProperties.get("config") as
        | undefined
        | LovelaceCardConfig;

      if (!this.config) {
        this._cleanup();
        return;
      }

      if (!this.config.type) {
        this._createCard(
          createErrorCardConfig("No card type found", this.config)
        );
        return;
      }

      if (!this._element) {
        this._createCard(this.config);
        return;
      }

      // in case the element was an error element we always want to recreate it
      if (!this._error && oldConfig && this.config.type === oldConfig.type) {
        try {
          this._element.setConfig(this.config);
        } catch (err) {
          this._createCard(createErrorCardConfig(err.message, this.config));
        }
      } else {
        this._createCard(this.config);
      }
    }

    if (changedProperties.has("opp")) {
      const oldOpp = changedProperties.get("opp") as
        | OpenPeerPower
        | undefined;
      if (!oldOpp || oldOpp.language !== this.opp!.language) {
        this.style.direction = computeRTL(this.opp!) ? "rtl" : "ltr";
      }

      if (this._element) {
        this._element.opp = this.opp;
      }
    }
  }

  private _createCard(configValue: LovelaceCardConfig): void {
    this._cleanup();
    this._element = createCardElement(configValue);

    if (this.opp) {
      this._element!.opp = this.opp;
    }

    this.appendChild(this._element!);
  }

  private _cleanup() {
    if (!this._element) {
      return;
    }
    this.removeChild(this._element);
    this._element = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-card-preview": HuiCardPreview;
  }
}

customElements.define("hui-card-preview", HuiCardPreview);
