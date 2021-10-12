import { mdiPlus } from "@mdi/js";
import "@polymer/paper-item/paper-icon-item";
import "@polymer/paper-item/paper-item-body";
import {
  css,
  CSSResult,
  html,
  internalProperty,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { compare } from "../../../common/string/compare";
import "../../../components/op-card";
import "../../../components/op-fab";
import "../../../components/op-svg-icon";
import "../../../components/user/ha-person-badge";
import {
  createPerson,
  deletePerson,
  fetchPersons,
  Person,
  updatePerson,
} from "../../../data/person";
import { fetchUsers, User } from "../../../data/user";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-loading-screen";
import "../../../layouts/opp-tabs-subpage";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import "../ha-config-section";
import { configSections } from "../ha-panel-config";
import {
  loadPersonDetailDialog,
  showPersonDetailDialog,
} from "./show-dialog-person-detail";

class HaConfigPerson extends LitElement {
  @property({ attribute: false }) public opp?: OpenPeerPower;

  @property() public isWide?: boolean;

  @property() public narrow?: boolean;

  @property() public route!: Route;

  @internalProperty() private _storageItems?: Person[];

  @internalProperty() private _configItems?: Person[];

  private _usersLoad?: Promise<User[]>;

  protected render(): TemplateResult {
    if (
      !this.opp ||
      this._storageItems === undefined ||
      this._configItems === undefined
    ) {
      return html` <opp-loading-screen></opp-loading-screen> `;
    }
    const opp = this.opp;
    return html`
      <opp-tabs-subpage
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        back-path="/config"
        .tabs=${configSections.persons}
      >
        <op-config-section .isWide=${this.isWide}>
          <span slot="header"
            >${opp.localize("ui.panel.config.person.caption")}</span
          >
          <span slot="introduction">
            <p>${opp.localize("ui.panel.config.person.introduction")}</p>
            ${this._configItems.length > 0
              ? html`
                  <p>
                    ${opp.localize(
                      "ui.panel.config.person.note_about_persons_configured_in_yaml"
                    )}
                  </p>
                `
              : ""}

            <a
              href=${documentationUrl(this.opp, "/integrations/person/")}
              target="_blank"
              rel="noreferrer"
            >
              ${this.opp.localize("ui.panel.config.person.learn_more")}
            </a>
          </span>

          <op-card class="storage">
            ${this._storageItems.map((entry) => {
              return html`
                <paper-icon-item @click=${this._openEditEntry} .entry=${entry}>
                  <op-person-badge
                    slot="item-icon"
                    .person=${entry}
                  ></op-person-badge>
                  <paper-item-body> ${entry.name} </paper-item-body>
                </paper-icon-item>
              `;
            })}
            ${this._storageItems.length === 0
              ? html`
                  <div class="empty">
                    ${opp.localize(
                      "ui.panel.config.person.no_persons_created_yet"
                    )}
                    <mwc-button @click=${this._createPerson}>
                      ${opp.localize(
                        "ui.panel.config.person.create_person"
                      )}</mwc-button
                    >
                  </div>
                `
              : html``}
          </op-card>
          ${this._configItems.length > 0
            ? html`
                <op-card header="Configuration.yaml persons">
                  ${this._configItems.map((entry) => {
                    return html`
                      <paper-icon-item>
                        <op-person-badge
                          slot="item-icon"
                          .person=${entry}
                        ></op-person-badge>
                        <paper-item-body> ${entry.name} </paper-item-body>
                      </paper-icon-item>
                    `;
                  })}
                </op-card>
              `
            : ""}
        </op-config-section>
        <op-fab
          slot="fab"
          .label=${opp.localize("ui.panel.config.person.add_person")}
          extended
          @click=${this._createPerson}
        >
          <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage>
    `;
  }

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    this._fetchData();
    loadPersonDetailDialog();
  }

  private async _fetchData() {
    this._usersLoad = fetchUsers(this.opp!);
    const personData = await fetchPersons(this.opp!);

    this._storageItems = personData.storage.sort((ent1, ent2) =>
      compare(ent1.name, ent2.name)
    );
    this._configItems = personData.config.sort((ent1, ent2) =>
      compare(ent1.name, ent2.name)
    );
    this._openDialogIfPersonSpecifiedInRoute();
  }

  private _openDialogIfPersonSpecifiedInRoute() {
    if (!this.route.path.includes("/edit/")) {
      return;
    }

    const routeSegments = this.route.path.split("/edit/");
    const personId = routeSegments.length > 1 ? routeSegments[1] : null;
    if (!personId) {
      return;
    }

    const personToEdit = this._storageItems!.find((p) => p.id === personId);
    if (personToEdit) {
      this._openDialog(personToEdit);
    } else {
      showAlertDialog(this, {
        title: this.opp?.localize(
          "ui.panel.config.person.person_not_found_title"
        ),
        text: this.opp?.localize("ui.panel.config.person.person_not_found"),
      });
    }
  }

  private _createPerson() {
    this._openDialog();
  }

  private _openEditEntry(ev: MouseEvent) {
    const entry: Person = (ev.currentTarget! as any).entry;
    this._openDialog(entry);
  }

  private _allowedUsers(users: User[], currentPerson?: Person) {
    const used = new Set();
    for (const coll of [this._configItems, this._storageItems]) {
      for (const pers of coll!) {
        if (pers.user_id) {
          used.add(pers.user_id);
        }
      }
    }
    const currentUserId = currentPerson ? currentPerson.user_id : undefined;
    return users.filter(
      (user) => user.id === currentUserId || !used.has(user.id)
    );
  }

  private async _openDialog(entry?: Person) {
    const users = await this._usersLoad!;

    showPersonDetailDialog(this, {
      entry,
      users: this._allowedUsers(users, entry),
      createEntry: async (values) => {
        const created = await createPerson(this.opp!, values);
        this._storageItems = this._storageItems!.concat(created).sort(
          (ent1, ent2) => compare(ent1.name, ent2.name)
        );
      },
      updateEntry: async (values) => {
        const updated = await updatePerson(this.opp!, entry!.id, values);
        this._storageItems = this._storageItems!.map((ent) =>
          ent === entry ? updated : ent
        );
      },
      removeEntry: async () => {
        if (
          !(await showConfirmationDialog(this, {
            title: this.opp!.localize("ui.panel.config.person.confirm_delete"),
            text: this.opp!.localize("ui.panel.config.person.confirm_delete2"),
            dismissText: this.opp!.localize("ui.common.cancel"),
            confirmText: this.opp!.localize("ui.common.delete"),
          }))
        ) {
          return false;
        }

        try {
          await deletePerson(this.opp!, entry!.id);
          this._storageItems = this._storageItems!.filter(
            (ent) => ent !== entry
          );
          return true;
        } catch (err) {
          return false;
        }
      },
      refreshUsers: () => {
        this._usersLoad = fetchUsers(this.opp!);
      },
    });
  }

  static get styles(): CSSResult {
    return css`
      a {
        color: var(--primary-color);
      }
      op-card {
        max-width: 600px;
        margin: 16px auto;
        overflow: hidden;
      }
      .empty {
        text-align: center;
        padding: 8px;
      }
      paper-icon-item {
        padding-top: 4px;
        padding-bottom: 4px;
      }
      op-card.storage paper-icon-item {
        cursor: pointer;
      }
    `;
  }
}

customElements.define("ha-config-person", HaConfigPerson);
