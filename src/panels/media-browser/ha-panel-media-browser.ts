import "@material/mwc-icon-button";
import "@polymer/app-layout/app-header/app-header";
import "@polymer/app-layout/app-toolbar/app-toolbar";
import {
  css,
  CSSResultArray,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { LocalStorage } from "../../common/decorators/local-storage";
import { OPPDomEvent } from "../../common/dom/fire_event";
import { computeStateDomain } from "../../common/entity/compute_state_domain";
import { supportsFeature } from "../../common/entity/supports-feature";
import "../../components/ha-menu-button";
import "../../components/media-player/ha-media-player-browse";
import {
  BROWSER_PLAYER,
  MediaPickedEvent,
  SUPPORT_BROWSE_MEDIA,
} from "../../data/media-player";
import "../../layouts/ha-app-layout";
import { haStyle } from "../../resources/styles";
import type { OpenPeerPower } from "../../types";
import { showWebBrowserPlayMediaDialog } from "./show-media-player-dialog";
import { showSelectMediaPlayerDialog } from "./show-select-media-source-dialog";

@customElement("ha-panel-media-browser")
class PanelMediaBrowser extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ type: Boolean, reflect: true })
  public narrow!: boolean;

  // @ts-ignore
  @LocalStorage("mediaBrowseEntityId", true)
  private _entityId = BROWSER_PLAYER;

  protected render(): TemplateResult {
    const stateObj = this._entityId
      ? this.opp.states[this._entityId]
      : undefined;

    const title =
      this._entityId === BROWSER_PLAYER
        ? `${this.opp.localize("ui.components.media-browser.web-browser")}`
        : stateObj?.attributes.friendly_name
        ? `${stateObj?.attributes.friendly_name}`
        : undefined;

    return html`
      <ha-app-layout>
        <app-header fixed slot="header">
          <app-toolbar>
            <ha-menu-button
              .opp=${this.opp}
              .narrow=${this.narrow}
            ></ha-menu-button>
            <div main-title class="heading">
              <div>
                ${this.opp.localize(
                  "ui.components.media-browser.media-player-browser"
                )}
              </div>
              <div class="secondary-text">${title || ""}</div>
            </div>
            <mwc-button @click=${this._showSelectMediaPlayerDialog}>
              ${this.opp.localize("ui.components.media-browser.choose_player")}
            </mwc-button>
          </app-toolbar>
        </app-header>
        <div class="content">
          <ha-media-player-browse
            .opp=${this.opp}
            .entityId=${this._entityId}
            @media-picked=${this._mediaPicked}
          ></ha-media-player-browse>
        </div>
      </ha-app-layout>
    `;
  }

  private _showSelectMediaPlayerDialog(): void {
    showSelectMediaPlayerDialog(this, {
      mediaSources: this._mediaPlayerEntities,
      sourceSelectedCallback: (entityId) => {
        this._entityId = entityId;
      },
    });
  }

  private async _mediaPicked(
    ev: OPPDomEvent<MediaPickedEvent>
  ): Promise<void> {
    const item = ev.detail.item;
    if (this._entityId === BROWSER_PLAYER) {
      const resolvedUrl: any = await this.opp.callWS({
        type: "media_source/resolve_media",
        media_content_id: item.media_content_id,
      });

      showWebBrowserPlayMediaDialog(this, {
        sourceUrl: resolvedUrl.url,
        sourceType: resolvedUrl.mime_type,
        title: item.title,
      });
      return;
    }

    this.opp!.callService("media_player", "play_media", {
      entity_id: this._entityId,
      media_content_id: item.media_content_id,
      media_content_type: item.media_content_type,
    });
  }

  private get _mediaPlayerEntities() {
    return Object.values(this.opp!.states).filter((entity) => {
      if (
        computeStateDomain(entity) === "media_player" &&
        supportsFeature(entity, SUPPORT_BROWSE_MEDIA)
      ) {
        return true;
      }

      return false;
    });
  }

  static get styles(): CSSResultArray {
    return [
      haStyle,
      css`
        :host {
          --mdc-theme-primary: var(--app-header-text-color);
        }
        ha-media-player-browse {
          height: calc(100vh - var(--header-height));
        }
        :host([narrow]) app-toolbar mwc-button {
          width: 65px;
        }
        .heading {
          overflow: hidden;
          white-space: nowrap;
          margin-top: 4px;
        }
        .heading .secondary-text {
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-panel-media-browser": PanelMediaBrowser;
  }
}
