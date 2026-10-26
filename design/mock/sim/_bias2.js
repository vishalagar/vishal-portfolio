const fs = require('fs');
const src = fs.readFileSync('../FootballGame.dc.html', 'utf8');
const js = src.slice(src.indexOf('class Component'), src.lastIndexOf('</script>'));
eval("class DCLogic{constructor(p){this.props=p}setState(s){this.state=Object.assign({},this.state,s)}}\n" + js + "\nglobalThis.C=Component;");
function run(sport, firstKick, n) {
  let A = 0, B = 0;
  for (let m = 0; m < n; m++) {
    const c = new C({ sport });
    c.state.g = c.restart({ mode: 'bot', score: { A: 0, B: 0 }, tick: 0, over: false, halfDone: false, flash: null }, firstKick);
    for (let i = 0; i < 4000; i++) { const b0 = c.state.g; c.tick(); const g = c.state.g; if (g.tick === 0 && b0.tick > 0) { A += b0.score.A; B += b0.score.B; break; } }
  }
  return `A ${A} – B ${B}`;
}
for (const sport of ['football', 'hockey']) console.log(sport, '| A kicks first:', run(sport, 'A', 40), '| B kicks first:', run(sport, 'B', 40));
