import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { LogbookEntry } from "../../data/logbook";
import { OpenPeerPower } from "../../types";
import "./hat-logbook-note";
import "../../panels/logbook/op-logbook";
import { TraceExtended } from "../../data/trace";

@customElement("op-trace-logbook")
export class HaTraceLogbook extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean, reflect: true }) public narrow!: boolean;

  @property({ attribute: false }) public trace!: TraceExtended;

  @property({ attribute: false }) public logbookEntries!: LogbookEntry[];

  protected render(): TemplateResult {
    return this.logbookEntries.length
      ? html`
          <op-logbook
            relative-time
            .opp=${this.opp}
            .entries=${this.logbookEntries}
            .narrow=${this.narrow}
          ></op-logbook>
          <hat-logbook-note .domain=${this.trace.domain}></hat-logbook-note>
        `
      : html`<div class="padded-box">
          No Logbook entries found for this step.
        </div>`;
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        .padded-box {
          padding: 16px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-trace-logbook": HaTraceLogbook;
  }
}
