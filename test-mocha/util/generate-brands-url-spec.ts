import * as assert from "assert";
import { brandsUrl } from "../../src/util/brands-url";

describe("Generate brands Url", function () {
  it("Generate logo brands url for cloud component without fallback", function () {
    assert.strictEqual(
      // @ts-ignore
      brandsUrl("cloud", "logo"),
      "https://brands.openpeerpower.io/cloud/logo.png"
    );
  });
  it("Generate icon brands url for cloud component without fallback", function () {
    assert.strictEqual(
      // @ts-ignore
      brandsUrl("cloud", "icon"),
      "https://brands.openpeerpower.io/cloud/icon.png"
    );
  });
  it("Generate logo brands url for cloud component with fallback", function () {
    assert.strictEqual(
      // @ts-ignore
      brandsUrl("cloud", "logo", true),
      "https://brands.openpeerpower.io/_/cloud/logo.png"
    );
  });
  it("Generate icon brands url for cloud component with fallback", function () {
    assert.strictEqual(
      // @ts-ignore
      brandsUrl("cloud", "icon", true),
      "https://brands.openpeerpower.io/_/cloud/icon.png"
    );
  });
});
