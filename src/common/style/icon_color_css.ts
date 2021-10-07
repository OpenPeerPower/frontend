import { css } from "lit";

export const iconColorCSS = css`
  op-icon[data-domain="alert"][data-state="on"],
  op-icon[data-domain="automation"][data-state="on"],
  op-icon[data-domain="binary_sensor"][data-state="on"],
  op-icon[data-domain="calendar"][data-state="on"],
  op-icon[data-domain="camera"][data-state="streaming"],
  op-icon[data-domain="cover"][data-state="open"],
  op-icon[data-domain="fan"][data-state="on"],
  op-icon[data-domain="humidifier"][data-state="on"],
  op-icon[data-domain="light"][data-state="on"],
  op-icon[data-domain="input_boolean"][data-state="on"],
  op-icon[data-domain="lock"][data-state="unlocked"],
  op-icon[data-domain="media_player"][data-state="on"],
  op-icon[data-domain="media_player"][data-state="paused"],
  op-icon[data-domain="media_player"][data-state="playing"],
  op-icon[data-domain="script"][data-state="on"],
  op-icon[data-domain="sun"][data-state="above_horizon"],
  op-icon[data-domain="switch"][data-state="on"],
  op-icon[data-domain="timer"][data-state="active"],
  op-icon[data-domain="vacuum"][data-state="cleaning"],
  op-icon[data-domain="group"][data-state="on"],
  op-icon[data-domain="group"][data-state="home"],
  op-icon[data-domain="group"][data-state="open"],
  op-icon[data-domain="group"][data-state="locked"],
  op-icon[data-domain="group"][data-state="problem"] {
    color: var(--paper-item-icon-active-color, #fdd835);
  }

  op-icon[data-domain="climate"][data-state="cooling"] {
    color: var(--cool-color, var(--state-climate-cool-color));
  }

  op-icon[data-domain="climate"][data-state="heating"] {
    color: var(--heat-color, var(--state-climate-heat-color));
  }

  op-icon[data-domain="climate"][data-state="drying"] {
    color: var(--dry-color, var(--state-climate-dry-color));
  }

  op-icon[data-domain="alarm_control_panel"] {
    color: var(--alarm-color-armed, var(--label-badge-red));
  }
  op-icon[data-domain="alarm_control_panel"][data-state="disarmed"] {
    color: var(--alarm-color-disarmed, var(--label-badge-green));
  }
  op-icon[data-domain="alarm_control_panel"][data-state="pending"],
  op-icon[data-domain="alarm_control_panel"][data-state="arming"] {
    color: var(--alarm-color-pending, var(--label-badge-yellow));
    animation: pulse 1s infinite;
  }
  op-icon[data-domain="alarm_control_panel"][data-state="triggered"] {
    color: var(--alarm-color-triggered, var(--label-badge-red));
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  op-icon[data-domain="plant"][data-state="problem"],
  op-icon[data-domain="zwave"][data-state="dead"] {
    color: var(--state-icon-error-color);
  }

  /* Color the icon if unavailable */
  op-icon[data-state="unavailable"] {
    color: var(--state-unavailable-color);
  }
`;
