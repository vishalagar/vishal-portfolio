const fs = require('fs');
const src = fs.readFileSync('../FootballGame.dc.html', 'utf8');
const js = src.slice(src.indexOf('class Component'), src.lastIndexOf('</script>'));
eval("class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,s)}}\n" + js + "\nglobalThis.C=Component;");
function play(sport, matches) {
  const agg = { scores: [], ev: {}, nan: 0, stuck: 0 };
  for (let m = 0; m < matches; m++) {
    const c = new C({ sport });
    let prevT = 0, prevText = null, still = 0, prev = null, last = null;
    for (let i = 0; i < 6000; i++) {
      const before = c.state.g; c.tick(); const g = c.state.g;
      const f = g.flash;
      if (f && (f.text !== prevText || f.t > prevT)) agg.ev[f.text] = (agg.ev[f.text] || 0) + 1;
      prevT = f ? f.t : 0; prevText = f ? f.text : null;
      if ([g.ball.x, g.ball.y, ...g.players.flatMap(p => [p.x, p.y])].some(Number.isNaN)) agg.nan++;
      if (g.freeze === 0 && prev && Math.abs(prev.x - g.ball.x) + Math.abs(prev.y - g.ball.y) < 0.001 && g.ball.owner === null) still++; else still = 0;
      if (still > 90) { agg.stuck++; still = 0; }
      prev = { x: g.ball.x, y: g.ball.y };
      if (g.tick === 0 && before.tick > 0) { last = before.score; break; }
    }
    agg.scores.push(last ? `${last.A}-${last.B}` : 'n/a');
  }
  return agg;
}
for (const sport of ['football']) {
  const r = play(sport, 16);
  console.log(sport, 'full-time scores:', r.scores.join('  '));
  console.log('  events per 16 matches:', JSON.stringify(r.ev), '| NaN:', r.nan, '| stuck loose ball:', r.stuck);
}
