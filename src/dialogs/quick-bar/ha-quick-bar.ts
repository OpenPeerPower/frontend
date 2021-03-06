import "@material/mwc-list/mwc-list";
import type { List } from "@material/mwc-list/mwc-list";
import { SingleSelectedEvent } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-list/mwc-list-item";
import type { ListItem } from "@material/mwc-list/mwc-list-item";
import {
  mdiClose,
  mdiConsoleLine,
  mdiEarth,
  mdiMagnify,
  mdiReload,
  mdiServerNetwork,
} from "@mdi/js";
import {
  css,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  query,
} from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import { styleMap } from "lit-html/directives/style-map";
import { scroll } from "lit-virtualizer";
import memoizeOne from "memoize-one";
import { canShowPage } from "../../common/config/can_show_page";
import { componentsWithService } from "../../common/config/components_with_service";
import { fireEvent } from "../../common/dom/fire_event";
import { computeDomain } from "../../common/entity/compute_domain";
import { computeStateName } from "../../common/entity/compute_state_name";
import { domainIcon } from "../../common/entity/domain_icon";
import { navigate } from "../../common/navigate";
import "../../common/search/search-input";
import { compare } from "../../common/string/compare";
import {
  fuzzyFilterSort,
  ScorableTextItem,
} from "../../common/string/filter/sequence-matching";
import { debounce } from "../../common/util/debounce";
import "../../components/ha-circular-progress";
import "../../components/ha-dialog";
import "../../components/ha-header-bar";
import { domainToName } from "../../data/integration";
import { getPanelNameTranslationKey } from "../../data/panel";
import { PageNavigation } from "../../layouts/opp-tabs-subpage";
import { configSections } from "../../panels/config/ha-panel-config";
import { haStyleDialog } from "../../resources/styles";
import { OpenPeerPower } from "../../types";
import {
  ConfirmationDialogParams,
  showConfirmationDialog,
} from "../generic/show-dialog-box";
import { QuickBarParams } from "./show-dialog-quick-bar";
import "../../components/ha-chip";

interface QuickBarItem extends ScorableTextItem {
  primaryText: string;
  iconPath?: string;
  action(data?: any): void;
}

interface CommandItem extends QuickBarItem {
  categoryKey: "reload" | "navigation" | "server_control";
  categoryText: string;
}

interface EntityItem extends QuickBarItem {
  altText: string;
  icon?: string;
}

const isCommandItem = (item: QuickBarItem): item is CommandItem => {
  return (item as CommandItem).categoryKey !== undefined;
};

interface QuickBarNavigationItem extends CommandItem {
  path: string;
}

type NavigationInfo = PageNavigation & Pick<QuickBarItem, "primaryText">;

type BaseNavigationCommand = Pick<
  QuickBarNavigationItem,
  "primaryText" | "path"
