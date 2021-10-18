import "@material/mwc-button";
import "@polymer/paper-tooltip/paper-tooltip";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import { formatDateTime } from "../../common/datetime/format_date_time";
import "../../components/ha-markdown";
import "../../components/op-relative-time";
import { PersistentNotification } from "../../data/persistent_notification";
import { OpenPeerPower } from "../../types";
import "./notification-item-template";

@customElement("persistent-notification-item")
export class HuiPersistentNotificationItem extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public notification?: PersistentNotification;

  protected render(): TemplateResult {
    if (!this.opp || !this.notification) {
      return html``;
    }

    return html`
      <notification-item-template>
        <span slot="header"> ${this.notification.title} </span>

        <op-markdown
          breaks
          content="${this.notification.message}"
        ></op-markdown>

        <div class="time">
          <span>
            <op-relative-time
              .opp=${this.opp}
              .datetime="${this.notification.created_at}"
            ></op-relative-time>
            <paper-tooltip animation-delay="0">
              ${this._computeTooltip(this.opp, this.notification)}
            </paper-tooltip>
          </span>
        </div>

        <mwc-button slot="actions" @click="${this._handleDismiss}"
          >${this.opp.localize(
            "ui.card.persistent_notification.dismiss"
          )}</mwc-button
        >
      </notification-item-template>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .time {
        display: flex;
        justify-content: flex-end;
        margin-top: 6px;
      }
      op-relative-time {
        color: var(--secondary-text-color);
      }
      a {
        color: var(--primary-color);
      }
      ha-markdown {
        overflow-wrap: break-word;
      }
    `;
  }

  private _handleDismiss(): void {
    this.opp!.callService("persistent_notification", "dismiss", {
      notification_id: this.notification!.notification_id,
    });
  }

  private _computeTooltip(
    opp: OpenPeerPower,
    notification: PersistentNotification
  ): string | undefined {
    if (!opp || !notification) {
      return undefined;
    }

    const d = new Date(notification.created_at!);
    return formatDateTime(d, opp.locale);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "persistent-notification-item": HuiPersistentNotificationItem;
  }
}
