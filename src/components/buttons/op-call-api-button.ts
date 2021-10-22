import { css, CSSResultGroup, html, LitElement } from "lit";
import { property, query } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import { OpenPeerPower } from "../../types";
import "./op-progress-button";

class HaCallApiButton extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public method: "POST" | "GET" | "PUT" | "DELETE" = "POST";

  @property() public data = {};

  @property({ type: Boolean, reflect: true }) public disabled = false;

  @property({ type: Boolean }) public progress = false;

  @property() public path?: string;

  @query("op-progress-button", true) private _progressButton;

  render() {
    return html`
      <op-progress-button
        .progress=${this.progress}
        @click=${this._buttonTapped}
        ?disabled=${this.disabled}
        ><slot></slot
      ></op-progress-button>
    `;
  }

  async _buttonTapped() {
    this.progress = true;
    const eventData: {
      method: string;
      path: string;
      data: any;
      success?: boolean;
      response?: any;
    } = {
      method: this.method,
      path: this.path!,
      data: this.data,
    };

    try {
      const resp = await this.opp.callApi(this.method, this.path!, this.data);
      this.progress = false;
      this._progressButton.actionSuccess();
      eventData.success = true;
      eventData.response = resp;
    } catch (err) {
      this.progress = false;
      this._progressButton.actionError();
      eventData.success = false;
      eventData.response = err;
    }

    fireEvent(this, "opp-api-called", eventData as any);
  }

  static get styles(): CSSResultGroup {
    return css`
      :host([disabled]) {
        pointer-events: none;
      }
    `;
  }
}

customElements.define("op-call-api-button", HaCallApiButton);

declare global {
  interface HTMLElementTagNameMap {
    "op-call-api-button": HaCallApiButton;
  }
}
