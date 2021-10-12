import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../../../src/components/op-circular-progress";
import { OppioAddonDetails } from "../../../../src/data/oppio/addon";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import { haStyle } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { oppioStyle } from "../../resources/oppio-style";
import "./oppio-addon-info";

@customElement("oppio-addon-info-tab")
class OppioAddonInfoDashboard extends LitElement {
  @property({ type: Boolean }) public narrow!: boolean;

  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public addon?: OppioAddonDetails;

  protected render(): TemplateResult {
    if (!this.addon) {
      return html`<op-circular-progress active></op-circular-progress>`;
    }

    return html`
      <div class="content">
        <oppio-addon-info
          .narrow=${this.narrow}
          .opp=${this.opp}
          .supervisor=${this.supervisor}
          .addon=${this.addon}
        ></oppio-addon-info>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      oppioStyle,
      css`
        .content {
          margin: auto;
          padding: 8px;
          max-width: 1024px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-info-tab": OppioAddonInfoDashboard;
  }
}
