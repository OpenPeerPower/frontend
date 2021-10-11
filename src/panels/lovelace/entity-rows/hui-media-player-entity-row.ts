import { OppEntity } from "openpeerpower-js-websocket";
import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { computeStateDisplay } from "../../../common/entity/compute_state_display";
import { supportsFeature } from "../../../common/entity/supports-feature";
import { computeRTLDirection } from "../../../common/util/compute_rtl";
import { debounce } from "../../../common/util/debounce";
import "../../../components/op-icon-button";
import "../../../components/op-slider";
import { UNAVAILABLE, UNAVAILABLE_STATES, UNKNOWN } from "../../../data/entity";
import {
  computeMediaDescription,
  MediaPlayerEntity,
  SUPPORT_NEXT_TRACK,
  SUPPORT_PAUSE,
  SUPPORT_PLAY,
  SUPPORT_PREVIOUS_TRACK,
  SUPPORT_STOP,
  SUPPORT_TURN_OFF,
  SUPPORT_TURN_ON,
  SUPPORT_VOLUME_BUTTONS,
  SUPPORT_VOLUME_MUTE,
  SUPPORT_VOLUME_SET,
} from "../../../data/media-player";
import type { OpenPeerPower } from "../../../types";
import { hasConfigOrEntityChanged } from "../common/has-changed";
import { installResizeObserver } from "../common/install-resize-observer";
import "../components/hui-generic-entity-row";
import { createEntityNotFoundWarning } from "../components/hui-warning";
import type { EntityConfig, LovelaceRow } from "./types";

@customElement("hui-media-player-entity-row")
class HuiMediaPlayerEntityRow extends LitElement implements LovelaceRow {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @internalProperty() private _config?: EntityConfig;

  @internalProperty() private _narrow?: boolean = false;

  @internalProperty() private _veryNarrow?: boolean = false;

  private _resizeObserver?: ResizeObserver;

  public setConfig(config: EntityConfig): void {
    if (!config || !config.entity) {
      throw new Error("Entity must be specified");
    }

    this._config = config;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._attachObserver();
  }

  public disconnectedCallback(): void {
    this._resizeObserver?.unobserve(this);
  }

  protected firstUpdated(): void {
    this._measureCard();
    this._attachObserver();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._config) {
      return html``;
    }

    const stateObj = this.opp.states[this._config.entity] as MediaPlayerEntity;

    if (!stateObj) {
      return html`
        <hui-warning>
          ${createEntityNotFoundWarning(this.opp, this._config.entity)}
        </hui-warning>
      `;
    }

    const state = stateObj.state;

    const buttons = html`
      ${!this._narrow &&
      state === "playing" &&
      supportsFeature(stateObj, SUPPORT_PREVIOUS_TRACK)
        ? html`
            <op-icon-button
              icon="opp:skip-previous"
              @click=${this._previousTrack}
            ></op-icon-button>
          `
        : ""}
      ${(state === "playing" &&
        (supportsFeature(stateObj, SUPPORT_PAUSE) ||
          supportsFeature(stateObj, SUPPORT_STOP))) ||
      ((state === "paused" || state === "idle") &&
        supportsFeature(stateObj, SUPPORT_PLAY)) ||
      (state === "on" &&
        (supportsFeature(stateObj, SUPPORT_PLAY) ||
          supportsFeature(stateObj, SUPPORT_PAUSE)))
        ? html`
            <op-icon-button
              icon=${this._computeControlIcon(stateObj)}
              @click=${this._playPauseStop}
            ></op-icon-button>
          `
        : ""}
      ${state === "playing" && supportsFeature(stateObj, SUPPORT_NEXT_TRACK)
        ? html`
            <op-icon-button
              icon="opp:skip-next"
              @click=${this._nextTrack}
            ></op-icon-button>
          `
        : ""}
    `;

    const mediaDescription = computeMediaDescription(stateObj);

