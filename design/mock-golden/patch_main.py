"""Adds the Golden Hour world (world 6) to the worlds mock's Main.dc.html. Each anchor must match exactly once."""
import sys
from pathlib import Path

path = Path(sys.argv[1])
s = path.read_text()


def sub(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f"anchor found {n}x (want {count}): {old[:90]!r}")
    s = s.replace(old, new)


B = {
    "sheet": "/_blob/dadfd188134f3a0104aa1d76a481896f",
    "strip": "/_blob/1d67a170c7ee0b7218160006a22e4f6f",
    "cookie": "/_blob/65c09c4f3e44036a3103c51a1abe7cd9",
    "side": "/_blob/8f14b803ac74ce3d3246c1750b371ddb",
}
PHOTOS = [
    ("dupatta", "Dupatta day", "/_blob/227787a91c604acc0c61eaf94567d34b"),
    ("medals", "Wears his medals", "/_blob/703918ea8ac68b5a33a0ca4f5c435350"),
    ("boop", "Boop range", "/_blob/55c29eb9c34b740cd158d9ce9c7de8c8"),
    ("sky", "Golden hour", "/_blob/619f723f017e25b192d8ac35ab3f100c"),
    ("zoomies", "Post-zoomies", "/_blob/e58cf8aba91822ef2bc62d87c56bac09"),
    ("lamp", "Lamp light", "/_blob/9673c0e8a4874f9973f76d4625355671"),
    ("sit", "Sit. Good.", "/_blob/d91db03ed90d60e5e12351b868f0cb71"),
    ("look", "Sky watch", "/_blob/f9c52a50df7d8f15b6f3f55f422fd291"),
]

# ---------- helmet: fonts + sprite classes ----------
sub("&amp;family=Share+Tech+Mono&amp;display=swap", "&amp;family=Share+Tech+Mono&amp;family=Lilita+One&amp;family=Pixelify+Sans:wght@400;600;700&amp;display=swap")
sub(".va-strip-ai{background-image:url(/_blob/d909d804cc370e87f36bba08db205747)}\n",
    ".va-strip-ai{background-image:url(/_blob/d909d804cc370e87f36bba08db205747)}\n"
    f".va-me.va-w-golden{{background-image:url({B['sheet']})}}\n"
    f".va-strip-golden{{background-image:url({B['strip']})}}\n"
    f".va-cookie{{position:absolute;inset:0;background-image:url({B['cookie']});background-size:200% 100%;background-repeat:no-repeat;image-rendering:pixelated;animation:va-ckblink 5.3s steps(1) infinite}}\n"
    "@keyframes va-ckblink{0%{background-position:0 0}46%{background-position:100% 0}49%{background-position:0 0}}\n"
    f".va-buddy{{background-image:url({B['side']});background-size:300% 100%;background-position:100% 0;background-repeat:no-repeat;image-rendering:pixelated}}\n"
    "@keyframes va-heart{to{transform:translateY(-60px);opacity:0}}\n"
    "@keyframes va-tagsway{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}\n"
    ".va-polaroid{transition:transform .15s ease}\n.va-polaroid:hover,.va-polaroid:focus-visible{transform:translate(-2px,-2px) rotate(0deg) !important}\n")

# ---------- start screen ----------
sub("Same story, five ways to watch it.", "Same story, six ways to watch it.")
sub("""<span class="va-me va-me-lids {{wt.cls}}" style="animation-delay: {{wt.delay}}"></span>
</span>
""", """<span class="va-me va-me-lids {{wt.cls}}" style="animation-delay: {{wt.delay}}"></span>
</span>
<sc-if value="{{wt.dog}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; left: calc(50% + 30px); bottom: 0; width: 62px; height: 72px"><span class="va-cookie"></span></span>
</sc-if>
""")

