import "@material/mwc-button";
import "@polymer/paper-input/paper-input";
import {
  css,
  CSSResult,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import memoizeOne from "memoize-one";
import { computeRTLDirection } from "../../../common/util/compute_rtl";
import "../../../components/entity/ha-entities-picker";
import { createCloseHeading } from "../../../components/ha-dialog";
import "../../../components/ha-formfield";
import "../../../components/ha-picture-upload";
import type { HaPictureUpload } from "../../../components/ha-picture-upload";
import { adminChangePassword } from "../../../data/auth";
import { PersonMutableParams } from "../../../data/person";
import {
  deleteUser,
  SYSTEM_GROUP_ID_ADMIN,
  SYSTEM_GROUP_ID_USER,
  updateUser,
  User,
} from "../../../data/user";
import {
  showAlertDialog,
  showConfirmationDialog,
  showPromptDialog,
} from "../../../dialogs/generic/show-dialog-box";
import { CropOptions } from "../../../dialogs/image-cropper-dialog/show-image-cropper-dialog";
import { PolymerChangedEvent } from "../../../polymer-types";
import { haStyleDialog } from "../../../resources/styles";
import { OpenPeerPower } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { showAddUserDialog } from "../users/show-dialog-add-user";
import { PersonDetailDialogParams } from "./show-dialog-person-detail";

const includeDomains = ["device_tracker"];

const cropOptions: CropOptions = {
  round: true,
  type: "image/jpeg",
  quality: 0.75,
  aspectRatio: 1,
};

class DialogPersonDetail extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _name!: string;

  @internalProperty() private _userId?: string;

  @internalProperty() private _user?: User;

  @internalProperty() private _isAdmin?: boolean;

  @internalProperty() private _deviceTrackers!: string[];

  @internalProperty() private _picture!: string | null;

  @internalProperty() private _error?: string;

  @internalProperty() private _params?: PersonDetailDialogParams;

  @internalProperty() private _submitting = false;

  @internalProperty() private _personExists = false;

  private _deviceTrackersAvailable = memoizeOne((opp) => {
    return Object.keys(opp.states).some(
      (entityId) =>
        entityId.substr(0, entityId.indexOf(".")) === "device_tracker"
    );
  });

  public async showDialog(params: PersonDetailDialogParams): Promise<void> {
    this._params = params;
    this._error = undefined;
    if (this._params.entry) {
      this._personExists = true;
      this._name = this._params.entry.name || "";
      this._userId = this._params.entry.user_id || undefined;
      this._deviceTrackers = this._params.entry.device_trackers || [];
      this._picture = this._params.entry.picture || null;
      this._user = this._userId
        ? this._params.users.find((user) => user.id === this._userId)
        : undefined;
      this._isAdmin = this._user?.group_ids.includes(SYSTEM_GROUP_ID_ADMIN);
    } else {
      this._personExists = false;
      this._name = "";
      this._userId = undefined;
      this._user = undefined;
      this._isAdmin = undefined;
      this._deviceTrackers = [];
      this._picture = null;
    }
    await this.updateComplete;
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    const nameInvalid = this._name.trim() === "";
    return html`
      <ha-dialog
        open
        @closed=${this._close}
        scrimClickAction
        escapeKeyAction
        .heading=${createCloseHeading(
          this.opp,
          this._params.entry
            ? this._params.entry.name
            : this.opp!.localize("ui.panel.config.person.detail.new_person")
        )}
      >
        <div>
          ${this._error ? html` <div class="error">${this._error}</div> ` : ""}
          <div class="form">
            <paper-input
              dialogInitialFocus
              .value=${this._name}
              @value-changed=${this._nameChanged}
              label="${this.opp!.localize(
                "ui.panel.config.person.detail.name"
              )}"
              error-message="${this.opp!.localize(
                "ui.panel.config.person.detail.name_error_msg"
              )}"
              required
              auto-validate
            ></paper-input>
            <ha-picture-upload
              .opp=${this.opp}
              .value=${this._picture}
              crop
              .cropOptions=${cropOptions}
              @change=${this._pictureChanged}
            ></ha-picture-upload>

            <ha-formfield
              .label=${this.opp!.localize(
                "ui.panel.config.person.detail.allow_login"
              )}
            >
              <ha-switch
                @change=${this._allowLoginChanged}
                .disabled=${this._user &&
                (this._user.id === this.opp.user?.id ||
                  this._user.system_generated ||
                  this._user.is_owner)}
                .checked=${this._userId}
              ></ha-switch>
            </ha-formfield>

            ${this._user
              ? html`<ha-formfield
                  .label=${this.opp.localize(
                    "ui.panel.config.person.detail.admin"
                  )}
                  .dir=${computeRTLDirection(this.opp)}
                >
                  <ha-switch
                    .disabled=${this._user.system_generated ||
                    this._user.is_owner}
                    .checked=${this._isAdmin}
                    @change=${this._adminChanged}
                  >
                  </ha-switch>
                </ha-formfield>`
              : ""}
            ${this._deviceTrackersAvailable(this.opp)
              ? html`
                  <p>
                    ${this.opp.localize(
                      "ui.panel.config.person.detail.device_tracker_intro"
                    )}
                  </p>
                  <ha-entities-picker
                    .opp=${this.opp}
                    .value=${this._deviceTrackers}
                    .includeDomains=${includeDomains}
                    .pickedEntityLabel=${this.opp.localize(
                      "ui.panel.config.person.detail.device_tracker_picked"
                    )}
                    .pickEntityLabel=${this.opp.localize(
                      "ui.panel.config.person.detail.device_tracker_pick"
                    )}
                    @value-changed=${this._deviceTrackersChanged}
                  >
                  </ha-entities-picker>
                `
              : html`
                  <p>
                    ${this.opp!.localize(
                      "ui.panel.config.person.detail.no_device_tracker_available_intro"
                    )}
                  </p>
                  <ul>
                    <li>
                      <a
                        href="${documentationUrl(
                          this.opp,
                          "/integrations/#presence-detection"
                        )}"
                        target="_blank"
                        rel="noreferrer"
                        >${this.opp!.localize(
                          "ui.panel.config.person.detail.link_presence_detection_integrations"
                        )}</a
                      >
                    </li>
                    <li>
                      <a
                        @click="${this._closeDialog}"
                        href="/config/integrations"
                      >
                        ${this.opp!.localize(
                          "ui.panel.config.person.detail.link_integrations_page"
                        )}</a
                      >
                    </li>
                  </ul>
                `}
          </div>
        </div>
        ${this._params.entry
          ? html`
              <mwc-button
                slot="secondaryAction"
                class="warning"
                @click="${this._deleteEntry}"
                .disabled=${(this._user && this._user.is_owner) ||
                this._submitting}
              >
                ${this.opp!.localize("ui.panel.config.person.detail.delete")}
              </mwc-button>
              ${this._user && this.opp.user?.is_owner
                ? html`<mwc-button
                    slot="secondaryAction"
                    @click=${this._changePassword}
                  >
                    ${this.opp.localize(
                      "ui.panel.config.users.editor.change_password"
                    )}
                  </mwc-button>`
                : ""}
            `
          : html``}
        <mwc-button
          slot="primaryAction"
          @click="${this._updateEntry}"
          .disabled=${nameInvalid || this._submitting}
        >
          ${this._params.entry
            ? this.opp!.localize("ui.panel.config.person.detail.update")
            : this.opp!.localize("ui.panel.config.person.detail.create")}
        </mwc-button>
      </ha-dialog>
    `;
  }

  private _closeDialog() {
    this._params = undefined;
  }

  private _nameChanged(ev: PolymerChangedEvent<string>) {
    this._error = undefined;
    this._name = ev.detail.value;
  }

  private async _adminChanged(ev): Promise<void> {
    this._isAdmin = ev.target.checked;
  }

  private async _allowLoginChanged(ev): Promise<void> {
    const target = ev.target;
    if (target.checked) {
      target.checked = false;
      showAddUserDialog(this, {
        userAddedCallback: async (user?: User) => {
          if (user) {
            target.checked = true;
            this._user = user;
            this._userId = user.id;
            this._isAdmin = user.group_ids.includes(SYSTEM_GROUP_ID_ADMIN);
            this._params?.refreshUsers();
          }
        },
        name: this._name,
      });
    } else if (this._userId) {
      if (
        !(await showConfirmationDialog(this, {
          text: this.opp!.localize(
            "ui.panel.config.person.detail.confirm_delete_user",
            "name",
            this._name
          ),
          confirmText: this.opp!.localize(
            "ui.panel.config.person.detail.delete"
          ),
          dismissText: this.opp!.localize("ui.common.cancel"),
        }))
      ) {
        target.checked = true;
        return;
      }
      await deleteUser(this.opp, this._userId);
      this._params?.refreshUsers();
      this._userId = undefined;
    }
  }

  private _deviceTrackersChanged(ev: PolymerChangedEvent<string[]>) {
    this._error = undefined;
    this._deviceTrackers = ev.detail.value;
  }

  private _pictureChanged(ev: PolymerChangedEvent<string | null>) {
    this._error = undefined;
    this._picture = (ev.target as HaPictureUpload).value;
  }

  private async _changePassword() {
    if (!this._user) {
      return;
    }
    const credential = this._user.credentials.find(
      (cred) => cred.type === "openpeerpower"
    );
    if (!credential) {
      showAlertDialog(this, {
        title: "No Open Peer Power credentials found.",
      });
      return;
    }
    const newPassword = await showPromptDialog(this, {
      title: this.opp.localize("ui.panel.config.users.editor.change_password"),
      inputType: "password",
      inputLabel: this.opp.localize(
        "ui.panel.config.users.editor.new_password"
      ),
    });
    if (!newPassword) {
      return;
    }
    const confirmPassword = await showPromptDialog(this, {
      title: this.opp.localize("ui.panel.config.users.editor.change_password"),
      inputType: "password",
      inputLabel: this.opp.localize(
        "ui.panel.config.users.add_user.password_confirm"
      ),
    });
    if (!confirmPassword) {
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlertDialog(this, {
        title: this.opp.localize(
          "ui.panel.config.users.add_user.password_not_match"
        ),
      });
      return;
    }
    await adminChangePassword(this.opp, this._user.id, newPassword);
    showAlertDialog(this, {
      title: this.opp.localize(
        "ui.panel.config.users.editor.password_changed"
      ),
    });
  }

  private async _updateEntry() {
    this._submitting = true;
    try {
      if (
        (this._userId && this._name !== this._params!.entry?.name) ||
        this._isAdmin !== this._user?.group_ids.includes(SYSTEM_GROUP_ID_ADMIN)
      ) {
        await updateUser(this.opp!, this._userId!, {
          name: this._name.trim(),
          group_ids: [
            this._isAdmin ? SYSTEM_GROUP_ID_ADMIN : SYSTEM_GROUP_ID_USER,
          ],
        });
        this._params?.refreshUsers();
      }
      const values: PersonMutableParams = {
        name: this._name.trim(),
        device_trackers: this._deviceTrackers,
        user_id: this._userId || null,
        picture: this._picture,
      };
      if (this._params!.entry) {
        await this._params!.updateEntry(values);
      } else {
        await this._params!.createEntry(values);
        this._personExists = true;
      }
      this._params = undefined;
    } catch (err) {
      this._error = err ? err.message : "Unknown error";
    } finally {
      this._submitting = false;
    }
  }

  private async _deleteEntry() {
    this._submitting = true;
    try {
      if (await this._params!.removeEntry()) {
        if (this._params!.entry!.user_id) {
          deleteUser(this.opp, this._params!.entry!.user_id);
        }
        this._params = undefined;
      }
    } finally {
      this._submitting = false;
    }
  }

  private _close(): void {
    // If we do not have a person ID yet (= person creation dialog was just cancelled), but
    // we already created a user ID for it, delete it now to not have it "free floating".
    if (!this._personExists && this._userId) {
      deleteUser(this.opp, this._userId);
      this._params?.refreshUsers();
      this._userId = undefined;
    }

    this._params = undefined;
  }

  static get styles(): CSSResult[] {
    return [
      haStyleDialog,
      css`
        .form {
          padding-bottom: 24px;
        }
        ha-picture-upload {
          display: block;
        }
        ha-formfield {
          display: block;
          padding: 16px 0;
        }
        a {
          color: var(--primary-color);
        }
        p {
          color: var(--primary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-person-detail": DialogPersonDetail;
  }
}

customElements.define("dialog-person-detail", DialogPersonDetail);
