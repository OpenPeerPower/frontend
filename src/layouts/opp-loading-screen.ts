import "@polymer/app-layout/app-toolbar/app-toolbar";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../components/op-circular-progress";
import "../components/op-icon-button-arrow-prev";
import "../components/ha-menu-button";
import { haStyle } from "../resources/styles";
import { OpenPeerPower } from "../types";

@customElement("opp-loading-screen")
class OppLoadingScreen extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property({ type: Boolean, attribute: "no-toolbar" })
  public noToolbar = false;

  @property({ type: Boolean }) public rootnav = false;

  @property() public narrow?: boolean;

  protected render(): TemplateResult {
    return html`
      ${this.noToolbar
        ? ""
        : html`<div class="toolbar">
            ${this.rootnav || history.state?.root
              ? html`
                  <op-menu-button
                    .opp=${this.opp}
                    .narrow=${this.narrow}
                  ></op-menu-button>
                `
              : html`
                  <op-icon-button-arrow-prev
                    .opp=${this.opp}
                    @click=${this._handleBack}
                  ></op-icon-button-arrow-prev>
                `}
          </div>`}
      <div class="content">
        <op-circular-progress active></op-circular-progress>
      </div>
    `;
  }

  private _handleBack() {
    history.back();
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      css`
        :host {
          display: block;
          height: 100%;
          background-color: var(--primary-background-color);
        }
        .toolbar {
          display: flex;
          align-items: center;
          font-size: 20px;
          height: var(--header-height);
          padding: 0 16px;
          pointer-events: none;
          background-color: var(--app-header-background-color);
          font-weight: 400;
          color: var(--app-header-text-color, white);
          border-bottom: var(--app-header-border-bottom, none);
          box-sizing: border-box;
        }
        ha-menu-button,
        op-icon-button-arrow-prev {
          pointer-events: auto;
        }
        .content {
          height: calc(100% - var(--header-height));
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "opp-loading-screen": OppLoadingScreen;
  }
}
