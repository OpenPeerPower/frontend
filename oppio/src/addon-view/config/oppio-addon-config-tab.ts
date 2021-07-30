import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../../../src/components/ha-circular-progress";
import { OppioAddonDetails } from "../../../../src/data/oppio/addon";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";
import { haStyle } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { oppioStyle } from "../../resources/oppio-style";
import "./oppio-addon-audio";
import "./oppio-addon-config";
import "./oppio-addon-network";

@customElement("oppio-addon-config-tab")
class OppioAddonConfigDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public addon?: OppioAddonDetails;

  protected render(): TemplateResult {
    if (!this.addon) {
      return html`<op-circular-progress active></op-circular-progress>`;
    }
    const hasConfiguration =
      (this.addon.options && Object.keys(this.addon.options).length) ||
      (this.addon.schema && Object.keys(this.addon.schema).length);

    return html`
      <div class="content">
        ${hasConfiguration || this.addon.network || this.addon.audio
          ? html`
              ${hasConfiguration
                ? html`
                    <oppio-addon-config
                      .opp=${this.opp}
                      .addon=${this.addon}
                      .supervisor=${this.supervisor}
                    ></oppio-addon-config>
                  `
                : ""}
              ${this.addon.network
                ? html`
                    <oppio-addon-network
                      .opp=${this.opp}
                      .addon=${this.addon}
                      .supervisor=${this.supervisor}
                    ></oppio-addon-network>
                  `
                : ""}
              ${this.addon.audio
                ? html`
                    <oppio-addon-audio
                      .opp=${this.opp}
                      .addon=${this.addon}
                      .supervisor=${this.supervisor}
                    ></oppio-addon-audio>
                  `
                : ""}
            `
          : this.supervisor.localize("addon.configuration.no_configuration")}
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
        oppio-addon-network,
        oppio-addon-audio,
        oppio-addon-config {
          margin-bottom: 24px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-config-tab": OppioAddonConfigDashboard;
  }
}
