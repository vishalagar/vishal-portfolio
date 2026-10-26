# Executed by build_main.py with `s` (the page source) and `must_replace` in scope.

# ---------------------------------------------------------------- state and lifecycle
must_replace(
    "this.state = { night: null, varOn: true, q: 0, sound: false, kicking: false, lights: null, gaze: null, kitBack: [true, true, true, true], kitOn: [false, false, false, false] };",
    "this.state = { night: null, varOn: true, q: 0, sound: false, kicking: false, lights: null, gaze: null, kitBack: [true, true, true, true], kitOn: [false, false, false, false], world: 'football', wipe: null, playing: null, pad: {}, playKey: 0, vw: 1280, vh: 800 };",
)
must_replace(
    "  componentDidMount() {\n",
    """  componentDidMount() {
    this.onResize = () => this.setState({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener('resize', this.onResize);
    this.onResize();
""",
)
must_replace(
    "  componentWillUnmount() {\n    if (this.kitObserver) this.kitObserver.disconnect();",
    "  componentWillUnmount() {\n    window.removeEventListener('resize', this.onResize);\n    if (this.kitObserver) this.kitObserver.disconnect();",
)

# ---------------------------------------------------------------- world definitions and helpers
WORLD_JS = r"""
  worldDefs() {
    return {
      football: {
        name: 'Football', swatch: '#2f7a43',
        f: { display: "'Barlow Condensed', sans-serif", label: "'Silkscreen', monospace", scale: 1 },
        sb: { live: 'Live', home: 'VA', score: '6 – 0', away: 'Bugs' },
        kicker: 'Matchday · Live from Bengaluru', cam: 'Cam 1', cta1: 'Watch highlights', pundit: 'Pundit', talk: 'Half-time team talk',
        boxLabel: 'vishal 0.99', varWord: 'VAR', check: 'VAR check complete', full: 'Full time · post-match interview',
        s1: { kicker: '01 · Team sheet', title: 'Starting XI', sub: '4-3-3', bench: 'Bench' },
        s2: { kicker: '02 · Match timeline', title: 'Career so far' },
        s3: { kicker: '03 · Highlights', title: 'Goals & VAR reviews' },
        s4: { kicker: '04 · Off the pitch', title: 'Match fitness' },
        s5: { kicker: '05 · Studio' },
        tags: { 'Kick-off': 'Kick-off', 'Sub on': 'Sub on', Goal: 'Goal', Promoted: 'Promoted' },
        game: { kicker: 'Match of the day', start: 'Kick off', blurb: 'Drop in a match clip and watch players, ball, possession and passes get tracked, entirely in the browser. Here it is tracking a real mini match: you are #4 with #9 alongside, against the CPU. Sprint, pass, charge your shot. Ninety seconds.' },
        prop: { a: '#f3eee2', b: '#120e14', c: '#120e14', label: 'Kick the ball', hint: 'tap the ball' },
        shirt: { bg: '#f3eee2', ink: '#0b1610', line: '#08130e', radius: '0', tagBg: '#08130e', tagInk: '#eef3ea' },
        shell: { body: '#2f6b3a', bezel: '#1b1f1d', bezelInk: '#cfe0d4', ink: '#eef3ea', btn: '#f5d547', btnInk: '#0b1610', dpad: '#14181a', pill: '#4f5a52', grille: '#1d4527' }
      },
      gp: {
        name: 'Grand Prix', swatch: '#c8102e',
        f: { display: "'Titillium Web', sans-serif", label: "'Silkscreen', monospace", scale: 0.92 },
        c: { bg: '#c8102e', surface: '#a50d26', surface2: '#8a0a1f', line: '#160003', ink: '#ffffff', muted: '#ffe1dd', pitchA: '#3a3a40', pitchB: '#34343a', chalk: '#ffffff', shadow: '#160003', blue: '#ffd400', red: '#160003', green: '#ffd400' },
        accent: '#ffffff', onAccent: '#c8102e', accentText: '#160003', live: ['#ffd400', '#160003'],
        sb: { live: 'Live', home: 'VA', score: 'P1', away: 'Lap 6/6' },
        kicker: 'Race day · Live from Bengaluru', cam: 'Onboard · car 4', cta1: 'Watch onboards', pundit: 'Race Engineer', talk: 'Pit radio',
        boxLabel: 'driver 0.99', varWord: 'Review', check: 'Stewards: no further action', full: 'Chequered flag · post-race interview',
        s1: { kicker: '01 · Garage', title: 'Starting grid', sub: '11 cars', bench: 'Reserve drivers' },
        s2: { kicker: '02 · Race history', title: 'Career laps' },
        s3: { kicker: '03 · Highlights', title: 'Overtakes & steward reviews' },
        s4: { kicker: '04 · Off track', title: 'Driver fitness' },
        s5: { kicker: '05 · Pit wall' },
        tags: { 'Kick-off': 'Lights out', 'Sub on': 'Driver change', Goal: 'Race win', Promoted: 'Race seat' },
        game: { kicker: 'Race of the day', start: 'Lights out', blurb: 'Football Vision tracks anything that moves, so here it is tracking a Grand Prix. You start last in car 4: steer past seven rivals, brake when it gets tight and use DRS three times. Three laps.' },
        prop: { a: '#16161a', b: '#c8102e', c: '#ffffff', label: 'Spin the tyre', hint: 'tap the tyre' },
        stage: 'repeating-linear-gradient(90deg, #3a3a40 0px, #3a3a40 64px, #34343a 64px, #34343a 128px)',
        formation: 'repeating-linear-gradient(0deg, #3a3a40 0px, #3a3a40 56px, #34343a 56px, #34343a 112px)',
        shirt: { bg: '#ffffff', ink: '#c8102e', line: '#160003', radius: '0', tagBg: '#160003', tagInk: '#ffffff' },
        shell: { body: '#c8102e', bezel: '#16161a', bezelInk: '#ffd9d4', ink: '#ffffff', btn: '#ffffff', btnInk: '#c8102e', dpad: '#16161a', pill: '#8a0a1f', grille: '#8a0a1f' }
      },
      gaming: {
        name: 'Gaming', swatch: '#9fa2ad',
        f: { display: "'Orbitron', sans-serif", label: "'Silkscreen', monospace", scale: 0.6 },
        c: { bg: '#c3c4c9', surface: '#d9dade', surface2: '#b0b2b9', line: '#22232b', ink: '#15161c', muted: '#3a3c46', pitchA: '#14151d', pitchB: '#191a24', chalk: '#4a5170', shadow: '#22232b', blue: '#2346b8', red: '#d6336c', green: '#2b8a3e' },
        accent: '#2346b8', onAccent: '#ffffff', accentText: '#1d3a9e', live: ['#d6336c', '#ffffff'],
        sb: { live: '1P', home: 'VA', score: 'LV 6', away: '0 bugs' },
        kicker: 'Player 1 · Press start', cam: 'Player 1', cta1: 'Press start', pundit: 'Guide', talk: 'Cutscene',
        boxLabel: 'player 1 · 0.99', varWord: 'Aim assist', check: 'Achievement unlocked', full: 'Game over · continue?',
        s1: { kicker: '01 · Party', title: 'Character select', sub: '11 unlocked', bench: 'Inventory' },
        s2: { kicker: '02 · Save file', title: 'Story so far' },
        s3: { kicker: '03 · Trophies', title: 'Boss fights & replays' },
        s4: { kicker: '04 · Side quests', title: 'Real-life stats' },
        s5: { kicker: '05 · Strategy guide' },
        tags: { 'Kick-off': 'New game', 'Sub on': 'Party member', Goal: 'Boss beaten', Promoted: 'Level up' },
        game: { kicker: 'Game of the day', start: 'Press start', blurb: 'Football Vision tracks anything that moves, including every bug in a shooter. Move, hold fire, and you get one Debugger that clears the lower half of the screen. Three waves, zero bugs allowed.' },
        prop: { a: '#ffd43b', b: '#b8860b', c: '#fff3b0', label: 'Grab the coin', hint: 'tap the coin' },
        stage: 'radial-gradient(ellipse at 50% 60%, #26305a 0%, #0d0e14 72%)',
        formation: 'repeating-linear-gradient(0deg, #14151d 0px, #14151d 56px, #191a24 56px, #191a24 112px)',
        shirt: { bg: '#2346b8', ink: '#ffffff', line: '#15161c', radius: '50%', tagBg: '#15161c', tagInk: '#e8ecff' },
        shell: { body: '#b9bac1', bezel: '#2a2b33', bezelInk: '#c8cde6', ink: '#15161c', btn: '#2346b8', btnInk: '#ffffff', dpad: '#2a2b33', pill: '#8c8e98', grille: '#8c8e98' }
      },
      run: {
        name: 'Running', swatch: '#1d4fbf',
        f: { display: "'Anton', sans-serif", label: "'Silkscreen', monospace", scale: 1 },
        c: { bg: '#1d4fbf', surface: '#2459cf', surface2: '#1a46aa', line: '#0b2a6b', ink: '#ffffff', muted: '#dbe6ff', pitchA: '#1747a6', pitchB: '#1a4db3', chalk: '#ffffff', shadow: '#0b2a6b', blue: '#d8ff3a', red: '#ff6b6b', green: '#d8ff3a' },
        accent: '#d8ff3a', onAccent: '#0b2a6b', accentText: '#d8ff3a', live: ['#ffffff', '#1d4fbf'],
        sb: { live: 'Live', home: 'VA', score: '21.1 km', away: '≈2:16' },
        kicker: 'Race day · Bengaluru half marathon', cam: 'Cam 4 · km 21', cta1: 'See the splits', pundit: 'Coach', talk: 'Halfway split',
        boxLabel: 'runner #4 · 0.99', varWord: 'Chip timing', check: 'Chip time verified', full: 'Finish line · cool-down',
        s1: { kicker: '01 · Kit bag', title: 'Race kit', sub: '11 essentials', bench: 'Spares' },
        s2: { kicker: '02 · Splits', title: 'Career splits' },
        s3: { kicker: '03 · Highlights', title: 'PBs & photo finishes' },
        s4: { kicker: '04 · Cross-training', title: 'Race day' },
        s5: { kicker: "05 · Coach's corner" },
        tags: { 'Kick-off': 'Start gun', 'Sub on': 'Joined pack', Goal: 'PB', Promoted: 'Pace group' },
        game: { kicker: 'Race of the day', start: 'Start gun', blurb: 'Football Vision tracks anything that moves, so here it is tracking a half marathon. Alternate left and right (A and B on a phone) to run, change lanes to get past, and grab water at km 7 and 14. You start at the back.' },
        prop: { a: '#7fd3ff', b: '#1d4fbf', c: '#ffffff', label: 'Grab the water', hint: 'tap the bottle' },
        stage: 'linear-gradient(180deg, #7fb4ff 0%, #bcd8ff 54%, #1747a6 54%)',
        formation: 'repeating-linear-gradient(0deg, #1747a6 0px, #1747a6 53px, #ffffff 53px, #ffffff 56px)',
        shirt: { bg: '#ffffff', ink: '#0b2a6b', line: '#0b2a6b', radius: '4px', tagBg: '#0b2a6b', tagInk: '#ffffff' },
        shell: { body: '#1d4fbf', bezel: '#0b2a6b', bezelInk: '#dbe6ff', ink: '#ffffff', btn: '#d8ff3a', btnInk: '#0b2a6b', dpad: '#0b2a6b', pill: '#1747a6', grille: '#1747a6' }
      },
      ai: {
        name: 'AI', swatch: '#2de2e6',
        f: { display: "'Chakra Petch', sans-serif", label: "'Share Tech Mono', monospace", scale: 0.86 },
        c: { bg: '#0a0614', surface: '#140c26', surface2: '#1d1236', line: '#4b2d8a', ink: '#efeaff', muted: '#b2a8dc', pitchA: '#120a24', pitchB: '#160d2c', chalk: '#7a4dff', shadow: '#ff2a6d', blue: '#2de2e6', red: '#ff2a6d', green: '#2de2e6' },
        accent: '#2de2e6', onAccent: '#0a0614', accentText: '#2de2e6', live: ['#ff2a6d', '#0a0614'],
        sb: { live: 'Online', home: 'VA', score: 'acc 0.99', away: '0 bugs' },
        kicker: 'Boot sequence · node: bengaluru', cam: 'cam://node-01', cta1: 'Run inference', pundit: 'Agent', talk: 'System prompt',
        boxLabel: 'human 0.99 · cyborg 0.01', varWord: 'Inference', check: 'Eval passed', full: 'EOF · end of stream',
        s1: { kicker: '01 · Model card', title: 'Architecture', sub: '11 layers', bench: 'Fine-tuning pool' },
        s2: { kicker: '02 · Training log', title: 'Career epochs' },
        s3: { kicker: '03 · Benchmarks', title: 'Evals & ablations' },
        s4: { kicker: '04 · Offline', title: 'Human mode' },
        s5: { kicker: '05 · Terminal' },
        tags: { 'Kick-off': 'Init', 'Sub on': 'New data', Goal: 'Release', Promoted: 'To prod' },
        game: { kicker: 'Eval of the day', start: 'Run batch', blurb: 'Football Vision tracks anything, and labelling is how it learns. MLCC chips roll through the scan zone: label crack (A) or clean (B) before the model guesses for you. Every 8 labels it retrains and speeds up.' },
        prop: { a: '#2de2e6', b: '#ff2a6d', c: '#ffffff', label: 'Ping the cube', hint: 'tap the cube' },
        stage: 'linear-gradient(#7a4dff33 1px, transparent 1px) 0 0 / 32px 32px, linear-gradient(90deg, #7a4dff33 1px, transparent 1px) 0 0 / 32px 32px, radial-gradient(ellipse at 50% 80%, #2a1450 0%, #0a0614 70%)',
        formation: 'linear-gradient(#7a4dff33 1px, transparent 1px) 0 0 / 28px 28px, linear-gradient(90deg, #7a4dff33 1px, transparent 1px) 0 0 / 28px 28px, #120a24',
        shirt: { bg: '#0a0614', ink: '#2de2e6', line: '#2de2e6', radius: '0', tagBg: '#ff2a6d', tagInk: '#0a0614' },
        shell: { body: '#140c26', bezel: '#0a0614', bezelInk: '#b2a8dc', ink: '#efeaff', btn: '#2de2e6', btnInk: '#0a0614', dpad: '#2a1d4d', pill: '#ff2a6d', grille: '#4b2d8a' }
      }
    };
  }
  playDefs(world) {
    const common = [{ key: 'Enter', does: 'restart' }, { key: 'Esc', does: 'exit' }];
    const match = {
      football: { flag: 'isFootball', title: 'Football Vision', kicker: 'Match of the day', a: 'Shoot', b: 'Pass', r: 'Sprint', desk: 2, phone: 1.3,
        legend: [{ key: 'Arrows / WASD', does: 'move' }, { key: 'Space (hold)', does: 'shoot, tap to tackle' }, { key: 'X', does: 'pass' }, { key: 'Shift', does: 'sprint' }] },
      gp: { flag: 'isRace', title: 'Grand Prix', kicker: 'Race of the day', a: 'DRS', b: 'Brake', r: null, desk: 1.6, phone: 0.85,
        legend: [{ key: '← →', does: 'steer' }, { key: 'Space', does: 'DRS, 3 per race' }, { key: 'X or ↓', does: 'brake' }] },
      gaming: { flag: 'isBugs', title: 'Bug Hunt', kicker: 'Game of the day', a: 'Fire', b: 'Debugger', r: null, desk: 1.6, phone: 0.85,
        legend: [{ key: '← →', does: 'move' }, { key: 'Space (hold)', does: 'fire' }, { key: 'X', does: 'debugger, once' }] },
      run: { flag: 'isMarathon', title: 'Half Marathon', kicker: 'Race of the day', a: 'Left foot', b: 'Right foot', r: null, desk: 2, phone: 1.35,
        legend: [{ key: '← → alternate', does: 'run' }, { key: 'Space / X alternate', does: 'run' }, { key: '↑ ↓', does: 'change lane' }] },
      ai: { flag: 'isLabel', title: 'Label Rush', kicker: 'Eval of the day', a: 'Crack', b: 'Clean', r: null, desk: 2, phone: 1.35,
        legend: [{ key: 'Space or ←', does: 'label crack' }, { key: 'X or →', does: 'label clean' }] }
    };
    const snake = { flag: 'isSnake', title: 'Snake DQN', kicker: 'Take control', a: 'Again', b: null, r: null, desk: 1.6, phone: 1.6,
      legend: [{ key: 'Arrows / WASD', does: 'steer' }, { key: 'Space', does: 'play again' }] };
    const d = this.state.playing === 'snake' ? snake : match[world];
    return { ...d, legend: d.legend.concat(common) };
  }
  parseMin(str) {
    return String(str).replace(/[^0-9+]/g, '').split('+').filter(Boolean).reduce((a, b) => a + Number(b), 0);
  }
  unit(world, m, original) {
    if (world === 'gp') return 'L' + (m === 0 ? 1 : Math.round((m / 90) * 57) + 1);
    if (world === 'gaming') return 'Lv ' + (1 + Math.floor(m / 6));
    if (world === 'run') return 'km ' + ((m / 90) * 21.1).toFixed(1);
    if (world === 'ai') return 'ep ' + m;
    return original;
  }
  setPad(key, on) {
    if (!!this.state.pad[key] === on) return;
    this.setState({ pad: { ...this.state.pad, [key]: on } });
  }
  pickWorld(id) {
    if (id === this.state.world || this.state.wipe) return;
    if (this.state.sound) this.blip();
    this.setState({ wipe: id });
    this.later(() => this.setState({ world: id }), 320);
    this.later(() => this.setState({ wipe: null }), 920);
  }
  renderVals() {"""
