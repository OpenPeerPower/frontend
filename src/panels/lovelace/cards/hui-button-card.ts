import "@material/mwc-ripple";
import type { Ripple } from "@material/mwc-ripple";
import { RippleHandlers } from "@material/mwc-ripple/ripple-handlers";
import { OppEntity } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  eventOptions,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  queryAsync,
  TemplateResult,
} from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import { styleMap } from "lit-html/directives/style-map";
import { DOMAINS_TOGGLE } from "../../../common/const";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { computeActiveState } from "../../../common/entity/compute_active_state";
import { computeDomain } from "../../../common/entity/compute_domain";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { computeStateDomain } from "../../../common/entity/compute_state_domain";
import { computeStateName } from "../../../common/entity/compute_state_name";
import { stateIcon } from "../../../common/entity/state_icon";
import { isValidEntityId } from "../../../common/entity/valid_entity_id";
import { iconColorCSS } from "../../../common/style/icon_color_css";
import "../../../components/op-card";
import { LightEntity } from "../../../data/light";
import { ActionHandlerEvent } from "../../../data/lovelace";
import { OpenPeerPower } from "../../../types";
import { actionHandler } from "../common/directives/action-handler-directive";
import { findEntities } from "../common/find-entities";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import { LovelaceCard, LovelaceCardEditor } from "../types";
import { ButtonCardConfig } from "./types";

@customElement("hui-button-card")
export class HuiButtonCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("../editor/config-elements/hui-button-card-editor");
    return document.createElement("hui-button-card-editor");
  }

  public static getStubConfig(
    opp: OpenPeerPower,
    entities: string[],
    entitiesFallback: string[]
  ): ButtonCardConfig {
    const maxEntities = 1;
    const foundEntities = findEntities(
      opp,
      maxEntities,
      entities,
      entitiesFallback,
      ["light", "switch"]
    );

    return {
      type: "button",
      tap_action: {
        action: "toggle",
      },
      entity: foundEntities[0] || "",
    };
  }

  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: ButtonCardConfig;

  @queryAsync("mwc-ripple") private _ripple!: Promise<Ripple | null>;

  @internalProperty() private _shouldRenderRipple = false;

  public getCardSize(): number {
    return (
      (this._config?.show_icon ? 4 : 0) + (this._config?.show_name ? 1 : 0)
    );
  }

  public setConfig(config: ButtonCardConfig): void {
    if (config.entity && !isValidEntityId(config.entity)) {
      throw new Error("Invalid entity");
    }

    this._config = {
      tap_action: {
        action:
          config.entity && DOMAINS_TOGGLE.has(computeDomain(config.entity))
            ? "toggle"
            : "more-info",
      },
      hold_action: { action: "more-info" },
      show_icon: true,
      show_name: true,
      state_color: true,
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has("_config")) {
      return true;
    }

    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;

    if (
      !oldOpp ||
      oldOpp.themes !== this.opp!.themes ||
      oldOpp.locale !== this.opp!.locale
    ) {
      return true;
    }

    return (
      Boolean(this._config!.entity) &&
      oldOpp.states[this._config!.entity!] !==
        this.opp!.states[this._config!.entity!]
    );
  }

  protected render(): TemplateResult {
    if (!this._config || !this.opp) {
      return html``;
    }
    const stateObj = this._config.entity
      ? this.opp.states[this._config.entity]
      : undefined;

    if (this._config.entity && !stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.opp, this._config.entity)}
        </hui-warning>
      `;
    }

    return html`
      <op-card
        @action=${this._handleAction}
        @focus="${this.handleRippleFocus}"
        @blur="${this.handleRippleBlur}"
        @mousedown="${this.handleRippleActivate}"
        @mouseup="${this.handleRippleDeactivate}"
        @touchstart="${this.handleRippleActivate}"
        @touchend="${this.handleRippleDeactivate}"
        @touchcancel="${this.handleRippleDeactivate}"
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config!.hold_action),
          hasDoubleClick: hasAction(this._config!.double_tap_action),
        })}
        tabindex=${ifDefined(
          hasAction(this._config.tap_action) ? "0" : undefined
        )}
      >
        ${this._config.show_icon
          ? html`
              <op-icon
                tabindex="-1"
                data-domain=${ifDefined(
                  this._config.state_color && stateObj
                    ? computeStateDomain(stateObj)
                    : undefined
                )}
                data-state=${ifDefined(
                  stateObj ? computeActiveState(stateObj) : undefined
                )}
                .icon=${this._config.icon ||
                (stateObj ? stateIcon(stateObj) : "")}
                style=${styleMap({
                  filter: stateObj ? this._computeBrightness(stateObj) : "",
                  color: stateObj ? this._computeColor(stateObj) : "",
                  height: this._config.icon_height
                    ? this._config.icon_height
                    : "",
                })}
              ></op-icon>
            `
          : ""}
        ${this._config.show_name
          ? html`
              <span tabindex="-1">
                ${this._config.name ||
                (stateObj ? computeStateName(stateObj) : "")}
              </span>
            `
          : ""}
        ${this._config.show_state && stateObj
          ? html`<span class="state">
              ${computeStateDisplay(
                this.opp.localize,
                stateObj,
                this.opp.locale
              )}
            </span>`
          : ""}
        ${this._shouldRenderRipple ? html`<mwc-ripple></mwc-ripple>` : ""}
      </op-card>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.opp) {
      return;
    }
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProps.get("_config") as
      | ButtonCardConfig
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

  private _rippleHandlers: RippleHandlers = new RippleHandlers(() => {
    this._shouldRenderRipple = true;
    return this._ripple;
  });

  @eventOptions({ passive: true })
  private handleRippleActivate(evt?: Event) {
    this._rippleHandlers.startPress(evt);
  }

  private handleRippleDeactivate() {
    this._rippleHandlers.endPress();
  }

  private handleRippleFocus() {
    this._rippleHandlers.startFocus();
  }

  private handleRippleBlur() {
    this._rippleHandlers.endFocus();
  }

  static get styles(): CSSResult {
    return css`
      op-card {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 4% 0;
        font-size: 1.2rem;
        height: 100%;
        box-sizing: border-box;
        justify-content: center;
        position: relative;
      }

      op-card:focus {
        outline: none;
      }

      op-icon {
        width: 40%;
        height: auto;
        color: var(--paper-item-icon-color, #44739e);
        --mdc-icon-size: 100%;
      }

      op-icon + span {
        margin-top: 8px;
      }

      op-icon,
      span {
        outline: none;
      }

      .state {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
      }

      ${iconColorCSS}
    `;
  }

  private _computeBrightness(stateObj: OppEntity | LightEntity): string {
    if (!stateObj.attributes.brightness || !this._config?.state_color) {
      return "";
    }
    const brightness = stateObj.attributes.brightness;
    return `brightness(${(brightness + 245) / 5}%)`;
  }

  private _computeColor(stateObj: OppEntity | LightEntity): string {
    if (!stateObj.attributes.hs_color || !this._config?.state_color) {
      return "";
    }
    const [hue, sat] = stateObj.attributes.hs_color;
    if (sat <= 10) {
      return "";
    }
    return `hsl(${hue}, 100%, ${100 - sat / 2}%)`;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.opp!, this._config!, ev.detail.action!);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-button-card": HuiButtonCard;
  }
}
