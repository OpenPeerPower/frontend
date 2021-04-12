import { dedupingMixin } from "@polymer/polymer/lib/utils/mixin";
/**
 * Polymer Mixin to enable a localize function powered by language/resources from opp object.
 *
 * @polymerMixin
 */
export default dedupingMixin(
  (superClass) =>
    class extends superClass {
      static get properties() {
        return {
          opp: Object,

          /**
           * Translates a string to the current `language`. Any parameters to the
           * string should be passed in order, as follows:
           * `localize(stringKey, param1Name, param1Value, param2Name, param2Value)`
           */
          localize: {
            type: Function,
            computed: "__computeLocalize(opp.localize)",
          },
        };
      }

      __computeLocalize(localize) {
        return localize;
      }
    }
);