>;
@customElement("ha-quick-bar")
export class QuickBar extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @internalProperty() private _commandItems?: CommandItem[];

  @internalProperty() private _entityItems?: EntityItem[];

  @internalProperty() private _filter = "";

  @internalProperty() private _search = "";

  @internalProperty() private _opened = false;

  @internalProperty() private _commandMode = false;

  @internalProperty() private _done = false;

  @query("paper-input", false) private _filterInputField?: HTMLElement;

  private _focusSet = false;

  public async showDialog(params: QuickBarParams) {
    this._commandMode = params.commandMode || this._toggleIfAlreadyOpened();
    this._initializeItemsIfNeeded();
    this._opened = true;
  }

  public closeDialog() {
    this._opened = false;
    this._done = false;
    this._focusSet = false;
    this._filter = "";
    this._search = "";
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render() {
    if (!this._opened) {
      return html``;
    }

    let items: QuickBarItem[] | undefined = this._commandMode
      ? this._commandItems
      : this._entityItems;

    if (items && this._filter && this._filter !== " ") {
      items = this._filterItems(items || [], this._filter);
    }

    return html`
      <ha-dialog
        .heading=${true}
        open
        @opened=${this._handleOpened}
        @closed=${this.closeDialog}
        hideActions
      >
        <paper-input
          dialogInitialFocus
          no-label-float
          slot="heading"
          class="heading"
          @value-changed=${this._handleSearchChange}
          .label=${this.opp.localize("ui.dialogs.quick-bar.filter_placeholder")}
          .value=${this._commandMode ? `>${this._search}` : this._search}
          @keydown=${this._handleInputKeyDown}
          @focus=${this._setFocusFirstListItem}
        >
          ${this._commandMode
            ? html`<ha-svg-icon
                slot="prefix"
                class="prefix"
                .path=${mdiConsoleLine}
              ></ha-svg-icon>`
            : html`<ha-svg-icon
                slot="prefix"
                class="prefix"
                .path=${mdiMagnify}
              ></ha-svg-icon>`}
          ${this._search &&
          html`
            <mwc-icon-button
              slot="suffix"
              @click=${this._clearSearch}
              title="Clear"
            >
              <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
            </mwc-icon-button>
          `}
        </paper-input>
        ${!items
          ? html`<ha-circular-progress
              size="small"
              active
            ></ha-circular-progress>`
          : html`<mwc-list
              @rangechange=${this._handleRangeChanged}
              @keydown=${this._handleListItemKeyDown}
              @selected=${this._handleSelected}
              style=${styleMap({
                height: `${Math.min(
                  items.length * (this._commandMode ? 56 : 72) + 26,
                  this._done ? 500 : 0
                )}px`,
              })}
            >
              ${scroll({
                items,
                renderItem: (item: QuickBarItem, index?: number) =>
                  this._renderItem(item, index),
              })}
            </mwc-list>`}
      </ha-dialog>
    `;
  }

  private _initializeItemsIfNeeded() {
    if (this._commandMode) {
      this._commandItems = this._commandItems || this._generateCommandItems();
    } else {
      this._entityItems = this._entityItems || this._generateEntityItems();
    }
  }

  private _handleOpened() {
    this.updateComplete.then(() => {
      this._done = true;
    });
  }

  private async _handleRangeChanged(e) {
    if (this._focusSet) {
      return;
    }
    if (e.firstVisible > -1) {
      this._focusSet = true;
      await this.updateComplete;
      this._setFocusFirstListItem();
    }
  }

  private _renderItem(item: QuickBarItem, index?: number) {
    return isCommandItem(item)
      ? this._renderCommandItem(item, index)
      : this._renderEntityItem(item as EntityItem, index);
  }

  private _renderEntityItem(item: EntityItem, index?: number) {
    return html`
      <mwc-list-item
        .twoline=${Boolean(item.altText)}
        .item=${item}
        index=${ifDefined(index)}
        graphic="icon"
      >
        ${item.iconPath
          ? html`<ha-svg-icon
              .path=${item.iconPath}
              class="entity"
              slot="graphic"
            ></ha-svg-icon>`
          : html`<ha-icon
              .icon=${item.icon}
              class="entity"
              slot="graphic"
            ></ha-icon>`}
        <span>${item.primaryText}</span>
        ${item.altText
          ? html`
              <span slot="secondary" class="item-text secondary"
                >${item.altText}</span
              >
            `
          : null}
      </mwc-list-item>
    `;
  }

  private _renderCommandItem(item: CommandItem, index?: number) {
    return html`
      <mwc-list-item
        .item=${item}
        index=${ifDefined(index)}
        class="command-item"
        hasMeta
      >
        <span>
          <ha-chip
            .label="${item.categoryText}"
            hasIcon
            class="command-category ${item.categoryKey}"
          >
            ${item.iconPath
              ? html`<ha-svg-icon
                  .path=${item.iconPath}
                  slot="icon"
                ></ha-svg-icon>`
              : ""}
            ${item.categoryText}</ha-chip
          >
        </span>

        <span class="command-text">${item.primaryText}</span>
      </mwc-list-item>
    `;
  }

  private async processItemAndCloseDialog(item: QuickBarItem, index: number) {
    this._addSpinnerToCommandItem(index);

    await item.action();
    this.closeDialog();
  }

  private _handleSelected(ev: SingleSelectedEvent) {
    const index = ev.detail.index;
    const item = ((ev.target as List).items[index] as any).item;
    this.processItemAndCloseDialog(item, index);
  }

  private _handleInputKeyDown(ev: KeyboardEvent) {
    if (ev.code === "Enter") {
      const firstItem = this._getItemAtIndex(0);
      if (!firstItem || firstItem.style.display === "none") {
        return;
      }
      this.processItemAndCloseDialog((firstItem as any).item, 0);
    } else if (ev.code === "ArrowDown") {
      ev.preventDefault();
      this._getItemAtIndex(0)?.focus();
      this._getItemAtIndex(1)?.focus();
    }
  }

  private _getItemAtIndex(index: number): ListItem | null {
    return this.renderRoot.querySelector(`mwc-list-item[index="${index}"]`);
  }

  private _addSpinnerToCommandItem(index: number): void {
    const spinner = document.createElement("ha-circular-progress");
    spinner.size = "small";
    spinner.slot = "meta";
    spinner.active = true;
    this._getItemAtIndex(index)?.appendChild(spinner);
  }

  private _handleSearchChange(ev: CustomEvent): void {
    const newFilter = ev.detail.value;
    const oldCommandMode = this._commandMode;

    if (newFilter.startsWith(">")) {
      this._commandMode = true;
      this._search = newFilter.substring(1);
    } else {
      this._commandMode = false;
      this._search = newFilter;
    }

    if (oldCommandMode !== this._commandMode) {
      this._focusSet = false;
      this._initializeItemsIfNeeded();
      this._filter = this._search;
    } else {
      this._debouncedSetFilter(this._search);
    }
  }

  private _clearSearch() {
    this._search = "";
    this._filter = "";
  }

  private _debouncedSetFilter = debounce((filter: string) => {
    this._filter = filter;
  }, 100);

  private _setFocusFirstListItem() {
    // @ts-ignore
    this._getItemAtIndex(0)?.rippleHandlers.startFocus();
  }

  private _handleListItemKeyDown(ev: KeyboardEvent) {
    const isSingleCharacter = ev.key.length === 1;
    const isFirstListItem =
      (ev.target as HTMLElement).getAttribute("index") === "0";
    if (ev.key === "ArrowUp") {
      if (isFirstListItem) {
        this._filterInputField?.focus();
      }
    }
    if (ev.key === "Backspace" || isSingleCharacter) {
      (ev.currentTarget as List).scrollTop = 0;
      this._filterInputField?.focus();
    }
  }

  private _generateEntityItems(): EntityItem[] {
    return Object.keys(this.opp.states)
      .map((entityId) => {
        const entityItem = {
          primaryText: computeStateName(this.opp.states[entityId]),
          altText: entityId,
          icon: domainIcon(computeDomain(entityId), this.opp.states[entityId]),
          action: () => fireEvent(this, "opp-more-info", { entityId }),
        };

        return {
          ...entityItem,
          strings: [entityItem.primaryText, entityItem.altText],
        };
      })
      .sort((a, b) =>
        compare(a.primaryText.toLowerCase(), b.primaryText.toLowerCase())
      );
  }

  private _generateCommandItems(): CommandItem[] {
    return [
      ...this._generateReloadCommands(),
      ...this._generateServerControlCommands(),
      ...this._generateNavigationCommands(),
    ].sort((a, b) =>
      compare(
        a.strings.join(" ").toLowerCase(),
        b.strings.join(" ").toLowerCase()
      )
    );
  }

  private _generateReloadCommands(): CommandItem[] {
    const reloadableDomains = componentsWithService(this.opp, "reload").sort();

    return reloadableDomains.map((domain) => {
      const commandItem = {
        primaryText:
          this.opp.localize(`ui.dialogs.quick-bar.commands.reload.${domain}`) ||
          this.opp.localize(
            "ui.dialogs.quick-bar.commands.reload.reload",
            "domain",
            domainToName(this.opp.localize, domain)
          ),
        action: () => this.opp.callService(domain, "reload"),
        iconPath: mdiReload,
        categoryText: this.opp.localize(
          `ui.dialogs.quick-bar.commands.types.reload`
        ),
      };

      return {
        ...commandItem,
        categoryKey: "reload",
        strings: [`${commandItem.categoryText} ${commandItem.primaryText}`],
      };
    });
  }

  private _generateServerControlCommands(): CommandItem[] {
    const serverActions = ["restart", "stop"];

    return serverActions.map((action) => {
      const categoryKey: CommandItem["categoryKey"] = "server_control";

      const item = {
        primaryText: this.opp.localize(
          "ui.dialogs.quick-bar.commands.server_control.perform_action",
          "action",
          this.opp.localize(
            `ui.dialogs.quick-bar.commands.server_control.${action}`
          )
        ),
        iconPath: mdiServerNetwork,
        categoryText: this.opp.localize(
          `ui.dialogs.quick-bar.commands.types.${categoryKey}`
        ),
        categoryKey,
        action: () => this.opp.callService("openpeerpower", action),
      };

      return this._generateConfirmationCommand(
        {
          ...item,
          strings: [`${item.categoryText} ${item.primaryText}`],
        },
        this.opp.localize("ui.dialogs.generic.ok")
      );
    });
  }

  private _generateNavigationCommands(): CommandItem[] {
    const panelItems = this._generateNavigationPanelCommands();
    const sectionItems = this._generateNavigationConfigSectionCommands();

    return this._finalizeNavigationCommands([...panelItems, ...sectionItems]);
  }

  private _generateNavigationPanelCommands(): BaseNavigationCommand[] {
    return Object.keys(this.opp.panels)
      .filter((panelKey) => panelKey !== "_my_redirect")
      .map((panelKey) => {
        const panel = this.opp.panels[panelKey];
        const translationKey = getPanelNameTranslationKey(panel);

        const primaryText =
          this.opp.localize(translationKey) || panel.title || panel.url_path;

        return {
          primaryText,
          path: `/${panel.url_path}`,
        };
      });
  }

  private _generateNavigationConfigSectionCommands(): BaseNavigationCommand[] {
    const items: NavigationInfo[] = [];

    for (const sectionKey of Object.keys(configSections)) {
      for (const page of configSections[sectionKey]) {
        if (canShowPage(this.opp, page)) {
          if (page.component) {
            const info = this._getNavigationInfoFromConfig(page);

            if (info) {
              items.push(info);
            }
          }
        }
      }
    }

    return items;
  }

  private _getNavigationInfoFromConfig(
    page: PageNavigation
  ): NavigationInfo | undefined {
    if (page.component) {
      const caption = this.opp.localize(
        `ui.dialogs.quick-bar.commands.navigation.${page.component}`
      );

      if (page.translationKey && caption) {
        return { ...page, primaryText: caption };
      }
    }

    return undefined;
  }

  private _generateConfirmationCommand(
    item: CommandItem,
    confirmText: ConfirmationDialogParams["confirmText"]
  ): CommandItem {
    return {
      ...item,
      action: () =>
        showConfirmationDialog(this, {
          confirmText,
          confirm: item.action,
        }),
    };
  }

  private _finalizeNavigationCommands(
    items: BaseNavigationCommand[]
  ): CommandItem[] {
    return items.map((item) => {
      const categoryKey: CommandItem["categoryKey"] = "navigation";

      const navItem = {
        ...item,
        iconPath: mdiEarth,
        categoryText: this.opp.localize(
          `ui.dialogs.quick-bar.commands.types.${categoryKey}`
        ),
        action: () => navigate(this, item.path),
      };

      return {
        ...navItem,
        strings: [`${navItem.categoryText} ${navItem.primaryText}`],
        categoryKey,
      };
    });
  }

  private _toggleIfAlreadyOpened() {
    return this._opened ? !this._commandMode : false;
  }

  private _filterItems = memoizeOne(
    (items: QuickBarItem[], filter: string): QuickBarItem[] => {
      return fuzzyFilterSort<QuickBarItem>(filter.trimLeft(), items);
    }
  );

  static get styles() {
    return [
      haStyleDialog,
      css`
        .heading {
          padding: 8px 20px 0px;
        }

        ha-dialog {
          --dialog-z-index: 8;
          --dialog-content-padding: 0;
        }

        @media (min-width: 800px) {
          ha-dialog {
            --mdc-dialog-max-width: 800px;
            --mdc-dialog-min-width: 500px;
            --dialog-surface-position: fixed;
            --dialog-surface-top: 40px;
            --mdc-dialog-max-height: calc(100% - 72px);
          }
        }

        ha-icon.entity,
        ha-svg-icon.entity {
          margin-left: 20px;
        }

        ha-svg-icon.prefix {
          margin: 8px;
          color: var(--primary-text-color);
        }

        paper-input mwc-icon-button {
          --mdc-icon-button-size: 24px;
          color: var(--primary-text-color);
        }

        .command-category {
          --op-chip-icon-color: #585858;
          --op-chip-text-color: #212121;
        }

        .command-category.reload {
          --op-chip-background-color: #cddc39;
        }

        .command-category.navigation {
          --op-chip-background-color: var(--light-primary-color);
        }

        .command-category.server_control {
          --op-chip-background-color: var(--warning-color);
        }

        span.command-text {
          margin-left: 8px;
        }

        .uni-virtualizer-host {
          display: block;
          position: relative;
          contain: strict;
          overflow: auto;
          height: 100%;
        }

        .uni-virtualizer-host > * {
          box-sizing: border-box;
        }

        mwc-list-item {
          width: 100%;
        }

        mwc-list-item.command-item {
          text-transform: capitalize;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-quick-bar": QuickBar;
  }
}
