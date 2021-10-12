import "../../../../src/components/ha-card";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import "../../../../src/components/op-circular-progress";
import "../../../../src/components/ha-markdown";
import { customElement, property, state } from "lit/decorators";
import {
  fetchOppioAddonDocumentation,
  OppioAddonDetails,
} from "../../../../src/data/oppio/addon";
import { extractApiErrorMessage } from "../../../../src/data/oppio/common";
import "../../../../src/layouts/opp-loading-screen";
import { haStyle } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { oppioStyle } from "../../resources/oppio-style";
import { Supervisor } from "../../../../src/data/supervisor/supervisor";

@customElement("oppio-addon-documentation-tab")
class OppioAddonDocumentationDashboard extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public supervisor!: Supervisor;

  @property({ attribute: false }) public addon?: OppioAddonDetails;

  @state() private _error?: string;

  @state() private _content?: string;

  public async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this._loadData();
  }

  protected render(): TemplateResult {
    if (!this.addon) {
      return html`<op-circular-progress active></op-circular-progress>`;
    }
    return html`
      <div class="content">
        <op-card>
          ${this._error ? html` <div class="errors">${this._error}</div> ` : ""}
          <div class="card-content">
            ${this._content
              ? html`<op-markdown .content=${this._content}></op-markdown>`
              : html`<opp-loading-screen no-toolbar></opp-loading-screen>`}
          </div>
        </op-card>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      oppioStyle,
      css`
        ha-card {
          display: block;
        }
        .content {
          margin: auto;
          padding: 8px;
          max-width: 1024px;
        }
        ha-markdown {
          padding: 16px;
        }
      `,
    ];
  }

  private async _loadData(): Promise<void> {
    this._error = undefined;
    try {
      this._content = await fetchOppioAddonDocumentation(
        this.opp,
        this.addon!.slug
      );
    } catch (err) {
      this._error = this.supervisor.localize(
        "addon.documentation.get_logs",
        "error",
        extractApiErrorMessage(err)
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-addon-documentation-tab": OppioAddonDocumentationDashboard;
  }
}
