import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  queryAll,
  TemplateResult,
} from "lit-element";
import { computeStateName } from "../../../common/entity/compute_state_name";
import "../../../components/entity/state-badge";
import type { StateBadge } from "../../../components/entity/state-badge";
import type { ActionHandlerEvent } from "../../../data/lovelace";
import type { OpenPeerPower } from "../../../types";
import type { EntitiesCardEntityConfig } from "../cards/types";
import { computeTooltip } from "../common/compute-tooltip";
import { actionHandler } from "../common/directives/action-handler-directive";
import { handleAction } from "../common/handle-action";
import { hasAction } from "../common/has-action";

@customElement("hui-buttons-base")
export class HuiButtonsBase extends LitElement {
  @property() public configEntities?: EntitiesCardEntityConfig[];

  @queryAll("state-badge") protected _badges!: StateBadge[];

  private _opp?: OpenPeerPower;

  set opp(opp: OpenPeerPower) {
    this._opp = opp;
    const entitiesShowingIcons = this.configEntities?.filter(
      (entity) => entity.show_icon !== false
    );
    this._badges.forEach((badge, index: number) => {
      badge.opp = opp;
      badge.stateObj = opp.states[entitiesShowingIcons![index].entity];
    });
  }

  protected render(): TemplateResult | void {
    return html`
      ${(this.configEntities || []).map((entityConf) => {
        const stateObj = this._opp!.states[entityConf.entity];

        return html`
          <div
            @action=${this._handleAction}
            .actionHandler=${actionHandler({
              hasHold: hasAction(entityConf.hold_action),
              hasDoubleClick: hasAction(entityConf.double_tap_action),
            })}
            .config=${entityConf}
            tabindex="0"
          >
            ${entityConf.show_icon !== false
              ? html`
                  <state-badge
                    title=${computeTooltip(this._opp!, entityConf)}
                    .opp=${this._opp}
                    .stateObj=${stateObj}
                    .overrideIcon=${entityConf.icon}
                    .overrideImage=${entityConf.image}
                    stateColor
                  ></state-badge>
                `
              : ""}
            <span>
              ${(entityConf.show_name && stateObj) ||
              (entityConf.name && entityConf.show_name !== false)
                ? entityConf.name || computeStateName(stateObj)
                : ""}
            </span>
          </div>
        `;
      })}
    `;
  }

  private _handleAction(ev: ActionHandlerEvent) {
    const config = (ev.currentTarget as any).config as EntitiesCardEntityConfig;
    handleAction(this, this._opp!, config, ev.detail.action!);
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: flex;
        justify-content: space-evenly;
      }
      div {
        cursor: pointer;
        align-items: center;
        display: inline-flex;
        outline: none;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-buttons-base": HuiButtonsBase;
  }
}