# ---------- hero ----------
sub("""<div style="position: absolute; left: 14px; top: 12px; font-family: {{f.label}}; font-size: 12px; color: #eef3ea; background: #08130e; padding: 4px 8px">{{w.cam}}</div>""",
    """<sc-if value="{{isGolden}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: absolute; left: 68%; top: 30%; width: 84px; height: 84px; border-radius: 50%; background: {{goldenSun}}; box-shadow: 0 0 0 10px {{goldenSunRing}}"></div>
<div aria-hidden="true" style="position: absolute; left: 4%; top: 22%; width: 120px; height: 110px; border-radius: 50%; background: {{goldenTree}}"></div>
<div aria-hidden="true" style="position: absolute; left: 2%; top: 46%; width: 10px; height: 60px; background: {{goldenTree}}"></div>
<div aria-hidden="true" style="position: absolute; left: 20%; top: 30%; width: 90px; height: 84px; border-radius: 50%; background: {{goldenTree}}; opacity: .85"></div>
<div aria-hidden="true" style="position: absolute; right: 7%; top: 18%; width: 6px; height: 40%; background: {{goldenTree}}"></div>
<div aria-hidden="true" style="position: absolute; right: calc(7% - 12px); top: 17%; width: 30px; height: 8px; background: {{goldenLamp}}; border: 2px solid {{goldenTree}}"></div>
<div aria-hidden="true" style="position: absolute; left: 6%; top: 66%; width: 110px; height: 6px; background: {{goldenTree}}; box-shadow: 0 10px 0 {{goldenTree}}"></div>
</sc-if>
<div style="position: absolute; left: 14px; top: 12px; font-family: {{f.label}}; font-size: 12px; color: #eef3ea; background: #08130e; padding: 4px 8px">{{w.cam}}</div>""")
sub("""<div style="position: absolute; left: 50%; bottom: 0; width: 288px; height: 336px; margin-left: -144px; animation: va-bob .9s steps(1) infinite">""",
    """<div style="position: absolute; left: 50%; bottom: 0; width: 288px; height: 336px; margin-left: {{heroShift}}; animation: va-bob .9s steps(1) infinite">""")
sub("""<sc-if value="{{offHintOn}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: absolute; right: 14px; top: 12px;""",
    """<sc-if value="{{isGolden}}" hint-placeholder-val="{{ false }}">
<div role="img" aria-label="Pixel-art Cookie, Vishal's golden dog, with a red tilak on her forehead. She blinks." style="position: absolute; left: calc(50% + 40px); bottom: 0; width: 168px; height: 196px; animation: va-bob 1.3s steps(1) infinite"><div class="va-cookie"></div></div>
</sc-if>
<sc-if value="{{offHintOn}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: absolute; right: 14px; top: 12px;""")
sub("""aria-label="{{prop.label}}" style="position: absolute; left: calc(50% + 168px); bottom: 22px;""",
    """aria-label="{{prop.label}}" style="position: absolute; left: {{propLeft}}; bottom: 22px; z-index: 2;""")
sub("""<div aria-hidden="true" style="position: absolute; left: calc(50% - 150px); bottom: 0; width: 296px; height: 352px; border: 2px solid {{accent}}; pointer-events: none">""",
    """<sc-if value="{{isGolden}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: absolute; left: calc(50% + 46px); bottom: 0; width: 160px; height: 176px; border: 2px solid {{accent}}; pointer-events: none">
<span style="position: absolute; left: -2px; top: -26px; background: {{accent}}; color: {{onAccent}}; font-family: {{f.label}}; font-size: 12px; padding: 3px 8px; white-space: nowrap">good_girl 0.99</span>
</div>
</sc-if>
<div aria-hidden="true" style="position: absolute; left: {{boxLeft}}; bottom: 0; width: 296px; height: 352px; border: 2px solid {{accent}}; pointer-events: none">""")
sub("""class="va-press" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; background: {{c.surface}}; color: {{c.ink}}; border: 2px solid {{c.ink}}; box-shadow: 5px 5px 0 {{c.shadow}}; text-decoration: none; font-family: {{f.display}}; font-weight: 800; font-size: 20px; text-transform: uppercase">Ask the {{w.pundit}}</a>""",
    """class="va-press" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; background: {{c.surface}}; color: {{c.ink}}; border: 2px solid {{c.ink}}; box-shadow: 5px 5px 0 {{c.shadow}}; text-decoration: none; font-family: {{f.display}}; font-weight: 800; font-size: 20px; text-transform: uppercase">{{askTitle}}</a>""")

# ---------- line-up: the leash ----------
sub("""<sc-if value="{{isAi}}" hint-placeholder-val="{{ false }}">
<div style="position: relative; height: 400px">""",
    """<sc-if value="{{isGolden}}" hint-placeholder-val="{{ false }}">
<div style="position: relative; padding-top: 40px">
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 10px; height: 8px; background: repeating-linear-gradient(90deg, #ff8a2a 0px, #ff8a2a 14px, #c4621a 14px, #c4621a 18px); border: 2px solid #1a1209"></div>
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 34px 16px">
<sc-for list="{{pack}}" as="pk" hint-placeholder-count="11">
<div style="position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px 10px 12px; background: {{pk.bg}}; color: {{pk.ink}}; border: 2px solid #1a1209; border-radius: 40px 40px 10px 10px; box-shadow: 4px 4px 0 #1a1209; text-align: center; transform-origin: 50% -30px; animation: va-tagsway {{pk.dur}} ease-in-out infinite alternate">
<span aria-hidden="true" style="position: absolute; left: calc(50% - 1px); top: -32px; width: 2px; height: 32px; background: #1a1209"></span>
<span aria-hidden="true" style="position: absolute; left: calc(50% - 6px); top: 6px; width: 8px; height: 8px; border: 2px solid #1a1209; border-radius: 50%"></span>
<span style="font-family: {{f.label}}; font-size: 11px; letter-spacing: .05em; text-transform: uppercase">{{pk.role}}</span>
<span style="font-family: {{f.display}}; font-size: 24px; line-height: 1">{{pk.name}}</span>
</div>
</sc-for>
</div>
</div>
</sc-if>

<sc-if value="{{isAi}}" hint-placeholder-val="{{ false }}">
<div style="position: relative; height: 400px">""")

