import {
  css,
  CSSResult,
  customElement,
  html,
  internalProperty,
  LitElement,
  property,
  PropertyValues,
  query,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../common/dom/fire_event";
import { nextRender } from "../common/util/render-status";
import { getExternalConfig } from "../external_app/external_config";
import type { OpenPeerPower } from "../types";

type HLSModule = typeof import("hls.js");

@customElement("ha-hls-player")
class HaHLSPlayer extends LitElement {
  @property({ attribute: false }) public opp!: OpenPeerPower;

  @property() public url!: string;

  @property({ type: Boolean, attribute: "controls" })
  public controls = false;

  @property({ type: Boolean, attribute: "muted" })
  public muted = false;

  @property({ type: Boolean, attribute: "autoplay" })
  public autoPlay = false;

  @property({ type: Boolean, attribute: "playsinline" })
  public playsInline = false;

  @property({ type: Boolean, attribute: "allow-exoplayer" })
  public allowExoPlayer = false;

  // don't cache this, as we remove it on disconnects
  @query("video") private _videoEl!: HTMLVideoElement;

  @internalProperty() private _attached = false;

  private _hlsPolyfillInstance?: Hls;

  private _useExoPlayer = false;

  public connectedCallback() {
    super.connectedCallback();
    this._attached = true;
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._attached = false;
  }

  protected render(): TemplateResult {
    if (!this._attached) {
      return html``;
    }

    return html`
      <video
        ?autoplay=${this.autoPlay}
        .muted=${this.muted}
        ?playsinline=${this.playsInline}
        ?controls=${this.controls}
        @loadeddata=${this._elementResized}
      ></video>
    `;
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    const attachedChanged = changedProps.has("_attached");
    const urlChanged = changedProps.has("url");

    if (!urlChanged && !attachedChanged) {
      return;
    }

    // If we are no longer attached, destroy polyfill
    if (attachedChanged && !this._attached) {
      // Tear down existing polyfill, if available
      this._destroyPolyfill();
      return;
    }

    this._destroyPolyfill();
    this._startHls();
  }

  private async _getUseExoPlayer(): Promise<boolean> {
    if (!this.opp!.auth.external || !this.allowExoPlayer) {
      return false;
    }
    const externalConfig = await getExternalConfig(this.opp!.auth.external);
    return externalConfig && externalConfig.hasExoPlayer;
  }

  private async _startHls(): Promise<void> {
    const videoEl = this._videoEl;
    const useExoPlayerPromise = this._getUseExoPlayer();
    const masterPlaylistPromise = fetch(this.url);

    const hls = ((await import("hls.js")) as any).default as HLSModule;
    let hlsSupported = hls.isSupported();

    if (!hlsSupported) {
      hlsSupported =
        videoEl.canPlayType("application/vnd.apple.mpegurl") !== "";
    }

    if (!hlsSupported) {
      this._videoEl.innerHTML = this.opp.localize(
        "ui.components.media-browser.video_not_supported"
      );
      return;
    }

    this._useExoPlayer = await useExoPlayerPromise;
    const masterPlaylist = await (await masterPlaylistPromise).text();

    // Parse playlist assuming it is a master playlist. Match group 1 is whether hevc, match group 2 is regular playlist url
    // See https://tools.ietf.org/html/rfc8216 for HLS spec details
    const playlistRegexp = /#EXT-X-STREAM-INF:.*?(?:CODECS=".*?(hev1|hvc1)?\..*?".*?)?(?:\n|\r\n)(.+)/g;
    const match = playlistRegexp.exec(masterPlaylist);
    const matchTwice = playlistRegexp.exec(masterPlaylist);

    // Get the regular playlist url from the input (master) playlist, falling back to the input playlist if necessary
    // This avoids the player having to load and parse the master playlist again before loading the regular playlist
    let playlist_url: string;
    if (match !== null && matchTwice === null) {
      // Only send the regular playlist url if we match exactly once
      playlist_url = new URL(match[2], this.url).href;
    } else {
      playlist_url = this.url;
    }

    // If codec is HEVC and ExoPlayer is supported, use ExoPlayer.
    if (this._useExoPlayer && match !== null && match[1] !== undefined) {
      this._renderHLSExoPlayer(playlist_url);
    } else if (hls.isSupported()) {
      this._renderHLSPolyfill(videoEl, hls, playlist_url);
    } else {
      this._renderHLSNative(videoEl, playlist_url);
    }
  }

  private async _renderHLSExoPlayer(url: string) {
    window.addEventListener("resize", this._resizeExoPlayer);
    this.updateComplete.then(() => nextRender()).then(this._resizeExoPlayer);
    this._videoEl.style.visibility = "hidden";
    await this.opp!.auth.external!.sendMessage({
      type: "exoplayer/play_hls",
      payload: {
        url: new URL(url, window.location.href).toString(),
        muted: this.muted,
      },
    });
  }

  private _resizeExoPlayer = () => {
    if (!this._videoEl) {
      return;
    }
    const rect = this._videoEl.getBoundingClientRect();
    this.opp!.auth.external!.fireMessage({
      type: "exoplayer/resize",
      payload: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      },
    });
  };

  private async _renderHLSPolyfill(
    videoEl: HTMLVideoElement,
    Hls: HLSModule,
    url: string
  ) {
    const hls = new Hls({
      liveBackBufferLength: 60,
      fragLoadingTimeOut: 30000,
      manifestLoadingTimeOut: 30000,
      levelLoadingTimeOut: 30000,
    });
    this._hlsPolyfillInstance = hls;
    hls.attachMedia(videoEl);
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(url);
    });
  }

  private async _renderHLSNative(videoEl: HTMLVideoElement, url: string) {
    videoEl.src = url;
    await new Promise((resolve) =>
      videoEl.addEventListener("loadedmetadata", resolve)
    );
    videoEl.play();
  }

  private _elementResized() {
    fireEvent(this, "iron-resize");
  }

  private _destroyPolyfill() {
    if (this._hlsPolyfillInstance) {
      this._hlsPolyfillInstance.destroy();
      this._hlsPolyfillInstance = undefined;
    }
    if (this._useExoPlayer) {
      window.removeEventListener("resize", this._resizeExoPlayer);
      this.opp!.auth.external!.fireMessage({ type: "exoplayer/stop" });
    }
  }

  static get styles(): CSSResult {
    return css`
      :host,
      video {
        display: block;
      }

      video {
        width: 100%;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-hls-player": HaHLSPlayer;
  }
}
