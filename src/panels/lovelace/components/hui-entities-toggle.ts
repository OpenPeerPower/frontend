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
import { DOMAINS_TOGGLE } from "../../../common/const";
import "../../../components/op-switch";
import type { HaSwitch } from "../../../components/op-switch";
import { forwardHaptic } from "../../../data/haptics";
import type { OpenPeerPower } from "../../../types";
import { turnOnOffEntities } from "../common/entity/turn-on-off-entities";

@customElement("hui-entities-toggle")
class HuiEntitiesToggle extends LitElement {
  @property({ type: Array }) public entities?: string[];

  @property({ attribute: false }) protected opp?: OpenPeerPower;

  @internalProperty() private _toggleEntities?: string[];

  public updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has("entities")) {
      this._toggleEntities = this.entities!.filter(
        (entityId) =>
          entityId in this.opp!.states &&
          DOMAINS_TOGGLE.has(entityId.split(".", 1)[0])
      );
    }
  }

  protected render(): TemplateResult {
    if (!this._toggleEntities?.length) {
      return html``;
    }

    return html`
      <op-switch
        aria-label=${this.opp!.localize(
          "ui.panel.lovelace.card.entities.toggle"
        )}
        .checked=${this._toggleEntities!.some((entityId) => {
          const stateObj = this.opp!.states[entityId];
          return stateObj && stateObj.state === "on";
        })}
        @change=${this._callService}
      ></op-switch>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        width: 38px;
        display: block;
      }
      op-switch {
        padding: 13px 5px;
        margin: -4px -5px;
      }
    `;
  }

  private _callService(ev: MouseEvent): void {
    forwardHaptic("light");
    const turnOn = (ev.target as HaSwitch).checked;
    turnOnOffEntities(this.opp!, this._toggleEntities!, turnOn!);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-entities-toggle": HuiEntitiesToggle;
  }
}
