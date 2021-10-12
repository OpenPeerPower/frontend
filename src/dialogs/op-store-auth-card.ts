import { LitElement, TemplateResult, html, css } from "lit";
import { property } from "lit/decorators";
import { enableWrite } from "../common/auth/token_storage";
import { OpenPeerPower } from "../types";
import "../components/op-card";
import type { HaCard } from "../components/op-card";
import "@material/mwc-button/mwc-button";

class HaStoreAuth extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  protected render(): TemplateResult {
    return html`
      <op-card>
        <div class="card-content">
          ${this.opp.localize("ui.auth_store.ask")}
        </div>
        <div class="card-actions">
          <mwc-button @click=${this._dismiss}>
            ${this.opp.localize("ui.auth_store.decline")}
          </mwc-button>
          <mwc-button raised @click=${this._save}>
            ${this.opp.localize("ui.auth_store.confirm")}
          </mwc-button>
        </div>
      </op-card>
    `;
  }

  firstUpdated() {
    this.classList.toggle("small", window.innerWidth < 600);
  }

  private _save(): void {
    enableWrite();
    this._dismiss();
  }

  private _dismiss(): void {
    const card = this.shadowRoot!.querySelector("op-card") as HaCard;
    card.style.bottom = `-${card.offsetHeight + 8}px`;
    setTimeout(() => this.parentNode!.removeChild(this), 300);
  }

  static get styles() {
    return css`
      op-card {
        position: fixed;
        padding: 8px 0;
        bottom: 16px;
        right: 16px;
        transition: bottom 0.25s;
        --op-card-box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2),
          0px 6px 10px 0px rgba(0, 0, 0, 0.14),
          0px 1px 18px 0px rgba(0, 0, 0, 0.12);
      }

      .card-actions {
        text-align: right;
        border-top: 0;
      }

      :host(.small) op-card {
        bottom: 0;
        left: 0;
        right: 0;
      }
    `;
  }
}

customElements.define("op-store-auth-card", HaStoreAuth);

declare global {
  interface HTMLElementTagNameMap {
    "op-store-auth-card": HaStoreAuth;
  }
}
