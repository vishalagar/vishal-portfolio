import fs from "node:fs";
const src = fs.readFileSync("project/Main.dc.html", "utf8");
const markup = src.slice(src.indexOf("<x-dc>"), src.indexOf("</x-dc>"));
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
globalThis.window = { matchMedia: () => ({ matches: true }), innerWidth: 390, innerHeight: 844 };
const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${js}\nreturn Component;`)();
// every {{hole}} with its loop scope
const loopVars = {};
for (const m of markup.matchAll(/<sc-for list="\{\{\s*([\w.]+)\s*\}\}" as="(\w+)"/g)) loopVars[m[2]] = m[1];
const holes = [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))].filter((h) => !h.startsWith("$") && !/^(true|false)$/.test(h));
const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const problems = new Set();
function check(v, label) {
  for (const h of holes) {
    const [root, ...rest] = h.split(".");
    if (loopVars[root]) {
      const list = get(v, loopVars[root]) ?? (loopVars[loopVars[root].split(".")[0]] ? null : undefined);
      if (list === undefined) { problems.add(`${label}: list ${loopVars[root]} missing`); continue; }
      if (!Array.isArray(list)) continue; // nested loop (e.g. line.players) checked via parent
      list.forEach((item) => { const x = rest.length ? get(item, rest.join(".")) : item; if (x === undefined) problems.add(`${label}: ${h}`); });
    } else if (get(v, h) === undefined) problems.add(`${label}: ${h}`);
  }
  const txt = JSON.stringify(v, (k, x) => (typeof x === "function" ? undefined : x));
  if (/NaN|undefined/.test(txt)) problems.add(`${label}: NaN/undefined in values`);
}
for (const world of ["football", "gp", "gaming", "run", "ai"]) {
  for (const [vw, vh] of [[1440, 900], [390, 844]]) {
    for (const playing of [null, "match"]) { for (const night of [true, false]) {
      const c = new C({});
      c.state = { ...c.state, world, playing, vw, vh, night };
      check(c.renderVals(), `${world} ${vw} ${playing} ${night}`); }
    }
  }
}
// day theme in football, wipe overlay, pad handling, world switching
const c = new C({});
c.state = { ...c.state, night: false, wipe: "ai" };
check(c.renderVals(), "football day + wipe");
const v = c.renderVals();
v.padKeyDown({ key: "ArrowLeft", preventDefault() {} }); v.padKeyDown({ key: " ", preventDefault() {} });
console.log("pad after keys:", JSON.stringify(c.state.pad));
v.padKeyUp({ key: " ", preventDefault() {} });
c.later = (fn) => fn(); c.state.wipe = null;
v.worldButtons[1].pick();
console.log("world after pick:", c.state.world, "| pad:", JSON.stringify(c.state.pad));
const v2 = c.renderVals();
console.log("gp samples:", v2.w.kicker, "|", v2.events.map((e) => e.min + " " + e.tag).join(", "), "|", v2.projects.map((p) => p.min).join(" "), "|", v2.motdMin, "|", v2.varText);
console.log("phone game height (gp, 390x844):", (() => { const k = new C({}); k.state = { ...k.state, world: "gp", playing: "match", vw: 390, vh: 844 }; return k.renderVals().gameH; })());
const real = [...problems].filter((p) => !/: p\.(n|name)$/.test(p)); console.log("problems (excluding the shared loop name p):", real.length ? real.slice(0, 15) : "none");
