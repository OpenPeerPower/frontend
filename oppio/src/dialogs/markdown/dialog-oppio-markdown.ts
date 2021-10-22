import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { createCloseHeading } from "../../../../src/components/op-dialog";
import "../../../../src/components/op-markdown";
import { haStyleDialog } from "../../../../src/resources/styles";
import { OpenPeerPower } from "../../../../src/types";
import { oppioStyle } from "../../resources/oppio-style";
import { OppioMarkdownDialogParams } from "./show-dialog-oppio-markdown";

@customElement("dialog-oppio-markdown")
class OppioMarkdownDialog extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public title!: string;

  @property() public content!: string;

  @state() private _opened = false;

  public showDialog(params: OppioMarkdownDialogParams) {
    this.title = params.title;
    this.content = params.content;
    this._opened = true;
  }

  public closeDialog() {
    this._opened = false;
  }

  protected render(): TemplateResult {
    if (!this._opened) {
      return html``;
    }
    return html`
      <op-dialog
        open
        @closed=${this.closeDialog}
        .heading=${createCloseHeading(this.opp, this.title)}
      >
        <op-markdown .content=${this.content || ""}></op-markdown>
      </op-dialog>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      oppioStyle,
      css`
        op-paper-dialog {
          min-width: 350px;
          font-size: 14px;
          border-radius: 2px;
        }
        app-toolbar {
          margin: 0;
          padding: 0 16px;
          color: var(--primary-text-color);
          background-color: var(--secondary-background-color);
        }
        app-toolbar [main-title] {
          margin-left: 16px;
        }
        @media all and (max-width: 450px), all and (max-height: 500px) {
          op-paper-dialog {
            max-height: 100%;
          }
          op-paper-dialog::before {
            content: "";
            position: fixed;
            z-index: -1;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            background-color: inherit;
          }
          app-toolbar {
            color: var(--text-primary-color);
            background-color: var(--primary-color);
          }
          op-markdown {
            padding: 16px;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-oppio-markdown": OppioMarkdownDialog;
  }
}