# ---------- highlights card + play overlay ----------
sub("""<sc-if value="{{isAi}}" hint-placeholder-val="{{ false }}"><dc-import name="LabelRushGame" mode="attract" height="360px" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>""",
    """<sc-if value="{{isAi}}" hint-placeholder-val="{{ false }}"><dc-import name="LabelRushGame" mode="attract" height="360px" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>
<sc-if value="{{isGolden}}" hint-placeholder-val="{{ false }}"><dc-import name="StreetRescueGame" mode="attract" height="360px" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>""")
label = """<sc-if value="{{play.isLabel}}" hint-placeholder-val="{{ false }}"><dc-import name="LabelRushGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>"""
sub(label, label + """
<sc-if value="{{play.isRescue}}" hint-placeholder-val="{{ false }}"><dc-import name="StreetRescueGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>""", count=2)

# ---------- off the leash: NGO, dog park, Cookie's album ----------
sub("""<h2 class="va-reveal" id="off-title" style="margin: 4px 0 28px; font-family: {{f.display}}; font-weight: 800; font-size: calc(56px * {{f.scale}}); line-height: 1; text-transform: uppercase">{{w.s4.title}}</h2>""",
    """<h2 class="va-reveal" id="off-title" style="margin: 4px 0 28px; font-family: {{f.display}}; font-weight: 800; font-size: calc(56px * {{f.scale}}); line-height: 1; text-transform: uppercase">{{w.s4.title}}</h2>
<sc-if value="{{isGolden}}" hint-placeholder-val="{{ false }}">
<div style="display: flex; flex-wrap: wrap; gap: 28px; margin-bottom: 32px">
<div style="flex: 1 1 360px; min-width: 0; border: 2px solid {{c.line}}; background: {{c.surface}}; box-shadow: 8px 8px 0 {{c.shadow}}; padding: 24px; display: flex; flex-direction: column; gap: 10px">
<div style="font-family: {{f.label}}; font-size: 11px; color: {{onAccent}}; background: {{accent}}; align-self: flex-start; padding: 3px 8px">Volunteer</div>
<div style="font-family: {{f.display}}; font-size: 40px; line-height: 1; text-transform: uppercase">Dog-rescue NGO</div>
<p style="margin: 0">Vishal volunteers with [NGO name] in [city]: [what he does there, e.g. rescues, feeding, adoption drives], since [year].</p>
<p style="margin: 0; color: {{c.muted}}; font-size: 15px">Street Rescue, this world's game, is that work turned into ninety seconds of pixel art.</p>
</div>
<div style="flex: 1 1 360px; min-width: 0; border: 2px solid {{c.line}}; background: {{c.surface}}; box-shadow: 8px 8px 0 {{c.shadow}}; padding: 24px; display: flex; flex-direction: column; gap: 10px">
<div style="font-family: {{f.label}}; font-size: 11px; color: {{onAccent}}; background: {{accent}}; align-self: flex-start; padding: 3px 8px">Weekends</div>
<div style="font-family: {{f.display}}; font-size: 40px; line-height: 1; text-transform: uppercase">The dog park</div>
<p style="margin: 0">Meetups at [park or community name], where Cookie runs the zoomies and Vishal helps out as a volunteer.</p>
<p style="margin: 0; color: {{c.muted}}; font-size: 15px">Cookie walks this page with you: she follows your pointer along the bottom edge, fetches the ball from the hero and takes boops.</p>
</div>
</div>
<div style="font-family: {{f.label}}; font-size: 13px; color: {{c.muted}}; margin-bottom: 14px">Cookie's album · hover or tap a photo to unpixel it</div>
<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: 20px; margin-bottom: 40px">
<sc-for list="{{album}}" as="ph" hint-placeholder-count="8">
<button type="button" class="va-polaroid" onPointerEnter="{{ph.on}}" onPointerLeave="{{ph.off}}" onFocus="{{ph.on}}" onBlur="{{ph.off}}" onClick="{{ph.toggle}}" aria-label="{{ph.label}}" style="display: flex; flex-direction: column; gap: 8px; padding: 8px 8px 10px; background: #fffaf0; color: #24180a; border: 2px solid #24180a; box-shadow: 4px 4px 0 {{c.shadow}}; transform: rotate({{ph.tilt}}); cursor: pointer; text-align: left; font: inherit">
<canvas ref="{{ph.ref}}" width="360" height="360" style="display: block; width: 100%; height: auto; aspect-ratio: 1; background: #e7d6b4; image-rendering: pixelated"></canvas>
<span style="font-family: 'Pixelify Sans', monospace; font-size: 14px">{{ph.cap}}</span>
</button>
</sc-for>
</div>
</sc-if>""")

