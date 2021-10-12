import "@polymer/paper-item/paper-icon-item";
import "@polymer/paper-item/paper-item-body";
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
import memoizeOne from "memoize-one";
import { fireEvent } from "../../../../common/dom/fire_event";
import { compare } from "../../../../common/string/compare";
import { HaSwitch } from "../../../../components/op-switch";
import "../../../../components/user/ha-user-badge";
import { LovelaceViewConfig, ShowViewConfig } from "../../../../data/lovelace";
import { fetchUsers, User } from "../../../../data/user";
import { OpenPeerPower } from "../../../../types";

declare global {
  interface OPPDomEvents {
    "view-visibility-changed": {
      visible: ShowViewConfig[];
    };
  }
}

@customElement("hui-view-visibility-editor")
export class HuiViewVisibilityEditor extends LitElement {
  set config(config: LovelaceViewConfig) {
    this._config = config;
    this._visible =
      this._config.visible === undefined ? true : this._config.visible;
  }

  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public _config!: LovelaceViewConfig;

  @internalProperty() private _users!: User[];

  @internalProperty() private _visible!: boolean | ShowViewConfig[];

  private _sortedUsers = memoizeOne((users: User[]) => {
    return users.sort((a, b) => compare(a.name, b.name));
  });

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);

    fetchUsers(this.opp).then((users) => {
      this._users = users.filter((user) => !user.system_generated);
      fireEvent(this, "iron-resize");
    });
  }

  protected render(): TemplateResult {
    if (!this.opp || !this._users) {
      return html``;
    }

    return html`
      <p>
        ${this.opp.localize(
          "ui.panel.lovelace.editor.edit_view.visibility.select_users"
        )}
      </p>
      ${this._sortedUsers(this._users).map(
        (user) => html`
          <paper-icon-item>
            <op-user-badge
              slot="item-icon"
              .opp=${this.opp}
              .user=${user}
            ></op-user-badge>
            <paper-item-body>${user.name}</paper-item-body>
            <op-switch
              .userId="${user.id}"
              @change=${this.valChange}
              .checked=${this.checkUser(user.id)}
            ></op-switch>
          </paper-icon-item>
        `
      )}
    `;
  }

  protected checkUser(userId: string): boolean {
    if (this._visible === undefined) {
      return true;
    }
    if (typeof this._visible === "boolean") {
      return this._visible as boolean;
    }
    return (this._visible as ShowViewConfig[]).some((u) => u.user === userId);
  }

  private valChange(ev: Event): void {
    const userId = (ev.currentTarget as any).userId;
    const checked = (ev.currentTarget as HaSwitch).checked;

    let newVisible: ShowViewConfig[] = [];

    if (typeof this._visible === "boolean") {
      const lastValue = this._visible as boolean;
      if (lastValue) {
        newVisible = this._users.map((u) => {
          return {
            user: u.id,
          };
        });
      }
    } else {
      newVisible = [...this._visible];
    }

    if (checked === true) {
      const newEntry: ShowViewConfig = {
        user: userId,
      };
      newVisible.push(newEntry);
    } else {
      newVisible = (newVisible as ShowViewConfig[]).filter(
        (c) => c.user !== userId
      );
    }

    // this removes users that doesn't exists in system but had view permissions
    this._visible = newVisible.filter((c) =>
      this._users.some((u) => u.id === c.user)
    );

    fireEvent(this, "view-visibility-changed", { visible: this._visible });
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-view-visibility-editor": HuiViewVisibilityEditor;
  }
}
