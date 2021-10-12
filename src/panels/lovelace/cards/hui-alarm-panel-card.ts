import "@polymer/paper-input/paper-input";
import type { PaperInputElement } from "@polymer/paper-input/paper-input";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  query,
  TemplateResult,
} from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { applyThemesOnElement } from "../../../common/dom/apply_themes_on_element";
import { fireEvent } from "../../../common/dom/fire_event";
import "../../../components/op-card";
import "../../../components/ha-label-badge";
import {
  callAlarmAction,
  FORMAT_NUMBER,
} from "../../../data/alarm_control_panel";
import type { OpenPeerPower } from "../../../types";
import { findEntities } from "../common/find-entities";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import type { LovelaceCard } from "../types";
import { AlarmPanelCardConfig } from "./types";

const ICONS = {
  armed_away: "opp:shield-lock",
  armed_custom_bypass: "opp:security",
  armed_home: "opp:shield-home",
  armed_night: "opp:shield-home",
  disarmed: "opp:shield-check",
  pending: "opp:shield-outline",
  triggered: "opp:bell-ring",
};

const BUTTONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "clear"];

@customElement("hui-alarm-panel-card")
class HuiAlarmPanelCard extends LitElement implements LovelaceCard {
  public static async getConfigElement() {
    await import("../editor/config-elements/hui-alarm-panel-card-editor");
    return document.createElement("hui-alarm-panel-card-editor");
  }

  public static getStubConfig(
    opp: OpenPeerPower,
    entities: string[],
    entitiesFallback: string[]
  ): AlarmPanelCardConfig {
    const includeDomains = ["alarm_control_panel"];
    const maxEntities = 1;
    const foundEntities = findEntities(
      opp,
      maxEntities,
      entities,
      entitiesFallback,
      includeDomains
    );

    return {
      type: "alarm-panel",
      states: ["arm_home", "arm_away"],
      entity: foundEntities[0] || "",
    };
  }

  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: AlarmPanelCardConfig;

  @query("#alarmCode") private _input?: PaperInputElement;

  public async getCardSize(): Promise<number> {
    if (!this._config || !this.opp) {
      return 9;
    }

    const stateObj = this.opp.states[this._config.entity];

    return !stateObj || stateObj.attributes.code_format !== FORMAT_NUMBER
      ? 4
      : 9;
  }