# ---------- pundit labels ----------
sub(""">Ask the {{w.pundit}}</h2>""", """>{{askTitle}}</h2>""")
sub(""">The {{w.pundit}}</div>""", """>{{punditName}}</div>""")

# ---------- Cookie companion (fixed, bottom edge) ----------
sub("""<span style="font-family: {{f.label}}; font-size: 11px">psst — type VAR anywhere</span>
</div>
</footer>
</div>""", """<span style="font-family: {{f.label}}; font-size: 11px">psst — type VAR anywhere</span>
</div>
</footer>
<sc-if value="{{isGolden}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: fixed; left: 0; right: 0; bottom: 0; height: 6px; z-index: 39; pointer-events: none; background: repeating-linear-gradient(90deg, {{accent}} 0px, {{accent}} 10px, transparent 10px, transparent 20px); opacity: .55"></div>
<button type="button" ref="{{buddyRef}}" onClick="{{buddyBoop}}" aria-label="Boop Cookie" style="position: fixed; left: 0; bottom: 6px; z-index: 40; width: 96px; height: 64px; padding: 0; border: 0; background: transparent; cursor: pointer">
<span ref="{{buddyImgRef}}" class="va-buddy" style="position: absolute; inset: 0"></span>
<sc-if value="{{buddySayOn}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; bottom: 62px; left: 50%; transform: translateX(-50%); font-family: 'Pixelify Sans', monospace; font-weight: 700; font-size: 12px; background: {{c.surface}}; color: {{c.ink}}; border: 2px solid {{c.ink}}; padding: 2px 6px; white-space: nowrap">{{buddySay}}</span>
</sc-if>
</button>
<span ref="{{fetchRef}}" aria-hidden="true" style="position: fixed; left: 0; top: 0; z-index: 41; width: 14px; height: 14px; border-radius: 50%; background: #d8f03a; border: 2px solid #2d3306; opacity: 0; pointer-events: none"></span>
<sc-for list="{{hearts}}" as="h" hint-placeholder-count="0">
<span aria-hidden="true" style="position: fixed; left: {{h.x}}; top: {{h.y}}; z-index: 42; color: #ff5a3c; font-size: 22px; font-weight: 700; pointer-events: none; animation: va-heart 1s ease-out forwards; animation-delay: {{h.d}}">♥</span>
</sc-for>
</sc-if>
</div>""")

# ---------- logic: lifecycle ----------
sub("""    this.onScroll = () => this.updateUnmask();""",
    """    this.onScroll = () => { this.updateUnmask(); this.buddyScroll(); };
    this.startBuddy();""")
sub("""    window.removeEventListener('scroll', this.onScroll);
    clearInterval(this.introTimer);""",
    """    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('pointermove', this.onBuddyPtr);
    cancelAnimationFrame(this.buddyRaf);
    clearInterval(this.introTimer);""")

# ---------- logic: sounds ----------
sub("""    else if (wid === 'ai') this.pluck(t, 1318.5, 0.22, { type: 'triangle', vol: 0.12, echo: 0.35, verb: 0.2 });
    else this.tone('square', 660, 990, 0.07, 0.04, 0);""",
    """    else if (wid === 'ai') this.pluck(t, 1318.5, 0.22, { type: 'triangle', vol: 0.12, echo: 0.35, verb: 0.2 });
    else if (wid === 'golden') this.squeak(0);
    else this.tone('square', 660, 990, 0.07, 0.04, 0);
  }
  // squeaky toy and a short two-part woof for the Golden Hour world
  squeak(delay) {
    this.tone('sine', 700, 1500, 0.1, 0.07, delay);
    this.tone('sine', 1500, 900, 0.08, 0.05, (delay || 0) + 0.1);
  }
  woof(delay) {
    this.tone('sawtooth', 320, 170, 0.1, 0.1, delay);
    this.noise(0.09, { type: 'bandpass', f0: 900, vol: 0.12, delay });
    this.tone('sawtooth', 260, 150, 0.12, 0.08, (delay || 0) + 0.13);""")
