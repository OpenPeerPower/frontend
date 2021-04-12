import { assert } from "chai";

import { canToggleDomain } from "../../../src/common/entity/can_toggle_domain";

describe("canToggleDomain", () => {
  const opp: any = {
    services: {
      light: {
        turn_on: null, // Service keys only need to be present for test
        turn_off: null,
      },
      lock: {
        lock: null,
        unlock: null,
      },
      sensor: {
        custom_service: null,
      },
    },
  };

  it("Detects lights toggle", () => {
    assert.isTrue(canToggleDomain(opp, "light"));
  });

  it("Detects locks toggle", () => {
    assert.isTrue(canToggleDomain(opp, "lock"));
  });

  it("Detects sensors do not toggle", () => {
    assert.isFalse(canToggleDomain(opp, "sensor"));
  });

  it("Detects binary sensors do not toggle", () => {
    assert.isFalse(canToggleDomain(opp, "binary_sensor"));
  });
});
