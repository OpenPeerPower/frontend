import "@material/mwc-button/mwc-button";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators";
import { fireEvent } from "../../../../src/common/dom/fire_event";
import "../../../../src/components/op-circular-progress";
import "../../../../src/components/op-dialog";
import "../../../../src/components/op-settings-row";
import "../../../../src/components/op-svg-icon";
import "../../../../src/components/op-switch";
import {
  extractApiErrorMessage,
  ignoreSupervisorError,
} from "../../../../src/data/oppio/common";
import { createOppioPartialSnapshot } from "../../../../src/data/oppio/snapshot";
import { haStyle, haStyleDialog } from "../../../../src/resources/styles";
import type { OpenPeerPower } from "../../../../src/types";
import { SupervisorDialogSupervisorUpdateParams } from "./show-dialog-update";

@customElement("dialog-supervisor-update")
class DialogSupervisorUpdate extends LitElement {
  public opp!: OpenPeerPower;

  @state() private _opened = false;

  @state() private _createSnapshot = true;

  @state() private _action: "snapshot" | "update" | null = null;

  @state() private _error?: string;

  @state()
  private _dialogParams?: SupervisorDialogSupervisorUpdateParams;

  public async showDialog(
    params: SupervisorDialogSupervisorUpdateParams
  ): Promise<void> {
    this._opened = true;
    this._dialogParams = params;
    await this.updateComplete;
  }

  public closeDialog(): void {
    this._action = null;
    this._createSnapshot = true;
    this._error = undefined;
    this._dialogParams = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  public focus(): void {
    this.updateComplete.then(() =>
      (
        this.shadowRoot?.querySelector("[dialogInitialFocus]") as HTMLElement
      )?.focus()
    );
  }

  protected render(): TemplateResult {
    if (!this._dialogParams) {
      return html``;
    }
    return html`
      <op-dialog .open=${this._opened} scrimClickAction escapeKeyAction>
        ${this._action === null
          ? html`<slot name="heading">
                <h2 id="title" class="header_title">
                  ${this._dialogParams.supervisor.localize(
                    "confirm.update.title",
                    "name",
                    this._dialogParams.name
                  )}
                </h2>
              </slot>
              <div>
                ${this._dialogParams.supervisor.localize(
                  "confirm.update.text",
                  "name",
                  this._dialogParams.name,
                  "version",
                  this._dialogParams.version
                )}
              </div>

              <op-settings-row>
                <span slot="heading">
                  ${this._dialogParams.supervisor.localize(
                    "dialog.update.snapshot"
                  )}
                </span>
                <span slot="description">
                  ${this._dialogParams.supervisor.localize(
                    "dialog.update.create_snapshot",
                    "name",
                    this._dialogParams.name
                  )}
                </span>
                <op-switch
                  .checked=${this._createSnapshot}
                  haptic
                  @click=${this._toggleSnapshot}
                >
                </op-switch>
              </op-settings-row>
              <mwc-button @click=${this.closeDialog} slot="secondaryAction">
                ${this._dialogParams.supervisor.localize("common.cancel")}
              </mwc-button>
              <mwc-button
                .disabled=${this._error !== undefined}
                @click=${this._update}
                slot="primaryAction"
              >
                ${this._dialogParams.supervisor.localize("common.update")}
              </mwc-button>`
          : html`<op-circular-progress alt="Updating" size="large" active>
              </op-circular-progress>
              <p class="progress-text">
                ${this._action === "update"
                  ? this._dialogParams.supervisor.localize(
                      "dialog.update.updating",
                      "name",
                      this._dialogParams.name,
                      "version",
                      this._dialogParams.version
                    )
                  : this._dialogParams.supervisor.localize(
                      "dialog.update.snapshotting",
                      "name",
                      this._dialogParams.name
                    )}
              </p>`}
        ${this._error ? html`<p class="error">${this._error}</p>` : ""}
      </op-dialog>
    `;
  }

  private _toggleSnapshot() {
    this._createSnapshot = !this._createSnapshot;
  }

  private async _update() {
    if (this._createSnapshot) {
      this._action = "snapshot";
      try {
        await createOppioPartialSnapshot(
          this.opp,
          this._dialogParams!.snapshotParams
        );
      } catch (err) {
        this._error = extractApiErrorMessage(err);
        this._action = null;
        return;
      }
    }

    this._action = "update";
    try {
      await this._dialogParams!.updateHandler!();
    } catch (err) {
      if (this.opp.connection.connected && !ignoreSupervisorError(err)) {
        this._error = extractApiErrorMessage(err);
        this._action = null;
      }
      return;
    }

    this.closeDialog();
  }

  static get styles(): CSSResultGroup {
    return [
      haStyle,
      haStyleDialog,
      css`
        .form {
          color: var(--primary-text-color);
        }

        op-settings-row {
          margin-top: 32px;
          padding: 0;
        }

        op-circular-progress {
          display: block;
          margin: 32px;
          text-align: center;
        }

        .progress-text {
          text-align: center;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-supervisor-update": DialogSupervisorUpdate;
  }
}