sub("""    } else if (wid === 'ai') {
      // boot: a wide chord opening up""",
    """    } else if (wid === 'golden') {
      // a whistle from across the park, then Cookie answers
      this.tone('sine', 1800, 2600, 0.25, 0.05, 0);
      this.tone('sine', 1900, 1500, 0.3, 0.05, 0.3);
      this.woof(0.75);
      this.woof(1.15);
    } else if (wid === 'ai') {
      // boot: a wide chord opening up""")
sub("""    } else if (wid === 'ai') {
      this.bell(t, 1046.5, 0.9, 0.15);
    } else {""", """    } else if (wid === 'ai') {
      this.bell(t, 1046.5, 0.9, 0.15);
    } else if (wid === 'golden') {
      this.squeak(0);
      this.pluck(t + 0.05, 140, 0.15, { f1: 60, vol: 0.2 });
    } else {""")
sub("""    } else if (world === 'ai') {
      const lp = ac.createBiquadFilter();""", """    } else if (world === 'golden') {
      // park at golden hour: a soft breeze and birds now and then
      nodes.push(...(this.bed(900, 0.5, 0.012 * this.vol.amb, 0.08, 0.006 * this.vol.amb) || []));
      randomly(1800, 4200, () => {
        const t = this.now();
        const f = 2800 + Math.random() * 1200;
        [0, 0.08, 0.16].slice(0, 2 + Math.floor(Math.random() * 2)).forEach((d) => this.pluck(t + d, f, 0.05, { f1: f * 1.3, vol: 0.02 * this.vol.amb, verb: 0.3 }));
      });
    } else if (world === 'ai') {
      const lp = ac.createBiquadFilter();""")

# ---------- logic: Cookie companion ----------
sub("""  randomWorld() {""", """  // Cookie walks the bottom edge in the Golden Hour world: follows the pointer, fetches, sits when you stop
  startBuddy() {
    this.B = { x: 40, target: 40, dir: 1, frame: 0, ft: 0, carrying: false, last: performance.now() };
    this.onBuddyPtr = (e) => {
      if (e.pointerType !== 'mouse' || this.fetch || this.state.world !== 'golden') return;
      if (e.clientY > window.innerHeight * 0.55) this.B.target = Math.max(8, Math.min(window.innerWidth - 104, e.clientX - 48));
    };
    window.addEventListener('pointermove', this.onBuddyPtr, { passive: true });
    this.lastScrollY = window.scrollY;
    const loop = (now) => { this.buddyRaf = requestAnimationFrame(loop); this.buddyStep(now); };
    this.buddyRaf = requestAnimationFrame(loop);
  }
  buddyScroll() {
    const d = window.scrollY - this.lastScrollY;
    this.lastScrollY = window.scrollY;
    if (!this.B || this.fetch || Math.abs(d) < 30) return;
    this.B.target = Math.max(8, Math.min(window.innerWidth - 104, this.B.x + Math.sign(d) * 120));
  }
  buddyStep(now) {
    const B = this.B;
    const dt = Math.min(0.05, (now - B.last) / 1000);
    B.last = now;
    if (!this.buddyEl || this.state.world !== 'golden') return;
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const f = this.fetch;
    if (f && f.phase === 'fly') {
      const p = Math.min(1, (now - f.t0) / (calm ? 1 : 900));
      const x = f.x0 + (f.x1 - f.x0) * p;
      const y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 160;
      if (this.fetchEl) { this.fetchEl.style.opacity = '1'; this.fetchEl.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }
      if (p >= 1) { f.phase = 'chase'; B.target = f.x1 - 36; this.say('!!'); }
    }
    const dx = B.target - B.x;
    const speed = f || B.carrying ? 260 : 120;
    let walking = false;
    if (Math.abs(dx) > 2) {
      walking = true;
      B.dir = Math.sign(dx);
      B.x = calm ? B.target : B.x + B.dir * Math.min(Math.abs(dx), speed * dt);
      B.ft += dt;
      if (B.ft > 0.14) { B.ft = 0; B.frame = 1 - B.frame; }
    } else if (f && f.phase === 'chase') {
      this.fetch = null;
      B.carrying = true;
      B.target = 40;
      if (this.fetchEl) this.fetchEl.style.opacity = '0';
      this.say('got it!');
      if (this.state.sound) this.squeak(0);
    } else if (B.carrying) {
      B.carrying = false;
      const r = this.buddyEl.getBoundingClientRect();
      this.hearts(r.left + r.width / 2, r.top, 2);
      this.say('again?');
    }
    this.buddyEl.style.transform = 'translateX(' + Math.round(B.x) + 'px)';
    if (this.buddyImgEl) {
      this.buddyImgEl.style.backgroundPosition = walking ? (B.frame ? '50% 0' : '0% 0') : '100% 0';
      this.buddyImgEl.style.transform = B.dir < 0 ? 'scaleX(-1)' : 'none';
      this.buddyImgEl.style.boxShadow = B.carrying ? 'none' : 'none';
    }
  }
  say(text) {
    this.setState({ buddySay: text });
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => this.setState({ buddySay: '' }), 1200);
    this.timers.push(this.sayTimer);
  }
  hearts(x, y, n) {
    const id = Date.now();
    const list = Array.from({ length: n }, (_, i) => ({ id: id + i, x: Math.round(x - 8 + (i - (n - 1) / 2) * 18) + 'px', y: Math.round(y - i * 6) + 'px', d: (i * 0.08).toFixed(2) + 's' }));
    this.setState({ hearts: (this.state.hearts || []).concat(list) });
    this.later(() => this.setState({ hearts: (this.state.hearts || []).filter((h) => h.id < id || h.id >= id + n) }), 1300);
  }
  throwBall(el) {
    if (this.fetch || !this.B) return;
    const r = el.getBoundingClientRect();
    this.fetch = { phase: 'fly', t0: performance.now(), x0: r.left + r.width / 2, y0: r.top, x1: 40 + Math.random() * (window.innerWidth - 120), y1: window.innerHeight - 26 };
  }
  // Cookie's album: each photo starts as a mosaic and sharpens on hover or tap
  photoRef(key, src) {
    return (el) => {
      if (!el) return;
      this.ph = this.ph || {};
      if (this.ph[key] && this.ph[key].el === el) return;
      const img = new Image();
      const p = { el, img, res: 18, goal: 18, raf: 0 };
      this.ph[key] = p;
      img.onload = () => this.photoPaint(p);
      img.src = src;
    };
  }
  photoPaint(p) {
    const n = Math.round(p.res);
    const tmp = this.phTmp || (this.phTmp = document.createElement('canvas'));
    tmp.width = n; tmp.height = n;
    tmp.getContext('2d').drawImage(p.img, 0, 0, n, n);
    const g = p.el.getContext('2d');
    g.imageSmoothingEnabled = n >= 300;
    g.clearRect(0, 0, 360, 360);
    g.drawImage(tmp, 0, 0, 360, 360);
  }
  photoGo(key, goal) {
    const p = this.ph && this.ph[key];
    if (!p || !p.img.complete) return;
    p.goal = goal === 'toggle' ? (p.goal === 360 ? 18 : 360) : goal;
    if (p.raf) return;
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = () => {
      p.res += (p.goal - p.res) * (calm ? 1 : 0.18);
      if (Math.abs(p.goal - p.res) < 1) p.res = p.goal;
      this.photoPaint(p);
      p.raf = p.res !== p.goal ? requestAnimationFrame(step) : 0;
    };
    p.raf = requestAnimationFrame(step);
  }
  randomWorld() {""")

