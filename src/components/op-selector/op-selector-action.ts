import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { Action } from "../../data/script";
import { ActionSelector } from "../../data/selector";
import "../../panels/config/automation/action/op-automation-action";
import { OpenPeerPower } from "../../types";

@customElement("op-selector-action")
export class HaActionSelector extends LitElement {
  @property() public opp!: OpenPeerPower;

  @property() public selector!: ActionSelector;

  @property() public value?: Action;

  @property() public label?: string;

  @property({ type: Boolean, reflect: true }) public disabled = false;

  protected render() {
    return html`<op-automation-action
      .disabled=${this.disabled}
      .actions=${this.value || []}
      .opp=${this.opp}
    ></op-automation-action>`;
  }

  static get styles(): CSSResultGroup {
    return css`
      op-automation-action {
        display: block;
        margin-bottom: 16px;
      }
      :host([disabled]) op-automation-action {
        opacity: var(--light-disabled-opacity);
        pointer-events: none;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-selector-action": HaActionSelector;
  }
}
