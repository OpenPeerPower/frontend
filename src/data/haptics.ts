/**
 * Broadcast haptic feedback requests
 */

import { fireEvent, OPPDomEvent } from "../common/dom/fire_event";

// Allowed types are from iOS HIG.
// https://developer.apple.com/design/human-interface-guidelines/ios/user-interaction/feedback/#haptics
// Implementors on platforms other than iOS should attempt to match the patterns (shown in HIG) as closely as possible.
export type HapticType =
  | "success"
  | "warning"
  | "failure"
  | "light"
  | "medium"
  | "heavy"
  | "selection";

declare global {
  // for fire event
  interface OPPDomEvents {
    haptic: HapticType;
  }

  interface GlobalEventHandlersEventMap {
    haptic: OPPDomEvent<HapticType>;
  }
}

export const forwardHaptic = (hapticType: HapticType) => {
  fireEvent(window, "haptic", hapticType);
};