# ---------- logic: world definition ----------
sub("""          shell: { body: '#ebe6f8', bezel: '#140c26', bezelInk: '#b2a8dc', ink: '#140c26', btn: '#2de2e6', btnInk: '#140c26', dpad: '#2a1a55', pill: '#ff2a6d', grille: '#b2a8dc' } }
      }
    };""", """          shell: { body: '#ebe6f8', bezel: '#140c26', bezelInk: '#b2a8dc', ink: '#140c26', btn: '#2de2e6', btnInk: '#140c26', dpad: '#2a1a55', pill: '#ff2a6d', grille: '#b2a8dc' } }
      },
      golden: {
        name: 'Golden Hour', swatch: '#f2b632', gear: 'ears',
        f: { display: "'Lilita One', sans-serif", label: "'Pixelify Sans', monospace", scale: 0.95 },
        c: { bg: '#1a1209', surface: '#251a0e', surface2: '#31230f', line: '#6b5130', ink: '#fbf0dc', muted: '#cdb894', pitchA: '#2a3a1c', pitchB: '#304220', chalk: '#f3cf8a', shadow: '#b97a2f', blue: '#8fc3e0', red: '#ff7a52', green: '#8cc274' },
        accent: '#f2b632', onAccent: '#1f1406', accentText: '#f5c04a', live: ['#ff5a3c', '#ffffff'],
        sb: { live: 'Live', home: 'VA & Cookie', score: 'Off leash', away: 'Dog park' },
        kicker: 'Golden hour · Live from the dog park', cam: 'Cam 2 · Park gate', cta1: 'Watch the walk', pundit: 'Cookie', talk: 'Walkies chat',
        boxLabel: 'volunteer 0.97', varWord: 'Sniff test', check: 'Sniff test passed', full: 'Home time · treats all round',
        s1: { kicker: '01 · The pack', title: 'The pack', sub: '11 on one lead', bench: 'In the kennel' },
        s2: { kicker: '02 · Walkies · in dog years', title: 'Walkies so far' },
        s3: { kicker: '03 · Highlights', title: 'Good boys & rescues' },
        s4: { kicker: '04 · Off the leash', title: 'Off the leash' },
        s5: { kicker: '05 · The park bench' },
        tags: { 'Kick-off': 'First walk', 'Sub on': 'New friend', Goal: 'Good boy', Promoted: 'Top dog' }, theme: ['Dusk walk', 'Golden hour'],
        top: 'Best in show', game: { kicker: 'Walk of the day', start: 'Start patrol', blurb: 'Rowdies are after the street dogs. Get between them and Shoo (A), let Cookie bark (B) to freeze a crowd, and lead two dogs at a time to the NGO van. Ninety seconds; three scared-off dogs ends the round.' },
        prop: { a: '#d8f03a', b: '#8fa312', c: '#ffffff', label: 'Throw the ball for Cookie', hint: 'tap the ball · Cookie fetches it along the bottom of the page' },
        stage: 'linear-gradient(180deg, #2b1838 0%, #5a2a45 24%, #a2483f 44%, #e07a3a 62%, #2a3a1c 62%, #22301a 100%)',
        formation: 'repeating-linear-gradient(0deg, #2a3a1c 0px, #2a3a1c 56px, #304220 56px, #304220 112px)',
        shirt: { bg: '#f2b632', ink: '#1f1406', line: '#1a1209', radius: '40px 40px 10px 10px', tagBg: '#ff8a2a', tagInk: '#1f1406' },
        shell: { body: '#3a2a14', bezel: '#1a1209', bezelInk: '#cdb894', ink: '#fbf0dc', btn: '#f2b632', btnInk: '#1f1406', dpad: '#1a1209', pill: '#6b5130', grille: '#6b5130' },
        alt: { mode: 'day',
          c: { bg: '#fdf3df', surface: '#fffaf0', surface2: '#f6e3bb', line: '#24180a', ink: '#24180a', muted: '#6a5230', pitchA: '#9cb84a', pitchB: '#a8c254', chalk: '#fffaf0', shadow: '#24180a', blue: '#2f6f9a', red: '#b8411c', green: '#3f7a2e' },
          accent: '#f2b632', onAccent: '#24180a', accentText: '#8a5800', live: ['#c8321c', '#ffffff'],
          stage: 'linear-gradient(180deg, #ffd98a 0%, #ffc766 26%, #f9ad4e 46%, #f2953f 62%, #9cb84a 62%, #86a33e 100%)',
          formation: 'repeating-linear-gradient(0deg, #9cb84a 0px, #9cb84a 56px, #a8c254 56px, #a8c254 112px)',
          shell: { body: '#f2b632', bezel: '#24180a', bezelInk: '#f6e3bb', ink: '#24180a', btn: '#ff8a2a', btnInk: '#24180a', dpad: '#24180a', pill: '#b97a2f', grille: '#b97a2f' } }
      }
    };""")