    return html`
      <hui-generic-entity-row
        .opp=${this.opp}
        .config=${this._config}
        .secondaryText=${mediaDescription ||
        computeStateDisplay(this.opp.localize, stateObj, this.opp.locale)}
      >
        <div class="controls">
          ${supportsFeature(stateObj, SUPPORT_TURN_ON) &&
          state === "off" &&
          !UNAVAILABLE_STATES.includes(state)
            ? html`
                <op-icon-button
                  icon="opp:power"
                  @click=${this._togglePower}
                ></op-icon-button>
              `
            : !supportsFeature(stateObj, SUPPORT_VOLUME_SET) &&
              !supportsFeature(stateObj, SUPPORT_VOLUME_BUTTONS)
            ? buttons
            : ""}
          ${supportsFeature(stateObj, SUPPORT_TURN_OFF) &&
          state !== "off" &&
          !UNAVAILABLE_STATES.includes(state)
            ? html`
                <op-icon-button
                  icon="opp:power"
                  @click=${this._togglePower}
                ></op-icon-button>
              `
            : ""}
        </div>
      </hui-generic-entity-row>
      ${(supportsFeature(stateObj, SUPPORT_VOLUME_SET) ||
        supportsFeature(stateObj, SUPPORT_VOLUME_BUTTONS)) &&
      ![UNAVAILABLE, UNKNOWN, "off"].includes(state)
        ? html`
            <div class="flex">
              <div class="volume">
                ${supportsFeature(stateObj, SUPPORT_VOLUME_MUTE)
                  ? html`
                      <op-icon-button
                        .icon=${stateObj.attributes.is_volume_muted
                          ? "opp:volume-off"
                          : "opp:volume-high"}
                        @click=${this._toggleMute}
                      ></op-icon-button>
                    `
                  : ""}
                ${!this._veryNarrow &&
                supportsFeature(stateObj, SUPPORT_VOLUME_SET)
                  ? html`
                      <op-slider
                        .dir=${computeRTLDirection(this.opp!)}
                        .value=${Number(stateObj.attributes.volume_level) * 100}
                        pin
                        @change=${this._selectedValueChanged}
                        ignore-bar-touch
                        id="input"
                      ></op-slider>
                    `
                  : !this._veryNarrow &&
                    supportsFeature(stateObj, SUPPORT_VOLUME_BUTTONS)
                  ? html`
                      <op-icon-button
                        icon="opp:volume-minus"
                        @click=${this._volumeDown}
                      ></op-icon-button>
                      <op-icon-button
                        icon="opp:volume-plus"
                        @click=${this._volumeUp}
                      ></op-icon-button>
                    `
                  : ""}
              </div>

              <div class="controls">${buttons}</div>
            </div>
          `
        : ""}
    `;
  }

  private async _attachObserver(): Promise<void> {
    if (!this._resizeObserver) {
      await installResizeObserver();
      this._resizeObserver = new ResizeObserver(
        debounce(() => this._measureCard(), 250, false)
      );
    }
    this._resizeObserver.observe(this);
  }

  private _measureCard() {
    if (!this.isConnected) {
      return;
    }
    this._narrow = (this.clientWidth || 0) < 300;
    this._veryNarrow = (this.clientWidth || 0) < 225;
  }

  private _computeControlIcon(stateObj: OppEntity): string {
    return stateObj.state === "on"
      ? "opp:play-pause"
      : stateObj.state !== "playing"
      ? "opp:play"
      : supportsFeature(stateObj, SUPPORT_PAUSE)
      ? "opp:pause"
      : "opp:stop";
  }

  private _togglePower(): void {
    const stateObj = this.opp!.states[this._config!.entity];

    this.opp!.callService(
      "media_player",
      stateObj.state === "off" ? "turn_on" : "turn_off",
      {
        entity_id: this._config!.entity,
      }
    );
  }

  private _playPauseStop(): void {
    const stateObj = this.opp!.states[this._config!.entity];

    const service =
      stateObj.state !== "playing"
        ? "media_play"
        : supportsFeature(stateObj, SUPPORT_PAUSE)
        ? "media_pause"
        : "media_stop";

    this.opp!.callService("media_player", service, {
      entity_id: this._config!.entity,
    });
  }

  private _previousTrack(): void {
    this.opp!.callService("media_player", "media_previous_track", {
      entity_id: this._config!.entity,
    });
  }

  private _nextTrack(): void {
    this.opp!.callService("media_player", "media_next_track", {
      entity_id: this._config!.entity,
    });
  }

  private _toggleMute() {
    this.opp!.callService("media_player", "volume_mute", {
      entity_id: this._config!.entity,
      is_volume_muted:
        !this.opp!.states[this._config!.entity].attributes.is_volume_muted,
    });
  }

  private _volumeDown() {
    this.opp!.callService("media_player", "volume_down", {
      entity_id: this._config!.entity,
    });
  }

  private _volumeUp() {
    this.opp!.callService("media_player", "volume_up", {
      entity_id: this._config!.entity,
    });
  }

  private _selectedValueChanged(ev): void {
    this.opp!.callService("media_player", "volume_set", {
      entity_id: this._config!.entity,
      volume_level: ev.target.value / 100,
    });
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
      }
      .flex {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .volume {
        display: flex;
        flex-grow: 2;
        flex-shrink: 2;
      }
      .controls {
        white-space: nowrap;
      }
      op-slider {
        flex-grow: 2;
        flex-shrink: 2;
        width: 100%;
        margin: 0 -8px 0 1px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-media-player-entity-row": HuiMediaPlayerEntityRow;
  }
}