must_replace("  renderVals() {", WORLD_JS)

# ---------------------------------------------------------------- per-world palette, accent and copy at the top of renderVals
must_replace("    const accent = this.props.accent ?? '#f5d547';\n    const sound = this.state.sound;\n    const c = night ? {", "    let accent = this.props.accent ?? '#f5d547';\n    const sound = this.state.sound;\n    let c = night ? {")
must_replace(
    "    const qa = [",
    """    const wid = this.state.world;
    const worlds = this.worldDefs();
    const w0 = worlds[wid];
    let onAccent = '#0b1610';
    let accentText = night ? accent : '#7a5f00';
    let live = [c.red, '#ffffff'];
    if (wid !== 'football') {
      c = w0.c;
      accent = w0.accent;
      onAccent = w0.onAccent;
      accentText = w0.accentText;
      live = w0.live;
    }
    const w = { ...w0, liveBg: live[0], liveInk: live[1], shirtBg: w0.shirt.bg, shirtInk: w0.shirt.ink, shirtLine: w0.shirt.line, shirtRadius: w0.shirt.radius, tagBg: w0.shirt.tagBg, tagInk: w0.shirt.tagInk };
    const isFootball = wid === 'football';
    const vw = this.state.vw;
    const vh = this.state.vh;
    const phone = vw < 700 || (vw < 1000 && window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const pd = this.playDefs(wid);
    let boxW = 0;
    let boxH = 0;
    let gameH = 0;
    if (phone) {
      const availW = vw - 48;
      const availH = vh * 0.5 - 62;
      gameH = Math.floor(Math.min(availH, availW / pd.phone));
    } else {
      const availW = Math.min(vw - 48, 1280);
      const availH = vh - 170;
      boxW = Math.floor(Math.min(availW, availH * pd.desk));
      boxH = Math.floor(boxW / pd.desk);
      gameH = boxH - 4;
    }
    const playing = this.state.playing;
    const flags = { isFootball: false, isRace: false, isBugs: false, isMarathon: false, isLabel: false, isSnake: false };
    const hold = (key) => ({ on: () => this.setPad(key, true), off: () => this.setPad(key, false) });
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ' ': 'a', j: 'a', J: 'a', x: 'b', X: 'b', k: 'b', K: 'b', Shift: 'r', l: 'r', L: 'r' };
    const H = { up: hold('up'), down: hold('down'), left: hold('left'), right: hold('right'), a: hold('a'), b: hold('b'), r: hold('r') };
    const exitPlay = () => this.setState({ playing: null, pad: {} });
    const restartPlay = () => this.setState({ playKey: this.state.playKey + 1, pad: {} });
    const qa = [""",
)
must_replace("const tag = { goal: accent,", "const tag = { goal: wid === 'gaming' ? '#ffd43b' : accent,")

