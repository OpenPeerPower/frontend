import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import "../../../components/ha-card";
import { OpenPeerPower } from "../../../types";
import { findEntities } from "../common/find-entities";
import { LovelaceElement, LovelaceElementConfig } from "../elements/types";
import { LovelaceCard } from "../types";
import { createStyledHuiElement } from "./picture-elements/create-styled-hui-element";
import { PictureElementsCardConfig } from "./types";

@customElement("hui-picture-elements-card")
class HuiPictureElementsCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _elements?: LovelaceElement[];

  public static getStubConfig(
    opp: OpenPeerPower,
    entities: string[],
    entitiesFallback: string[]
  ): PictureElementsCardConfig {
    const maxEntities = 1;
    const foundEntities = findEntities(
      opp,
      maxEntities,
      entities,
      entitiesFallback,
      ["sensor", "binary_sensor"]
    );

    return {
      type: "picture-elements",
      elements: [
        {
          type: "state-badge",
          entity: foundEntities[0] || "",
          style: {
            top: "32%",
            left: "40%",
          },
        },
      ],
      image: "https://demo.openpeerpower.io/stub_config/floorplan.png",
    };
  }

  @internalProperty() private _config?: PictureElementsCardConfig;

  public getCardSize(): number {
    return 4;
  }

  public setConfig(config: PictureElementsCardConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    } else if (
      !(config.image || config.camera_image || config.state_image) ||
      (config.state_image && !config.entity)
    ) {
      throw new Error("Image required");
    } else if (!Array.isArray(config.elements)) {
      throw new Error("Elements required");
    }

    this._config = config;

    this._elements = this._config.elements.map(
      (elementConfig: LovelaceElementConfig) => {
        const element = createStyledHuiElement(elementConfig);
        if (this.opp) {
          element.opp = this.opp;
        }
        return element as LovelaceElement;
      }
    );
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.opp) {
      return;
    }

    if (this._elements && changedProps.has("opp")) {
      for (const element of this._elements) {
        element.opp = this.opp;
      }
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProps.get("_config") as
      | PictureElementsCardConfig
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
    if (!this.opp || !this._config) {
      return html``;
    }

    return html`
      <ha-card .header=${this._config.title}>
        <div id="root">
          <hui-image
            .opp=${this.opp}
            .image=${this._config.image}
            .stateImage=${this._config.state_image}
            .stateFilter=${this._config.state_filter}
            .cameraImage=${this._config.camera_image}
            .cameraView=${this._config.camera_view}
            .entity=${this._config.entity}
            .aspectRatio=${this._config.aspect_ratio}
            .darkModeFilter=${this._config.dark_mode_filter}
            .darkModeImage=${this._config.dark_mode_image}
          ></hui-image>
          ${this._elements}
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResult {
    return css`
      #root {
        position: relative;
      }

      .element {
        position: absolute;
        transform: translate(-50%, -50%);
      }

      ha-card {
        overflow: hidden;
        height: 100%;
        box-sizing: border-box;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-picture-elements-card": HuiPictureElementsCard;
  }
}