  public setConfig(config: AlarmPanelCardConfig): void {
    if (
      !config ||
      !config.entity ||
      config.entity.split(".")[0] !== "alarm_control_panel"
    ) {
      throw new Error("Invalid configuration");
    }

    const defaults = {
      states: ["arm_away", "arm_home"],
    };

    this._config = { ...defaults, ...config };
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.opp) {
      return;
    }
    const oldOpp = changedProps.get("opp") as OpenPeerPower | undefined;
    const oldConfig = changedProps.get("_config") as
      | AlarmPanelCardConfig
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
      oldOpp.states[this._config!.entity] !==
      this.opp!.states[this._config!.entity]
    );
  }

  protected render(): TemplateResult {
    if (!this._config || !this.opp) {
      return html``;
    }
    const stateObj = this.opp.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.opp, this._config.entity)}
        </hui-warning>
      `;
    }

    return html`
      <op-card
        .header="${this._config.name ||
        stateObj.attributes.friendly_name ||
        this._stateDisplay(stateObj.state)}"
      >
        <op-label-badge
          class="${classMap({ [stateObj.state]: true })}"
          .icon="${ICONS[stateObj.state] || "opp:shield-outline"}"
          .label="${this._stateIconLabel(stateObj.state)}"
          @click=${this._handleMoreInfo}
        ></op-label-badge>
        <div id="armActions" class="actions">
          ${(stateObj.state === "disarmed"
            ? this._config.states!
            : ["disarm"]
          ).map((state) => {
            return html`
              <mwc-button
                .action="${state}"
                @click="${this._handleActionClick}"
                outlined
              >
                ${this._actionDisplay(state)}
              </mwc-button>
            `;
          })}
        </div>
        ${!stateObj.attributes.code_format
          ? html``
          : html`
              <paper-input
                id="alarmCode"
                .label=${this.opp.localize("ui.card.alarm_control_panel.code")}
                type="password"
                .inputmode=${stateObj.attributes.code_format === FORMAT_NUMBER
                  ? "numeric"
                  : "text"}
              ></paper-input>
            `}
        ${stateObj.attributes.code_format !== FORMAT_NUMBER
          ? html``
          : html`
              <div id="keypad">
                ${BUTTONS.map((value) => {
                  return value === ""
                    ? html` <mwc-button disabled></mwc-button> `
                    : html`
                        <mwc-button
                          .value="${value}"
                          @click="${this._handlePadClick}"
                          outlined
                          class=${classMap({
                            numberkey: value !== "clear",
                          })}
                        >
                          ${value === "clear"
                            ? this.opp!.localize(
                                `ui.card.alarm_control_panel.clear_code`
                              )
                            : value}
                        </mwc-button>
                      `;
                })}
              </div>
            `}
      </op-card>
    `;
  }

  private _stateIconLabel(state: string): string {
    const stateLabel = state.split("_").pop();
    return stateLabel === "disarmed" ||
      stateLabel === "triggered" ||
      !stateLabel
      ? ""
      : this._stateDisplay(state);
  }

  private _actionDisplay(state: string): string {
    return this.opp!.localize(`ui.card.alarm_control_panel.${state}`);
  }

  private _stateDisplay(state: string): string {
    return this.opp!.localize(`component.alarm_control_panel.state._.${state}`);
  }

  private _handlePadClick(e: MouseEvent): void {
    const val = (e.currentTarget! as any).value;
    this._input!.value = val === "clear" ? "" : this._input!.value + val;
  }

  private _handleActionClick(e: MouseEvent): void {
    const input = this._input;
    callAlarmAction(
      this.opp!,
      this._config!.entity,
      (e.currentTarget! as any).action,
      input?.value || undefined
    );
    if (input) {
      input.value = "";
    }
  }

  private _handleMoreInfo() {
    fireEvent(this, "opp-more-info", {
      entityId: this._config!.entity,
    });
  }

  static get styles(): CSSResult {
    return css`
      op-card {
        padding-bottom: 16px;
        position: relative;
        height: 100%;
        box-sizing: border-box;
        --alarm-color-disarmed: var(--label-badge-green);
        --alarm-color-pending: var(--label-badge-yellow);
        --alarm-color-triggered: var(--label-badge-red);
        --alarm-color-armed: var(--label-badge-red);
        --alarm-color-autoarm: rgba(0, 153, 255, 0.1);
        --alarm-state-color: var(--alarm-color-armed);
      }

      ha-label-badge {
        --op-label-badge-color: var(--alarm-state-color);
        --label-badge-text-color: var(--alarm-state-color);
        --label-badge-background-color: var(--card-background-color);
        color: var(--alarm-state-color);
        position: absolute;
        right: 12px;
        top: 8px;
        cursor: pointer;
      }

      .disarmed {
        --alarm-state-color: var(--alarm-color-disarmed);
      }

      .triggered {
        --alarm-state-color: var(--alarm-color-triggered);
        animation: pulse 1s infinite;
      }

      .arming {
        --alarm-state-color: var(--alarm-color-pending);
        animation: pulse 1s infinite;
      }

      .pending {
        --alarm-state-color: var(--alarm-color-pending);
        animation: pulse 1s infinite;
      }

      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      paper-input {
        margin: 0 auto 8px;
        max-width: 150px;
        text-align: center;
      }

      .state {
        margin-left: 16px;
        position: relative;
        bottom: 16px;
        color: var(--alarm-state-color);
        animation: none;
      }

      #keypad {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        margin: auto;
        width: 100%;
        max-width: 300px;
      }

      #keypad mwc-button {
        padding: 8px;
        width: 30%;
        box-sizing: border-box;
      }

      .actions {
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
      }

      .actions mwc-button {
        margin: 0 4px 4px;
      }

      mwc-button#disarm {
        color: var(--error-color);
      }

      mwc-button.numberkey {
        --mdc-typography-button-font-size: var(--keypad-font-size, 0.875rem);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-alarm-panel-card": HuiAlarmPanelCard;
  }
}
