import fs from "node:fs";
const src = fs.readFileSync("project/Main.dc.html", "utf8");
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
globalThis.window = { matchMedia: () => ({ matches: false }), innerWidth: 1440, innerHeight: 900, scrollY: 0, addEventListener() {}, removeEventListener() {} };
let heroBottom = 900;
globalThis.document = { querySelector: () => ({ getBoundingClientRect: () => ({ bottom: heroBottom - window.scrollY }), }), activeElement: null };
const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${js}\nreturn Component;`)();
const c = new C({});
c.later = (fn) => fn();
let v = c.renderVals();
console.log("intro on:", v.introOn, "| tiles:", v.introTiles.map((t) => t.name + "/" + t.bg).join(", "), "|", v.introCount);
v.introTiles[1].pick();
console.log("after pick:", c.state.world, c.state.intro, c.state.wipeSub);
const frames = [];
for (const y of [0, 20, 60, 100, 150, 200, 250, 300, 400, 100, 0]) { window.scrollY = y; c.updateUnmask(); const r = c.renderVals(); frames.push(`${y}:${c.state.unmask}${r.stripOn ? "S" : ""}/${r.heroClass || "base"}/${r.boxLabel}`); }
console.log(frames.join("  "));
const c2 = new C({ intro: false }); console.log("intro prop false:", c2.renderVals().introOn);
const r = c.randomWorld(); console.log("random:", r);
