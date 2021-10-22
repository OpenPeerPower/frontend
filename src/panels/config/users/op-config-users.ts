import { mdiPlus } from "@mdi/js";
import {
  customElement,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import { html } from "lit-html";
import memoizeOne from "memoize-one";
import { OPPDomEvent } from "../../../common/dom/fire_event";
import {
  DataTableColumnContainer,
  RowClickedEvent,
} from "../../../components/data-table/op-data-table";
import "../../../components/op-fab";
import "../../../components/op-svg-icon";
import { deleteUser, fetchUsers, updateUser, User } from "../../../data/user";
import { showConfirmationDialog } from "../../../dialogs/generic/show-dialog-box";
import "../../../layouts/opp-tabs-subpage-data-table";
import { OpenPeerPower, Route } from "../../../types";
import { configSections } from "../op-panel-config";
import { showAddUserDialog } from "./show-dialog-add-user";
import { showUserDetailDialog } from "./show-dialog-user-detail";

@customElement("op-config-users")
export class HaConfigUsers extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public _users: User[] = [];

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  private _columns = memoizeOne(
    (narrow: boolean, _language): DataTableColumnContainer => {
      const columns: DataTableColumnContainer = {
        name: {
          title: this.opp.localize("ui.panel.config.users.picker.headers.name"),
          sortable: true,
          filterable: true,
          width: "25%",
          direction: "asc",
          grows: true,
          template: (name, user: any) =>
            narrow
              ? html` ${name}<br />
                  <div class="secondary">
                    ${user.username} |
                    ${this.opp.localize(`groups.${user.group_ids[0]}`)}
                  </div>`
              : html` ${name ||
                this.opp!.localize(
                  "ui.panel.config.users.editor.unnamed_user"
                )}`,
        },
        username: {
          title: this.opp.localize(
            "ui.panel.config.users.picker.headers.username"
          ),
          sortable: true,
          filterable: true,
          width: "20%",
          direction: "asc",
          hidden: narrow,
          template: (username) => html`
            ${username ||
            this.opp!.localize("ui.panel.config.users.editor.unnamed_user")}
          `,
        },
        group_ids: {
          title: this.opp.localize(
            "ui.panel.config.users.picker.headers.group"
          ),
          sortable: true,
          filterable: true,
          width: "20%",
          direction: "asc",
          hidden: narrow,
          template: (groupIds) => html`
            ${this.opp.localize(`groups.${groupIds[0]}`)}
          `,
        },
        is_active: {
          title: this.opp.localize(
            "ui.panel.config.users.picker.headers.is_active"
          ),
          type: "icon",
          sortable: true,
          filterable: true,
          width: "80px",
          template: (is_active) =>
            is_active ? html`<op-icon icon="opp:check"> </op-icon>` : "",
        },
        system_generated: {
          title: this.opp.localize(
            "ui.panel.config.users.picker.headers.system"
          ),
          type: "icon",
          sortable: true,
          filterable: true,
          width: "160px",
          template: (generated) =>
            generated ? html`<op-icon icon="opp:check"> </op-icon>` : "",
        },
      };

      return columns;
    }
  );

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this._fetchUsers();
  }

  protected render() {
    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        .route=${this.route}
        backPath="/config"
        .tabs=${configSections.persons}
        .columns=${this._columns(this.narrow, this.opp.language)}
        .data=${this._users}
        @row-click=${this._editUser}
        hasFab
        clickable
      >
        <op-fab
          slot="fab"
          .label=${this.opp.localize("ui.panel.config.users.picker.add_user")}
          extended
          @click=${this._addUser}
        >
          <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage-data-table>
    `;
  }

  private async _fetchUsers() {
    this._users = await fetchUsers(this.opp);

    this._users.forEach(function (user) {
      if (user.is_owner) {
        user.group_ids.unshift("owner");
      }
    });
  }

  private _editUser(ev: OPPDomEvent<RowClickedEvent>) {
    const id = ev.detail.id;
    const entry = this._users.find((user) => user.id === id);

    if (!entry) {
      return;
    }

    showUserDetailDialog(this, {
      entry,
      updateEntry: async (values) => {
        const updated = await updateUser(this.opp!, entry!.id, values);
        this._users = this._users!.map((ent) =>
          ent === entry ? updated.user : ent
        );
      },
      removeEntry: async () => {
        if (
          !(await showConfirmationDialog(this, {
            title: this.opp!.localize(
              "ui.panel.config.users.editor.confirm_user_deletion",
              "name",
              entry.name
            ),
            dismissText: this.opp!.localize("ui.common.cancel"),
            confirmText: this.opp!.localize("ui.common.delete"),
          }))
        ) {
          return false;
        }

        try {
          await deleteUser(this.opp!, entry!.id);
          this._users = this._users!.filter((ent) => ent !== entry);
          return true;
        } catch (err) {
          return false;
        }
      },
    });
  }

  private _addUser() {
    showAddUserDialog(this, {
      userAddedCallback: async (user: User) => {
        if (user) {
          this._users = [...this._users, user];
        }
      },
    });
  }
}
