import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { batteryIcon } from "../../common/entity/battery_icon";
import "../ha-icon";

@customElement("op-battery-icon")
export class HaBatteryIcon extends LitElement {
  @property() public batteryStateObj;

  @property() public batteryChargingStateObj;

  protected render() {
    return html`
      <op-icon
        .icon=${batteryIcon(this.batteryStateObj, this.batteryChargingStateObj)}
      ></op-icon>
    `;
  }
}
