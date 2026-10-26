import fs from "node:fs";
const src = fs.readFileSync("project/Main.dc.html", "utf8");
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
globalThis.window = { matchMedia: () => ({ matches: false }), innerWidth: 1440, innerHeight: 900 };
const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${js}\nreturn Component;`)();
for (const world of ["football", "gp", "gaming", "run", "ai"]) {
  const c = new C({}); c.state = { ...c.state, world }; let v = c.renderVals();
  const before = `${world.padEnd(8)} top: ${v.w.top} ${v.ps.min} ${v.ps.title} | game: ${v.feat.min} ${v.feat.title} -> ${v.feat.cta} | grid: ${v.projects.map((p) => p.kind).join(",")} | squad has PaceCoach: ${v.squad.includes("PaceCoach")}`;
  v.playMatch(); v = c.renderVals();
  console.log(before, `| play: ${c.state.playing} ${v.play.title} snake=${v.play.isSnake} cardMatch=${v.cardMatch}`);
}
