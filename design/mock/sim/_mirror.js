const fs = require('fs');
const src = fs.readFileSync('../FootballGame.dc.html', 'utf8');
const js = src.slice(src.indexOf('class Component'), src.lastIndexOf('</script>'));
const C = eval("(function(){class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,s)}}\n" + js + "\nreturn Component;})()");
Math.random = () => 0.5;
const base = { mode: 'bot', score: { A: 0, B: 0 }, tick: 0, over: false, halfDone: false, flash: null };
const c1 = new C({ sport: 'football' }); c1.state.g = c1.restart(base, 'A');
const c2 = new C({ sport: 'football' }); c2.state.g = c2.restart(base, 'B');
const pair = [[0, 2], [1, 3], [2, 0], [3, 1], [4, 5], [5, 4]];
for (let t = 0; t < 1500; t++) {
  c1.tick(); c2.tick();
  const g1 = c1.state.g, g2 = c2.state.g;
  for (const [i, j] of pair) {
    const a = g1.players[i], b = g2.players[j];
    if (Math.abs(a.x - (100 - b.x)) > 1e-6 || Math.abs(a.y - (50 - b.y)) > 1e-6) {
      console.log(`tick ${t}: player ${i} (${a.team}${a.num}) at ${a.x.toFixed(3)},${a.y.toFixed(3)} vs mirror ${(100 - b.x).toFixed(3)},${(50 - b.y).toFixed(3)} | ball owner ${g1.ball.owner}/${g2.ball.owner}`);
      process.exit(0);
    }
  }
  if (Math.abs(g1.ball.x - (100 - g2.ball.x)) > 1e-6) { console.log('ball diverged at', t, g1.ball, g2.ball); process.exit(0); }
}
console.log('no divergence in 1500 ticks');
