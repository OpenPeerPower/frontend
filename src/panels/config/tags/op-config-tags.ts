import "@material/mwc-icon-button";
import {
  mdiCog,
  mdiContentDuplicate,
  mdiHelpCircle,
  mdiPlus,
  mdiRobot,
} from "@mdi/js";
import {
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
} from "lit-element";
import memoizeOne from "memoize-one";
import { DataTableColumnContainer } from "../../../components/data-table/op-data-table";
import "../../../components/op-card";
import "../../../components/op-fab";
import "../../../components/op-relative-time";
import { showAutomationEditor, TagTrigger } from "../../../data/automation";
import {
  createTag,
  deleteTag,
  EVENT_TAG_SCANNED,
  fetchTags,
  Tag,
  TagScannedEvent,
  updateTag,
  UpdateTagParams,
} from "../../../data/tag";
import {
  showAlertDialog,
  showConfirmationDialog,
} from "../../../dialogs/generic/show-dialog-box";
import { getExternalConfig } from "../../../external_app/external_config";
import "../../../layouts/opp-tabs-subpage-data-table";
import { SubscribeMixin } from "../../../mixins/subscribe-mixin";
import { OpenPeerPower, Route } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { configSections } from "../op-panel-config";
import { showTagDetailDialog } from "./show-dialog-tag-detail";
import "./tag-image";

export interface TagRowData extends Tag {
  last_scanned_datetime: Date | null;
}

