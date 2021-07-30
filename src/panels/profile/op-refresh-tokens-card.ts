import "@material/mwc-icon-button/mwc-icon-button";
import { mdiDelete } from "@mdi/js";
import "@polymer/paper-tooltip/paper-tooltip";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import relativeTime from "../../common/datetime/relative_time";
import { fireEvent } from "../../common/dom/fire_event";
import "../../components/ha-card";
import "../../components/ha-settings-row";
import "../../components/ha-svg-icon";
import { RefreshToken } from "../../data/refresh_token";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../dialogs/generic/show-dialog-box";
import { haStyle } from "../../resources/styles";
import { OpenPeerPower } from "../../types";

const compareTokenLastUsedAt = (tokenA: RefreshToken, tokenB: RefreshToken) => {
  const timeA = tokenA.last_used_at ? new Date(tokenA.last_used_at) : 0;
  const timeB = tokenB.last_used_at ? new Date(tokenB.last_used_at) : 0;
  if (timeA < timeB) {
    return 1;
  }
  if (timeA > timeB) {
    return -1;
  }
  return 0;
};

@customElement("ha-refresh-tokens-card")
class HaRefreshTokens extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public refreshTokens?: RefreshToken[];

  private _refreshTokens = memoizeOne(
    (refreshTokens: RefreshToken[]): RefreshToken[] =>
      refreshTokens
        ?.filter((token) => token.type === "normal")
        .sort(compareTokenLastUsedAt)
  );

  protected render(): TemplateResult {
    const refreshTokens = this._refreshTokens(this.refreshTokens!);
    return html`<op-card
      .header=${this.opp.localize("ui.panel.profile.refresh_tokens.header")}
    >
      <div class="card-content">
        ${this.opp.localize("ui.panel.profile.refresh_tokens.description")}
        ${refreshTokens?.length
          ? refreshTokens!.map(
              (token) => html`<op-settings-row three-line>
                <span slot="heading"
                  >${this.opp.localize(
                    "ui.panel.profile.refresh_tokens.token_title",
                    "clientId",
                    token.client_id
                  )}
                </span>
                <div slot="description">
                  ${this.opp.localize(
                    "ui.panel.profile.refresh_tokens.created_at",
                    "date",
                    relativeTime(new Date(token.created_at), this.opp.localize)
                  )}
                </div>
                <div slot="description">
                  ${token.last_used_at
                    ? this.opp.localize(
                        "ui.panel.profile.refresh_tokens.last_used",
                        "date",
                        relativeTime(
                          new Date(token.last_used_at),
                          this.opp.localize
                        ),
                        "location",
                        token.last_used_ip
                      )
                    : this.opp.localize(
                        "ui.panel.profile.refresh_tokens.not_used"
                      )}
                </div>
                <div>
                  ${token.is_current
                    ? html`<paper-tooltip animation-delay="0" position="left">
                        ${this.opp.localize(
                          "ui.panel.profile.refresh_tokens.current_token_tooltip"
                        )}
                      </paper-tooltip>`
                    : ""}
                  <mwc-icon-button
                    .token=${token}
                    .disabled=${token.is_current}
                    .title=${this.opp.localize(`ui.common.delete`)}
                    @click=${this._deleteToken}
                  >
                    <op-svg-icon .path=${mdiDelete}></op-svg-icon>
                  </mwc-icon-button>
                </div>
              </op-settings-row>`
            )
          : ""}
      </div>
    </op-card>`;
  }

  private async _deleteToken(ev: Event): Promise<void> {
    const token = (ev.currentTarget as any).token;
    if (
      !(await showConfirmationDialog(this, {
        text: this.opp.localize(
          "ui.panel.profile.refresh_tokens.confirm_delete",
          "name",
          token.client_name || token.client_id
        ),
      }))
    ) {
      return;
    }
    try {
      await this.opp.callWS({
        type: "auth/delete_refresh_token",
        refresh_token_id: token.id,
      });
      fireEvent(this, "opp-refresh-tokens");
    } catch (err) {
      await showAlertDialog(this, {
        title: this.opp.localize(
          "ui.panel.profile.refresh_tokens.delete_failed"
        ),
        text: err.message,
      });
    }
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        ha-settings-row {
          padding: 0;
        }
        mwc-icon-button {
          color: var(--primary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-refresh-tokens-card": HaRefreshTokens;
  }
}
