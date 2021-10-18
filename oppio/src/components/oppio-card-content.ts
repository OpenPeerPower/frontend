import { mdiHelpCircle } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "../../../src/components/op-relative-time";
import "../../../src/components/op-svg-icon";
import { OpenPeerPower } from "../../../src/types";

@customElement("oppio-card-content")
class OppioCardContent extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public title!: string;

  @property() public description?: string;

  @property({ type: Boolean }) public available = true;

  @property({ type: Boolean }) public showTopbar = false;

  @property() public topbarClass?: string;

  @property() public datetime?: string;

  @property() public iconTitle?: string;

  @property() public iconClass?: string;

  @property() public icon = mdiHelpCircle;

  @property() public iconImage?: string;

  protected render(): TemplateResult {
    return html`
      ${this.showTopbar
        ? html` <div class="topbar ${this.topbarClass}"></div> `
        : ""}
      ${this.iconImage
        ? html`
            <div class="icon_image ${this.iconClass}">
              <img src="${this.iconImage}" .title=${this.iconTitle} />
              <div></div>
            </div>
          `
        : html`
            <op-svg-icon
              class=${this.iconClass!}
              .path=${this.icon}
              .title=${this.iconTitle}
            ></op-svg-icon>
          `}
      <div>
        <div class="title">${this.title}</div>
        <div class="addition">
          ${this.description}
          ${
            /* treat as available when undefined */
            this.available === false ? " (Not available)" : ""
          }
          ${this.datetime
            ? html`
                <op-relative-time
                  .opp=${this.opp}
                  class="addition"
                  .datetime=${this.datetime}
                ></op-relative-time>
              `
            : undefined}
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      op-svg-icon {
        margin-right: 24px;
        margin-left: 8px;
        margin-top: 12px;
        float: left;
        color: var(--secondary-text-color);
      }
      op-svg-icon.update {
        color: var(--paper-orange-400);
      }
      op-svg-icon.running,
      op-svg-icon.installed {
        color: var(--paper-green-400);
      }
      op-svg-icon.oppupdate,
      op-svg-icon.snapshot {
        color: var(--paper-item-icon-color);
      }
      op-svg-icon.not_available {
        color: var(--error-color);
      }
      .title {
        color: var(--primary-text-color);
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .addition {
        color: var(--secondary-text-color);
        overflow: hidden;
        position: relative;
        height: 2.4em;
        line-height: 1.2em;
      }
      op-relative-time {
        display: block;
      }
      .icon_image img {
        max-height: 40px;
        max-width: 40px;
        margin-top: 4px;
        margin-right: 16px;
        float: left;
      }
      .icon_image.stopped,
      .icon_image.not_available {
        filter: grayscale(1);
      }
      .dot {
        position: absolute;
        background-color: var(--paper-orange-400);
        width: 12px;
        height: 12px;
        top: 8px;
        right: 8px;
        border-radius: 50%;
      }
      .topbar {
        position: absolute;
        width: 100%;
        height: 2px;
        top: 0;
        left: 0;
        border-top-left-radius: 2px;
        border-top-right-radius: 2px;
      }
      .topbar.installed {
        background-color: var(--primary-color);
      }
      .topbar.update {
        background-color: var(--accent-color);
      }
      .topbar.unavailable {
        background-color: var(--error-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oppio-card-content": OppioCardContent;
  }
}
