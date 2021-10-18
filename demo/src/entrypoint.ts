import "../../src/resources/op-style";
import "../../src/resources/roboto";
import "../../src/resources/safari-14-attachshadow-patch";
import "./op-demo";

/* polyfill for paper-dropdown */
setTimeout(() => {
  import("web-animations-js/web-animations-next-lite.min");
}, 1000);
