import "@material/mwc-button";
import "@polymer/paper-input/paper-input";
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
import { computeRTLDirection } from "../../../common/util/compute_rtl";
import "../../../components/ha-circular-progress";
import "../../../components/ha-dialog";
import "../../../components/ha-formfield";
import "../../../components/ha-switch";
import { createAuthForUser } from "../../../data/auth";
import {
  createUser,
  deleteUser,
  SYSTEM_GROUP_ID_ADMIN,
  SYSTEM_GROUP_ID_USER,
  User,
} from "../../../data/user";
import { PolymerChangedEvent } from "../../../polymer-types";
import { haStyleDialog } from "../../../resources/styles";
import { OpenPeerPower } from "../../../types";
import { AddUserDialogParams } from "./show-dialog-add-user";

@customElement("dialog-add-user")
export class DialogAddUser extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _loading = false;

  // Error message when can't talk to server etc
  @internalProperty() private _error?: string;

  @internalProperty() private _params?: AddUserDialogParams;

  @internalProperty() private _name?: string;

  @internalProperty() private _username?: string;

  @internalProperty() private _password?: string;

  @internalProperty() private _passwordConfirm?: string;

  @internalProperty() private _isAdmin?: boolean;

  @internalProperty() private _allowChangeName = true;

  public showDialog(params: AddUserDialogParams) {
    this._params = params;
    this._name = this._params.name || "";
    this._username = "";
    this._password = "";
    this._passwordConfirm = "";
    this._isAdmin = false;
    this._error = undefined;
    this._loading = false;

    if (this._params.name) {
      this._allowChangeName = false;
      this._maybePopulateUsername();
    } else {
      this._allowChangeName = true;
    }
  }

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.addEventListener("keypress", (ev) => {
      if (ev.keyCode === 13) {
        this._createUser(ev);
      }
    });
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <op-dialog
        open
        @closing=${this._close}
        scrimClickAction
        escapeKeyAction
        .heading=${this.opp.localize("ui.panel.config.users.add_user.caption")}
      >
        <div>
          ${this._error ? html` <div class="error">${this._error}</div> ` : ""}
          ${this._allowChangeName
            ? html` <paper-input
                class="name"
                name="name"
                .label=${this.opp.localize("ui.panel.config.users.editor.name")}
                .value=${this._name}
                required
                auto-validate
                autocapitalize="on"
                .errorMessage=${this.opp.localize("ui.common.error_required")}
                @value-changed=${this._handleValueChanged}
                @blur=${this._maybePopulateUsername}
              ></paper-input>`
            : ""}
          <paper-input
            class="username"
            name="username"
            .label=${this.opp.localize("ui.panel.config.users.editor.username")}
            .value=${this._username}
            required
            auto-validate
            autocapitalize="none"
            @value-changed=${this._handleValueChanged}
            .errorMessage=${this.opp.localize("ui.common.error_required")}
          ></paper-input>

          <paper-input
            .label=${this.opp.localize(
              "ui.panel.config.users.add_user.password"
            )}
            type="password"
            name="password"
            .value=${this._password}
            required
            auto-validate
            @value-changed=${this._handleValueChanged}
            .errorMessage=${this.opp.localize("ui.common.error_required")}
          ></paper-input>

          <paper-input
            label="${this.opp.localize(
              "ui.panel.config.users.add_user.password_confirm"
            )}"
            name="passwordConfirm"
            .value=${this._passwordConfirm}
            @value-changed=${this._handleValueChanged}
            required
            type="password"
            .invalid=${this._password !== "" &&
            this._passwordConfirm !== "" &&
            this._passwordConfirm !== this._password}
            .errorMessage="${this.opp.localize(
              "ui.panel.config.users.add_user.password_not_match"
            )}"
          ></paper-input>

          <op-formfield
            .label=${this.opp.localize("ui.panel.config.users.editor.admin")}
            .dir=${computeRTLDirection(this.opp)}
          >
            <op-switch .checked=${this._isAdmin} @change=${this._adminChanged}>
            </op-switch>
          </op-formfield>
          ${!this._isAdmin
            ? html`
                <br />
                ${this.opp.localize(
                  "ui.panel.config.users.users_privileges_note"
                )}
              `
            : ""}
        </div>
        <mwc-button
          slot="secondaryAction"
          @click="${this._close}"
          .disabled=${this._loading}
        >
          ${this.opp!.localize("ui.common.cancel")}
        </mwc-button>
        ${this._loading
          ? html`
              <div slot="primaryAction" class="submit-spinner">
                <op-circular-progress active></op-circular-progress>
              </div>
            `
          : html`
              <mwc-button
                slot="primaryAction"
                .disabled=${!this._name ||
                !this._username ||
                !this._password ||
                this._password !== this._passwordConfirm}
                @click=${this._createUser}
              >
                ${this.opp.localize("ui.panel.config.users.add_user.create")}
              </mwc-button>
            `}
      </op-dialog>
    `;
  }

  private _close() {
    this._params = undefined;
  }

  private _maybePopulateUsername() {
    if (this._username || !this._name) {
      return;
    }

    const parts = this._name.split(" ");

    if (parts.length) {
      this._username = parts[0].toLowerCase();
    }
  }

  private _handleValueChanged(ev: PolymerChangedEvent<string>): void {
    this._error = undefined;
    const name = (ev.target as any).name;
    this[`_${name}`] = ev.detail.value;
  }

  private async _adminChanged(ev): Promise<void> {
    this._isAdmin = ev.target.checked;
  }

  private async _createUser(ev) {
    ev.preventDefault();
    if (!this._name || !this._username || !this._password) {
      return;
    }

    this._loading = true;
    this._error = "";

    let user: User;
    try {
      const userResponse = await createUser(this.opp, this._name, [
        this._isAdmin ? SYSTEM_GROUP_ID_ADMIN : SYSTEM_GROUP_ID_USER,
      ]);
      user = userResponse.user;
    } catch (err) {
      this._loading = false;
      this._error = err.message;
      return;
    }

    try {
      await createAuthForUser(
        this.opp,
        user.id,
        this._username,
        this._password
      );
    } catch (err) {
      await deleteUser(this.opp, user.id);
      this._loading = false;
      this._error = err.message;
      return;
    }

    user.username = this._username;
    this._params!.userAddedCallback(user);
    this._close();
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        ha-dialog {
          --mdc-dialog-max-width: 500px;
          --dialog-z-index: 10;
        }
        ha-switch {
          margin-top: 8px;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-add-user": DialogAddUser;
  }
}