sub("""      ai: { flag: 'isLabel', title: 'Label Rush', kicker: 'Eval of the day', a: 'Crack', b: 'Clean', r: null, desk: 2, phone: 1.35,
        legend: [{ key: 'Space or ←', does: 'label crack' }, { key: 'X or →', does: 'label clean' }] }""",
    """      ai: { flag: 'isLabel', title: 'Label Rush', kicker: 'Eval of the day', a: 'Crack', b: 'Clean', r: null, desk: 2, phone: 1.35,
        legend: [{ key: 'Space or ←', does: 'label crack' }, { key: 'X or →', does: 'label clean' }] },
      golden: { flag: 'isRescue', title: 'Street Rescue', kicker: 'Walk of the day', a: 'Shoo', b: 'Bark', r: null, desk: 1.78, phone: 1.5,
        legend: [{ key: 'Arrows / WASD', does: 'move' }, { key: 'Space', does: 'shoo a rowdy' }, { key: 'X', does: 'Cookie barks (recharges)' }] }""")
sub("""    if (world === 'ai') return 'ep ' + m;""", """    if (world === 'ai') return 'ep ' + m;
    if (world === 'golden') return 'DY ' + Math.min(35, Math.round((m / 90) * 35));""")

# ---------- logic: renderVals ----------
sub("""    const flags = { isFootball: false, isRace: false, isMarathon: false, isLabel: false, isSnake: false };""",
    """    const flags = { isFootball: false, isRace: false, isMarathon: false, isLabel: false, isSnake: false, isRescue: false };""")
