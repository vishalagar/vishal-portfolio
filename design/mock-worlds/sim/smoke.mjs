// Smoke-test a .dc.html game: markup holes all resolve, no NaN/undefined in output, game finishes.
import fs from "node:fs";
const file = process.argv[2];
const mode = process.argv[3] || "attract";
const ticks = Number(process.argv[4] || 4000);
const src = fs.readFileSync(file, "utf8");
const markup = src.slice(src.indexOf("<x-dc>"), src.indexOf("</x-dc>"));
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${js}\nreturn Component;`)();
// holes used in markup, minus loop-scoped ones
const loops = [...markup.matchAll(/as="(\w+)"/g)].map((m) => m[1]);
const holes = [...new Set([...markup.matchAll(/\{\{\s*([\w.$]+)\s*\}\}/g)].map((m) => m[1]))]
  .filter((h) => !loops.includes(h.split(".")[0]) && !h.startsWith("$") && !/^(true|false)$/.test(h));
const props = { mode, pad: {}, playKey: 0, height: "360px", sound: false };
const c = new C(props);
let rnd = 1;
const rand = () => ((rnd = (rnd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const bad = new Set();
let overAt = -1;
const scan = (v, path) => {
  if (v === undefined) bad.add("undefined " + path);
  else if (typeof v === "number" && !Number.isFinite(v)) bad.add("NaN " + path);
  else if (typeof v === "string" && /NaN|undefined|Infinity/.test(v)) bad.add("bad string " + path + "=" + v);
  else if (Array.isArray(v)) v.forEach((x, i) => scan(x, path + "[]"));
  else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => typeof x !== "function" && scan(x, path + "." + k));
};
for (let i = 0; i < ticks; i++) {
  if (mode === "play") {
    // a mashing player: random directions, buttons pressed and released
    const p = {};
    for (const k of ["up", "down", "left", "right", "a", "b"]) p[k] = rand() < (k === "a" || k === "b" ? 0.45 : 0.25);
    c.props = { ...props, pad: p };
  }
  (c.tick ? c.tick() : (c.readPad(), c.step()));
  const v = c.renderVals();
  if (i === 0) holes.forEach((h) => { if (!(h.split(".")[0] in v)) bad.add("missing hole " + h); });
  if (i % 7 === 0) scan(v, "vals");
  if (v.over && overAt < 0) overAt = i;
}
const v = c.renderVals();
console.log(file.split("/").pop(), mode, "| problems:", bad.size ? [...bad].slice(0, 6) : "none", "| over at tick:", overAt, "| sample:", JSON.stringify(Object.fromEntries(Object.entries(v).filter(([k, x]) => typeof x === "number" || (typeof x === "string" && x.length < 30)))).slice(0, 260));
