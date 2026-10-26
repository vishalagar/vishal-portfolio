import fs from "node:fs";
const src = fs.readFileSync("project/Main.dc.html", "utf8");
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
globalThis.window = { matchMedia: () => ({ matches: false }), innerWidth: 1440, innerHeight: 900 };
const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${js}\nreturn Component;`)();
const L = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)).toFixed(1); };
for (const world of ["football", "gp", "gaming", "run", "ai"]) for (const night of [true, false]) {
  const c = new C({}); c.state = { ...c.state, world, night }; const v = c.renderVals();
  console.log(world.padEnd(8), night ? "night" : "day  ", "ink/bg", cr(v.c.ink, v.c.bg), "muted/bg", cr(v.c.muted, v.c.bg), "accentText/bg", cr(v.accentText, v.c.bg), "onAccent/accent", cr(v.onAccent, v.accent), "|", v.themeText);
}
