// pacer bot holds the target? and a human tapping too fast / too slow
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2], "utf8");
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
globalThis.window = {};
const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${js}\nreturn Component;`)();
function run(mode, tapEvery) {
  const c = new C({ mode, pad: {} });
  let g = c.state.g, foot = false, n = 0;
  while (g.phase !== "over" && n < 5000) {
    let inp;
    if (mode === "attract") inp = c.input(g);
    else { const tap = n % tapEvery === 0; if (tap) foot = !foot; inp = { step: tap ? (foot ? "L" : "R") : null, lane: 0, again: false }; }
    g = c.step(g, inp); n++;
  }
  c.state.g = g; const v = c.renderVals();
  return `${mode}${tapEvery ? " tap/" + tapEvery : ""}: ${g.onTarget}/${g.judged} on pace, ${v.finishTime}, ${(n * 33 / 1000).toFixed(0)} s of play | ${v.verdict}`;
}
console.log(run("attract"));
for (const k of [4, 5, 6, 7]) console.log(run("play", k));
const c = new C({ mode: "attract" }); const v = c.renderVals();
const bad = Object.entries(v).filter(([k, x]) => x === undefined || (typeof x === "number" && Number.isNaN(x)));
console.log("undefined/NaN render values:", bad.length ? bad : "none");
