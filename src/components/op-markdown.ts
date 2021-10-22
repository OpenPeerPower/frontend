import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators";
import "./op-markdown-element";

@customElement("op-markdown")
class HaMarkdown extends LitElement {
  @property() public content?;

  @property({ type: Boolean }) public allowSvg = false;

  @property({ type: Boolean }) public breaks = false;

  protected render(): TemplateResult {
    if (!this.content) {
      return html``;
    }

    return html`<op-markdown-element
      .content=${this.content}
      .allowSvg=${this.allowSvg}
      .breaks=${this.breaks}
    ></op-markdown-element>`;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      op-markdown-element {
        -ms-user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
      }
      op-markdown-element > *:first-child {
        margin-top: 0;
      }
      op-markdown-element > *:last-child {
        margin-bottom: 0;
      }
      op-markdown-element a {
        color: var(--primary-color);
      }
      op-markdown-element img {
        max-width: 100%;
      }
      op-markdown-element code,
      pre {
        background-color: var(--markdown-code-background-color, none);
        border-radius: 3px;
      }
      op-markdown-element svg {
        background-color: var(--markdown-svg-background-color, none);
        color: var(--markdown-svg-color, none);
      }
      op-markdown-element code {
        font-size: 85%;
        padding: 0.2em 0.4em;
      }
      op-markdown-element pre code {
        padding: 0;
      }
      op-markdown-element pre {
        padding: 16px;
        overflow: auto;
        line-height: 1.45;
        font-family: var(--code-font-family, monospace);
      }
      op-markdown-element h2 {
        font-size: 1.5em;
        font-weight: bold;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "op-markdown": HaMarkdown;
  }
}