@customElement("op-config-tags")
export class HaConfigTags extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public isWide!: boolean;

  @property() public narrow!: boolean;

  @property() public route!: Route;

  @internalProperty() private _tags: Tag[] = [];

  @internalProperty() private _canWriteTags = false;

  private _columns = memoizeOne(
    (
      narrow: boolean,
      canWriteTags: boolean,
      _language
    ): DataTableColumnContainer => {
      const columns: DataTableColumnContainer = {
        icon: {
          title: "",
          type: "icon",
          template: (_icon, tag) => html`<tag-image .tag=${tag}></tag-image>`,
        },
        display_name: {
          title: this.opp.localize("ui.panel.config.tag.headers.name"),
          sortable: true,
          filterable: true,
          grows: true,
          template: (name, tag: any) => html`${name}
          ${narrow
            ? html`<div class="secondary">
                ${tag.last_scanned_datetime
                  ? html`<op-relative-time
                      .opp=${this.opp}
                      .datetime=${tag.last_scanned_datetime}
                    ></op-relative-time>`
                  : this.opp.localize("ui.panel.config.tag.never_scanned")}
              </div>`
            : ""}`,
        },
      };
      if (!narrow) {
        columns.last_scanned_datetime = {
          title: this.opp.localize("ui.panel.config.tag.headers.last_scanned"),
          sortable: true,
          direction: "desc",
          width: "20%",
          template: (last_scanned_datetime) => html`
            ${last_scanned_datetime
              ? html`<op-relative-time
                  .opp=${this.opp}
                  .datetime=${last_scanned_datetime}
                ></op-relative-time>`
              : this.opp.localize("ui.panel.config.tag.never_scanned")}
          `,
        };
      }
      if (canWriteTags) {
        columns.write = {
          title: "",
          type: "icon-button",
          template: (_write, tag: any) => html` <mwc-icon-button
            .tag=${tag}
            @click=${(ev: Event) =>
              this._openWrite((ev.currentTarget as any).tag)}
            title=${this.opp.localize("ui.panel.config.tag.write")}
          >
            <op-svg-icon .path=${mdiContentDuplicate}></op-svg-icon>
          </mwc-icon-button>`,
        };
      }
      columns.automation = {
        title: "",
        type: "icon-button",
        template: (_automation, tag: any) => html` <mwc-icon-button
          .tag=${tag}
          @click=${(ev: Event) =>
            this._createAutomation((ev.currentTarget as any).tag)}
          title=${this.opp.localize("ui.panel.config.tag.create_automation")}
        >
          <op-svg-icon .path=${mdiRobot}></op-svg-icon>
        </mwc-icon-button>`,
      };
      columns.edit = {
        title: "",
        type: "icon-button",
        template: (_settings, tag: any) => html` <mwc-icon-button
          .tag=${tag}
          @click=${(ev: Event) =>
            this._openDialog((ev.currentTarget as any).tag)}
          title=${this.opp.localize("ui.panel.config.tag.edit")}
        >
          <op-svg-icon .path=${mdiCog}></op-svg-icon>
        </mwc-icon-button>`,
      };
      return columns;
    }
  );

  private _data = memoizeOne((tags: Tag[]): TagRowData[] => {
    return tags.map((tag) => {
      return {
        ...tag,
        display_name: tag.name || tag.id,
        last_scanned_datetime: tag.last_scanned
          ? new Date(tag.last_scanned)
          : null,
      };
    });
  });

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this._fetchTags();
    if (this.opp && this.opp.auth.external) {
      getExternalConfig(this.opp.auth.external).then((conf) => {
        this._canWriteTags = conf.canWriteTag;
      });
    }
  }

  protected oppSubscribe() {
    return [
      this.opp.connection.subscribeEvents<TagScannedEvent>((ev) => {
        const foundTag = this._tags.find((tag) => tag.id === ev.data.tag_id);
        if (!foundTag) {
          this._fetchTags();
          return;
        }
        foundTag.last_scanned = ev.time_fired;
        this._tags = [...this._tags];
      }, EVENT_TAG_SCANNED),
    ];
  }

  protected render() {
    return html`
      <opp-tabs-subpage-data-table
        .opp=${this.opp}
        .narrow=${this.narrow}
        back-path="/config"
        .route=${this.route}
        .tabs=${configSections.experimental}
        .columns=${this._columns(
          this.narrow,
          this._canWriteTags,
          this.opp.language
        )}
        .data=${this._data(this._tags)}
        .noDataText=${this.opp.localize("ui.panel.config.tag.no_tags")}
        hasFab
      >
        <mwc-icon-button slot="toolbar-icon" @click=${this._showHelp}>
          <op-svg-icon .path=${mdiHelpCircle}></op-svg-icon>
        </mwc-icon-button>
        <op-fab
          slot="fab"
          .label=${this.opp.localize("ui.panel.config.tag.add_tag")}
          extended
          @click=${this._addTag}
        >
          <op-svg-icon slot="icon" .path=${mdiPlus}></op-svg-icon>
        </op-fab>
      </opp-tabs-subpage-data-table>
    `;
  }

  private _showHelp() {
    showAlertDialog(this, {
      title: this.opp.localize("ui.panel.config.tag.caption"),
      text: html`
        <p>
          ${this.opp.localize(
            "ui.panel.config.tag.detail.usage",
            "companion_link",
            html`<a
              href="https://companion.openpeerpower.io/"
              target="_blank"
              rel="noreferrer"
              >${this.opp!.localize(
                "ui.panel.config.tag.detail.companion_apps"
              )}</a
            >`
          )}
        </p>
        <p>
          <a
            href="${documentationUrl(this.opp, "/integrations/tag/")}"
            target="_blank"
            rel="noreferrer"
          >
            ${this.opp.localize("ui.panel.config.tag.learn_more")}
          </a>
        </p>
      `,
    });
  }

  private async _fetchTags() {
    this._tags = await fetchTags(this.opp);
  }

  private _openWrite(tag: Tag) {
    this.opp.auth.external!.fireMessage({
      type: "tag/write",
      payload: { name: tag.name || null, tag: tag.id },
    });
  }

  private _createAutomation(tag: Tag) {
    const data = {
      alias: this.opp.localize(
        "ui.panel.config.tag.automation_title",
        "name",
        tag.name || tag.id
      ),
      trigger: [{ platform: "tag", tag_id: tag.id } as TagTrigger],
    };
    showAutomationEditor(this, data);
  }

  private _addTag() {
    this._openDialog();
  }

  private _openDialog(entry?: Tag) {
    showTagDetailDialog(this, {
      entry,
      openWrite: this._canWriteTags ? (tag) => this._openWrite(tag) : undefined,
      createEntry: (values, tagId) => this._createTag(values, tagId),
      updateEntry: entry
        ? (values) => this._updateTag(entry, values)
        : undefined,
      removeEntry: entry ? () => this._removeTag(entry) : undefined,
    });
  }

  private async _createTag(
    values: Partial<UpdateTagParams>,
    tagId?: string
  ): Promise<Tag> {
    const newTag = await createTag(this.opp, values, tagId);
    this._tags = [...this._tags, newTag];
    return newTag;
  }

  private async _updateTag(
    selectedTag: Tag,
    values: Partial<UpdateTagParams>
  ): Promise<Tag> {
    const updated = await updateTag(this.opp, selectedTag.id, values);
    this._tags = this._tags.map((tag) =>
      tag.id === selectedTag.id ? updated : tag
    );
    return updated;
  }

  private async _removeTag(selectedTag: Tag) {
    if (
      !(await showConfirmationDialog(this, {
        title: this.opp!.localize("ui.panel.config.tag.confirm_remove_title"),
        text: this.opp.localize(
          "ui.panel.config.tag.confirm_remove",
          "tag",
          selectedTag.name || selectedTag.id
        ),
        dismissText: this.opp!.localize("ui.common.cancel"),
        confirmText: this.opp!.localize("ui.common.remove"),
      }))
    ) {
      return false;
    }
    try {
      await deleteTag(this.opp, selectedTag.id);
      this._tags = this._tags.filter((tag) => tag.id !== selectedTag.id);
      return true;
    } catch (err) {
      return false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-config-tags": HaConfigTags;
  }
}
