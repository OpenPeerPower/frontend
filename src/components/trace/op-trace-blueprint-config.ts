import { dump } from "js-yaml";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../op-code-editor";
import "../op-icon-button";
import { TraceExtended } from "../../data/trace";
import { OpenPeerPower } from "../../types";

@customElement("op-trace-blueprint-config")
export class HaTraceBlueprintConfig extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public trace!: TraceExtended;

  protected render(): TemplateResult {
    return html`
      <op-code-editor
        .value=${dump(this.trace.blueprint_inputs || "").trimRight()}
        readOnly
      ></op-code-editor>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-trace-blueprint-config": HaTraceBlueprintConfig;
  }
}
