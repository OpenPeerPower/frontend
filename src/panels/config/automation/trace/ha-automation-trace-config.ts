import { safeDump } from "js-yaml";
import {
  css,
  CSSResult,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { AutomationTraceExtended } from "../../../../data/trace";
import "../../../../components/ha-icon-button";
import "../../../../components/ha-code-editor";
import { OpenPeerPower } from "../../../../types";

@customElement("ha-automation-trace-config")
export class HaAutomationTraceConfig extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public trace!: AutomationTraceExtended;

  protected render(): TemplateResult {
    return html`
      <ha-code-editor
        .value=${safeDump(this.trace.config).trimRight()}
        readOnly
      ></ha-code-editor>
    `;
  }

  static get styles(): CSSResult[] {
    return [css``];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-automation-trace-config": HaAutomationTraceConfig;
  }
}