sub("""      ai: { ...fromProject('retrain', 'At Samsung Electro-Mechanics: agents that notice a model’s accuracy drop, then retrain and re-tune it.'), href: '#pundit', cta: 'Ask the ' + w0.pundit }
    }[wid];""", """      ai: { ...fromProject('retrain', 'At Samsung Electro-Mechanics: agents that notice a model’s accuracy drop, then retrain and re-tune it.'), href: '#pundit', cta: 'Ask the ' + w0.pundit },
      golden: { title: 'Street Rescue', min: "ET 95'", line: 'His volunteering with a dog-rescue NGO, turned into a pixel-art patrol. Cookie comes along.', checks: ['Rowdies telegraph the swing: a ! over the head before the stick comes down', 'Cookie’s bark freezes everyone near her, then recharges', 'Two dogs on the lead at a time, then walk them to the NGO van'], stack: ['Pixel art', 'Web Audio', 'Cookie'], href: '#offpitch', cta: 'Meet Cookie' }
    }[wid];""")
sub("""      w, f: w0.f, isFootball, isGp: wid === 'gp', isGaming: wid === 'gaming', isRun: wid === 'run', isAi: wid === 'ai',""",
    """      w, f: w0.f, isFootball, isGp: wid === 'gp', isGaming: wid === 'gaming', isRun: wid === 'run', isAi: wid === 'ai', isGolden: wid === 'golden',
      heroShift: wid === 'golden' ? '-210px' : '-144px',
      propLeft: wid === 'golden' ? 'calc(50% + 150px)' : 'calc(50% + 168px)',
      boxLeft: wid === 'golden' ? 'calc(50% - 216px)' : 'calc(50% - 150px)',
      goldenSun: night ? '#ffcf6e' : '#fff3c4',
      goldenSunRing: night ? '#ffcf6e33' : '#fff3c466',
      goldenTree: night ? '#241626' : '#7a4a1c',
      goldenLamp: night ? '#ffe08a' : '#c9b48a',
      askTitle: wid === 'golden' ? 'Ask Cookie' : 'Ask the ' + w0.pundit,
      punditName: wid === 'golden' ? 'Cookie' : 'The ' + w0.pundit,
      pack: [['Python', 'Pack leader'], ['PyTorch', 'Fetch'], ['YOLOv8', 'Sniffer'], ['OpenCV', 'Lookout'], ['FastAPI', 'Runner'], ['Next.js', 'Show dog'], ['TypeScript', 'Good boy'], ['NumPy', 'Herder'], ['Pandas', 'Herder'], ['MySQL', 'Guard'], ['Azure', 'Guard']]
        .map(([name, role], i) => ({ name, role, bg: i === 0 ? '#f2b632' : '#fffaf0', ink: '#1f1406', dur: (3 + (i % 4) * 0.45).toFixed(2) + 's' })),
      album: """ + repr([list(p) for p in PHOTOS]) + """.map(([key, cap, src], i) => ({
        cap, label: 'Photo of Cookie: ' + cap + '. Hover or tap to unpixel.', tilt: i % 2 ? '1.2deg' : '-1.5deg',
        ref: this.photoRef(key, src), on: () => this.photoGo(key, 360), off: () => this.photoGo(key, 18), toggle: () => this.photoGo(key, 'toggle')
      })),
      buddyRef: (el) => { this.buddyEl = el; },
      buddyImgRef: (el) => { this.buddyImgEl = el; },
      fetchRef: (el) => { this.fetchEl = el; },
      buddyBoop: (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        this.hearts(r.left + r.width / 2, r.top, 3);
        this.say('boop!');
        if (sound) this.squeak(0);
      },
      buddySayOn: !!this.state.buddySay,
      buddySay: this.state.buddySay || '',
      hearts: this.state.hearts || [],""")
sub("""      kickBall: () => {
        if (this.state.kicking) return;""", """      kickBall: (e) => {
        if (this.state.kicking) return;
        if (wid === 'golden' && e && e.currentTarget) this.throwBall(e.currentTarget);""")
sub("""          ai: ['Boot sequence', 'Neon, evals and Label Rush.']
        }[id];""", """          ai: ['Boot sequence', 'Neon, evals and Label Rush.'],
          golden: ['Walkies', 'Cookie, the dog park and Street Rescue.']
        }[id];""")
sub("""          cls: id === 'football' ? '' : 'va-w-' + id,
          delay:""", """          cls: id === 'football' ? '' : 'va-w-' + id,
          dog: id === 'golden',
          delay:""")
sub("""      active: qa[this.state.q]""", """      active: wid === 'golden' ? { q: qa[this.state.q].q, a: 'Woof! Translation: ' + qa[this.state.q].a } : qa[this.state.q]""")

path.write_text(s)
print("patched", path, len(s))
