import fs from "node:fs";
import { chromium } from "/Users/vishal/Desktop/Vishal Website/node_modules/playwright/index.mjs";
const S = process.argv[2];
const src = fs.readFileSync(S + "/canvas/project/Main.dc.html", "utf8");
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
const browser = await chromium.launch({ executablePath: '/Users/vishal/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage();
await page.setContent("<html><body></body></html>");
const results = await page.evaluate(async (code) => {
  const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${code}\nreturn Component;`)();
  const jobs = {
    gp_signature: [4.6, (c) => c.signature("gp")], gp_carpass: [3, (c) => c.carPass(c.vol.amb)], gp_prop: [1, (c) => c.propSound("gp")], gp_gear: [1, (c) => c.gearSound("gp", true)], gp_blip: [0.4, (c) => c.blip("gp")],
    run_signature: [3, (c) => c.signature("run")], run_steps: [3, (c) => { for (let i = 0; i < 8; i++) { const t = 0.05 + i * 0.353; c.footstep(t, i % 2 ? 1 : -1, c.vol.amb); if (i % 4 === 0) c.breath(t, true, c.vol.amb); if (i % 4 === 2) c.breath(t, false, c.vol.amb); } }], run_prop: [1, (c) => c.propSound("run")], run_gear: [1, (c) => c.gearSound("run", true)], run_blip: [0.3, (c) => c.blip("run")],
    ai_signature: [3.5, (c) => c.signature("ai")], ai_prop: [1.5, (c) => c.propSound("ai")], ai_gear: [1.5, (c) => c.gearSound("ai", false)], ai_blip: [1, (c) => c.blip("ai")],
    football_signature: [1, (c) => c.signature("football")], gaming_signature: [1, (c) => c.signature("gaming")],
  };
  const out = {};
  for (const [name, [secs, fn]] of Object.entries(jobs)) {
    const ac = new OfflineAudioContext(2, Math.ceil(44100 * secs), 44100);
    const c = new C({});
    c.audio = () => ac;
    c.master = ac.createGain();
    c.master.gain.value = c.vol.master;
    c.master.connect(ac.destination);
    c.now = () => 0.01;
    c.state.world = name.split("_")[0];
    fn(c);
    const buf = await ac.startRendering();
    let peak = 0, sum = 0, nan = 0;
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { const v = d[i]; if (!Number.isFinite(v)) nan++; else { peak = Math.max(peak, Math.abs(v)); sum += v * v; } } }
    out[name] = { peak: +peak.toFixed(3), rmsDb: +(10 * Math.log10(sum / (buf.length * 2) + 1e-12)).toFixed(1), nan };
  }
  return out;
}, js);
await browser.close();
for (const [k, v] of Object.entries(results)) console.log(k.padEnd(20), "peak", String(v.peak).padEnd(6), "rms", String(v.rmsDb).padEnd(6), "dB", v.nan ? "NaN!" : "");
