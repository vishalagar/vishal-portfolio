import fs from "node:fs";
const src = fs.readFileSync("project/Main.dc.html", "utf8");
const js = src.slice(src.indexOf("class Component"), src.lastIndexOf("</script>"));
const param = () => new Proxy({ value: 0 }, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { if (Number.isNaN(v)) throw new Error("NaN param " + String(k)); o[k] = v; return true; } });
const checkArgs = (name, args) => args.forEach((a) => { if (typeof a === "number" && !Number.isFinite(a)) throw new Error(name + " got " + a); });
function node() {
  const n = {};
  return new Proxy(n, {
    get(o, k) {
      if (k in o) return o[k];
      if (["frequency", "gain", "Q", "detune", "pan", "delayTime", "threshold", "ratio"].includes(k)) { o[k] = new Proxy({ value: 0 }, { get: (p, kk) => (kk === "value" ? p.value : (...a) => { checkArgs(String(kk), a); if (String(kk).startsWith("exponential") && a[0] <= 0) throw new Error("exp ramp to " + a[0]); }), set: (p, kk, v) => { if (!Number.isFinite(v)) throw new Error("bad " + v); p[kk] = v; return true; } }); return o[k]; }
      if (k === "connect") return (x) => x;
      return (...a) => { checkArgs(String(k), a); };
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}
let created = 0;
class FakeAC {
  constructor() { this.sampleRate = 8000; this.currentTime = 1; this.state = "running"; this.destination = node(); }
  createBuffer(ch, len) { const d = Array.from({ length: ch }, () => new Float32Array(len)); return { getChannelData: (i) => d[i], length: len }; }
  resume() {}
}
for (const m of ["createOscillator", "createGain", "createBiquadFilter", "createBufferSource", "createConvolver", "createDelay", "createDynamicsCompressor", "createWaveShaper", "createStereoPanner"]) FakeAC.prototype[m] = function () { created++; return node(); };
const timers = [];
globalThis.setInterval = (fn) => { timers.push(fn); return timers.length; };
globalThis.setTimeout = (fn) => { timers.push(fn); return timers.length; };
globalThis.clearInterval = () => {}; globalThis.clearTimeout = () => {};
globalThis.window = { AudioContext: FakeAC, matchMedia: () => ({ matches: false }), innerWidth: 1440, innerHeight: 900 };
const C = new Function(`class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,typeof s==='function'?s(this.state):s)}}\n${js}\nreturn Component;`)();
const c = new C({});
for (const w of ["football", "gp", "gaming", "run", "ai"]) {
  c.state.world = w;
  c.signature(w); c.blip(w); c.propSound(w); c.gearSound(w, true); c.gearSound(w, false);
  c.startAmbient(w);
  for (let i = 0; i < 30; i++) timers.splice(0).forEach((f) => f());
  c.stopAmbient();
}
console.log("sound functions ok across worlds; nodes created:", created);
