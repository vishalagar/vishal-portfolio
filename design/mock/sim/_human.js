const fs = require('fs');
const src = fs.readFileSync('../FootballGame.dc.html', 'utf8');
const js = src.slice(src.indexOf('class Component'), src.lastIndexOf('</script>'));
const C = eval("(function(){class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,s)}}\n" + js + "\nreturn Component;})()");
for (const sport of ['football']) {
  const c = new C({ sport });
  const v0 = c.renderVals();
  const ev = (key, type) => ({ key, repeat: false, preventDefault() {}, type });
  v0.keyDown(ev(' '));                      // any game key in bot mode starts a match
  let log = { passes: 0, shots: 0, switches: 0, tackleTries: 0, maxStaminaDrop: 1 };
  let prevActive = c.state.g.active;
  for (let t = 0; t < 6000 && !c.state.g.over; t++) {
    const v = c.renderVals(); const g = c.state.g;
    const mine = g.ball.owner === g.active;
    // simple scripted player: run right sprinting, pass every ~4 s, charge+shoot near goal, tackle when defending
    v.keyDown(ev('ArrowRight')); v.keyDown(ev('Shift'));
    if (mine && t % 120 === 0) { v.keyDown(ev('x')); log.passes++; }
    if (mine && g.players[g.active].x > 72 && c.charge === null) v.keyDown(ev(' '));
    if (c.charge !== null && c.charge > 12) { v.keyUp(ev(' ')); log.shots++; }
    if (!mine && g.ball.owner !== null && g.players[g.ball.owner].team === 'B' && t % 15 === 0) { v.keyDown(ev(' ')); v.keyUp(ev(' ')); log.tackleTries++; }
    c.tick();
    if (c.state.g.active !== prevActive) { log.switches++; prevActive = c.state.g.active; }
    log.maxStaminaDrop = Math.min(log.maxStaminaDrop, c.state.g.players[c.state.g.active].stamina);
  }
  const v = c.renderVals();
  console.log(sport, JSON.stringify(log), '| over:', c.state.g.over, '| overlay:', v.fullTime, `| VA ${v.scoreA}-${v.scoreB} CPU`, '|', v.result);
}