# ---------------------------------------------------------------- return values
must_replace(
    "    return {\n      c, accent,",
    """    return {
      c, accent, onAccent, accentText,
      accentLabel: wid === 'gp' ? '#ffffff' : accentText,
      w, f: w0.f, isFootball, isGp: wid === 'gp', isGaming: wid === 'gaming', isRun: wid === 'run', isAi: wid === 'ai',
      spriteClass: isFootball ? '' : 'va-w-' + wid,
      stageBg: isFootball ? 'repeating-linear-gradient(90deg, ' + c.pitchA + ' 0px, ' + c.pitchA + ' 64px, ' + c.pitchB + ' 64px, ' + c.pitchB + ' 128px)' : w0.stage,
      formationBg: isFootball ? 'repeating-linear-gradient(0deg, ' + c.pitchA + ' 0px, ' + c.pitchA + ' 56px, ' + c.pitchB + ' 56px, ' + c.pitchB + ' 112px)' : w0.formation,
      prop: w0.prop,
      gpBanner: wid === 'gp' && this.state.varOn,
      runStrip: wid === 'run' && this.state.varOn,
      aiStrip: wid === 'ai' && this.state.varOn,
      worldButtons: Object.keys(worlds).map((id) => ({
        name: worlds[id].name,
        swatch: worlds[id].swatch,
        pressed: id === wid ? 'true' : 'false',
        bg: id === wid ? accent : c.surface,
        fg: id === wid ? onAccent : c.ink,
        shadow: id === wid ? '3px 3px 0 ' + c.shadow : 'none',
        pick: () => this.pickWorld(id)
      })),
      wipeOn: !!this.state.wipe,
      wipeBg: this.state.wipe ? (worlds[this.state.wipe].c ? worlds[this.state.wipe].c.bg : '#08130e') : '#000000',
      wipeInk: this.state.wipe ? (worlds[this.state.wipe].c ? worlds[this.state.wipe].c.ink : '#f5d547') : '#ffffff',
      wipeFont: this.state.wipe ? worlds[this.state.wipe].f.display : 'sans-serif',
      wipeName: this.state.wipe ? worlds[this.state.wipe].name : '',
      motdMin: this.unit(wid, 102, "ET 102'"),
      cardMatch: playing !== 'match',
      cardSnake: playing !== 'snake',
      playMatch: () => { if (sound) this.whistle(); this.setState({ playing: 'match', playKey: this.state.playKey + 1, pad: {} }); },
      playSnake: () => { if (sound) this.blip(); this.setState({ playing: 'snake', playKey: this.state.playKey + 1, pad: {} }); },
      playOn: !!playing,
      desk: !phone,
      phone,
      play: { ...flags, [pd.flag]: true, title: pd.title, kicker: pd.kicker, legend: pd.legend, aLabel: pd.a || '', bLabel: pd.b || '', rLabel: pd.r || '', hasA: !!pd.a, hasB: !!pd.b, hasR: !!pd.r },
      shell: { ...w0.shell, brand: 'VA-4 · ' + w0.name },
      boxW: boxW + 'px',
      boxH: boxH + 'px',
      gameH: gameH + 'px',
      pad: this.state.pad,
      playKey: this.state.playKey,
      overlayRef: (el) => { if (el && el !== this.overlayEl) { this.overlayEl = el; el.focus({ preventScroll: true }); } if (!el) this.overlayEl = null; },
      padKeyDown: (e) => {
        if (e.key === 'Escape') { e.preventDefault(); exitPlay(); return; }
        if (e.key === 'Enter') { e.preventDefault(); restartPlay(); return; }
        const k = keyMap[e.key];
        if (!k || e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        this.setPad(k, true);
      },
      padKeyUp: (e) => {
        const k = keyMap[e.key];
        if (!k) return;
        e.preventDefault();
        this.setPad(k, false);
      },
      padBlur: () => { if (Object.values(this.state.pad).some(Boolean)) this.setState({ pad: {} }); },
      exitPlay,
      restartPlay,
      upOn: H.up.on, upOff: H.up.off, downOn: H.down.on, downOff: H.down.off,
      leftOn: H.left.on, leftOff: H.left.off, rightOn: H.right.on, rightOff: H.right.off,
      aOn: H.a.on, aOff: H.a.off, bOn: H.b.on, bOff: H.b.off, rOn: H.r.on, rOff: H.r.off,""",
)
# VAR toggle wording per world
must_replace("varText: this.state.varOn ? 'VAR: on' : 'VAR: off',", "varText: w0.varWord + (this.state.varOn ? ': on' : ': off'),")
# timeline: world units and tags
must_replace(
    "      ],\n      projects: [",
    "      ].map((e) => ({ ...e, tag: w0.tags[e.tag] || e.tag, min: this.unit(wid, this.parseMin(e.min), e.min), minSize: isFootball ? '64px' : '52px' })),\n      projects: [",
)
must_replace(
    "        return { ...p, ...flags };",
    "        return { ...p, ...flags, min: this.unit(wid, this.parseMin(p.min), p.min) };",
)
