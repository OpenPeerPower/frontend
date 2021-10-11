import type { OppEntity } from "openpeerpower-js-websocket";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { customElement, property, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { computeCloseIcon, computeOpenIcon } from "../common/entity/cover_icon";
import { UNAVAILABLE } from "../data/entity";
import type { OpenPeerPower } from "../types";
import CoverEntity from "../util/cover-model";
import "./op-icon-button";

@customElement("op-cover-controls")
class HaCoverControls extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property({ attribute: false }) public stateObj!: OppEntity;

  @state() private _entityObj?: CoverEntity;

  public willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has("stateObj")) {
      this._entityObj = new CoverEntity(this.opp, this.stateObj);
    }
  }

  protected render(): TemplateResult {
    if (!this._entityObj) {
      return html``;
    }

    return html`
      <div class="state">
        <op-icon-button
          class=${classMap({
            hidden: !this._entityObj.supportsOpen,
          })}
          .label=${this.opp.localize(
            "ui.dialogs.more_info_control.open_cover"
          )}
          .icon=${computeOpenIcon(this.stateObj)}
          @click=${this._onOpenTap}
          .disabled=${this._computeOpenDisabled()}
        ></op-icon-button>
        <op-icon-button
          class=${classMap({
            hidden: !this._entityObj.supportsStop,
          })}
          .label=${this.opp.localize(
            "ui.dialogs.more_info_control.stop_cover"
          )}
          icon="opp:stop"
          @click=${this._onStopTap}
          .disabled=${this.stateObj.state === UNAVAILABLE}
        ></op-icon-button>
        <op-icon-button
          class=${classMap({
            hidden: !this._entityObj.supportsClose,
          })}
          .label=${this.opp.localize(
            "ui.dialogs.more_info_control.close_cover"
          )}
          .icon=${computeCloseIcon(this.stateObj)}
          @click=${this._onCloseTap}
          .disabled=${this._computeClosedDisabled()}
        ></op-icon-button>
      </div>
    `;
  }

  private _computeOpenDisabled(): boolean {
    if (this.stateObj.state === UNAVAILABLE) {
      return true;
    }
    const assumedState = this.stateObj.attributes.assumed_state === true;
    return (
      (this._entityObj.isFullyOpen || this._entityObj.isOpening) &&
      !assumedState
    );
  }

  private _computeClosedDisabled(): boolean {
    if (this.stateObj.state === UNAVAILABLE) {
      return true;
    }
    const assumedState = this.stateObj.attributes.assumed_state === true;
    return (
      (this._entityObj.isFullyClosed || this._entityObj.isClosing) &&
      !assumedState
    );
  }

  private _onOpenTap(ev): void {
    ev.stopPropagation();
    this._entityObj.openCover();
  }

  private _onCloseTap(ev): void {
    ev.stopPropagation();
    this._entityObj.closeCover();
  }

  private _onStopTap(ev): void {
    ev.stopPropagation();
    this._entityObj.stopCover();
  }

  static get styles(): CSSResultGroup {
    return css`
      .state {
        white-space: nowrap;
      }
      .hidden {
        visibility: hidden !important;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-cover-controls": HaCoverControls;
  }
}
