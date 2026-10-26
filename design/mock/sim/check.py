import sys, json
from html.parser import HTMLParser
VOID={'meta','link','img','input','br','hr','path','rect'}
class P(HTMLParser):
    def __init__(s): super().__init__(); s.st=[]; s.err=[]
    def handle_starttag(s,t,a):
        if t not in VOID: s.st.append((t,s.getpos()))
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.st or s.st[-1][0]!=t: s.err.append((t,s.getpos(),s.st[-1] if s.st else None))
        else: s.st.pop()
for f in sys.argv[1:]:
    src=open(f).read()
    p=P(); p.feed(src); print(f, 'errors',p.err[:3],'unclosed',p.st[:3])
    a=src.index("data-props='")+12; b=src.index("'>",a); json.loads(src[a:b].replace('&amp;','&').replace('&#39;',"'")); 
    js=src[src.index('class Component'):src.rindex('</script>')]
    open('_c.js','w').write("class DCLogic{constructor(p){this.props=p}setState(){}}\n"+js+"\nnew Component({}).renderVals();console.log('renderVals ok')")
    import subprocess; print(subprocess.run(['node','_c.js'],capture_output=True,text=True).stdout.strip() or subprocess.run(['node','_c.js'],capture_output=True,text=True).stderr[:600])
