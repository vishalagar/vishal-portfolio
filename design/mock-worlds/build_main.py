"""Turn the approved single-world Main.dc.html into the five-world version.

Re-runnable: always starts from the live copy saved under artifact-files/.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE.parent / "artifact-files/f51d0767-97a7-4627-820a-ffcf8458a409/project/Main.dc.html"
OUT = HERE / "project/Main.dc.html"
s = SRC.read_text()


def must_replace(old, new, count=1):
    global s
    n = s.count(old)
    if n < 1 or (count == 1 and n != 1):
        sys.exit(f"expected {count} of:\n{old[:200]}\nfound {n}")
    s = s.replace(old, new) if count != 1 else s.replace(old, new, 1)


# ---------------------------------------------------------------- helmet
must_replace(
    "family=Barlow+Condensed:wght@600;700;800&amp;family=Barlow:wght@400;500;600&amp;family=Silkscreen:wght@400;700&amp;display=swap",
    "family=Barlow+Condensed:wght@600;700;800&amp;family=Barlow:wght@400;500;600&amp;family=Silkscreen:wght@400;700"
    "&amp;family=Titillium+Web:wght@700;900&amp;family=Orbitron:wght@700;900&amp;family=Anton"
    "&amp;family=Chakra+Petch:wght@600;700&amp;family=Share+Tech+Mono&amp;display=swap",
)
must_replace(
    ".va-me-lids{opacity:0;animation:va-lids 11s step-end infinite}",
    ".va-me-lids{opacity:0;animation:va-lids 11s step-end infinite}\n"
    ".va-me.va-w-gp{background-image:url(/_blob/8cdb2257532f013f2777429a5412c1e4)}\n"
    ".va-me.va-w-gaming{background-image:url(/_blob/563e27ae5e555b72cf717aa5fccaec87)}\n"
    ".va-me.va-w-run{background-image:url(/_blob/71aeda1093b836bdb9e37d4ff71029b7)}\n"
    ".va-me.va-w-ai{background-image:url(/_blob/53e76633ca0d73ec4431573fb53f3f45)}\n"
    "@keyframes va-worldwipe{0%{clip-path:inset(0 100% 0 0)}35%{clip-path:inset(0 0 0 0)}65%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 0 100%)}}\n"
    "@keyframes va-reticle{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}\n"
    "@keyframes va-flag{0%,100%{opacity:1}50%{opacity:.55}}\n"
    ".va-pad{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}\n"
    ".va-pad button{touch-action:none}\n"
    ".va-pad button:active{filter:brightness(1.25)}",
)

# ---------------------------------------------------------------- fonts and accent colours inside the markup
head, rest = s.split("</helmet>", 1)
markup, script = rest.split('<script type="text/x-dc" data-dc-script', 1)
markup = markup.replace("font-family: 'Barlow Condensed', sans-serif", "font-family: {{f.display}}")
markup = markup.replace("font-family: 'Silkscreen', monospace", "font-family: {{f.label}}")
markup = markup.replace("color: {{accent}}", "color: {{accentText}}")


def fix_on_accent(m):
    style = m.group(0)
    if "background: {{accent}}" in style:
        style = style.replace("color: #0b1610", "color: {{onAccent}}")
    return style


markup = re.sub(r'style="[^"]*"', fix_on_accent, markup)
s = head + "</helmet>" + markup + '<script type="text/x-dc" data-dc-script' + script

# ---------------------------------------------------------------- world wipe overlay + play overlay (top of the page root)
must_replace(
    '<div class="va-progress" aria-hidden="true"',
    '''<sc-if value="{{wipeOn}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: fixed; inset: 0; z-index: 65; pointer-events: none; background: {{wipeBg}}; display: flex; align-items: center; justify-content: center; animation: va-worldwipe .9s cubic-bezier(.7,0,.3,1) forwards">
<div style="font-family: {{wipeFont}}; font-weight: 900; font-size: clamp(48px, 9vw, 140px); text-transform: uppercase; color: {{wipeInk}}; letter-spacing: -.01em">{{wipeName}}</div>
</div>
</sc-if>

<sc-if value="{{playOn}}" hint-placeholder-val="{{ false }}">
<div ref="{{overlayRef}}" tabIndex="0" role="dialog" aria-modal="true" aria-label="{{play.title}}" onKeyDown="{{padKeyDown}}" onKeyUp="{{padKeyUp}}" onBlur="{{padBlur}}" style="position: fixed; inset: 0; z-index: 80; background: {{c.bg}}; color: {{c.ink}}; display: flex; flex-direction: column; outline: none; overflow: hidden">

<sc-if value="{{desk}}" hint-placeholder-val="{{ true }}">
<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 24px; border-bottom: 2px solid {{c.line}}">
<div style="display: flex; align-items: center; gap: 12px">
<span style="background: {{accent}}; color: {{onAccent}}; font-family: {{f.label}}; font-size: 12px; padding: 4px 8px">{{play.kicker}}</span>
<span style="font-family: {{f.display}}; font-weight: 800; font-size: 28px; text-transform: uppercase; line-height: 1">{{play.title}}</span>
</div>
<button type="button" class="va-press" onClick="{{exitPlay}}" style="min-height: 44px; padding: 0 16px; background: {{c.surface}}; color: {{c.ink}}; border: 2px solid {{c.line}}; box-shadow: 3px 3px 0 {{c.shadow}}; font-family: {{f.label}}; font-size: 12px; cursor: pointer">Exit · Esc</button>
</div>
<div style="flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 20px">
<div style="width: {{boxW}}; height: {{boxH}}; border: 2px solid {{c.line}}; box-shadow: 8px 8px 0 {{c.shadow}}; overflow: hidden; position: relative">
<sc-if value="{{play.isFootball}}" hint-placeholder-val="{{ true }}"><dc-import name="FootballGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isRace}}" hint-placeholder-val="{{ false }}"><dc-import name="RaceGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isBugs}}" hint-placeholder-val="{{ false }}"><dc-import name="BugHuntGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isMarathon}}" hint-placeholder-val="{{ false }}"><dc-import name="MarathonGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isLabel}}" hint-placeholder-val="{{ false }}"><dc-import name="LabelRushGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isSnake}}" hint-placeholder-val="{{ false }}"><dc-import name="SnakeDemo" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
</div>
</div>
<div style="padding: 0 24px 18px; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 18px; font-family: {{f.label}}; font-size: 12px; color: {{c.muted}}">
<sc-for list="{{play.legend}}" as="k" hint-placeholder-count="4">
<span><span style="display: inline-block; padding: 2px 7px; margin-right: 6px; border: 2px solid {{c.line}}; background: {{c.surface}}; color: {{c.ink}}">{{k.key}}</span>{{k.does}}</span>
</sc-for>
</div>
</sc-if>

<sc-if value="{{phone}}" hint-placeholder-val="{{ false }}">
<div style="height: 50%; display: flex; flex-direction: column; padding: 10px 10px 8px; background: {{shell.body}}; box-sizing: border-box">
<div style="flex: 1; min-height: 0; display: flex; flex-direction: column; background: {{shell.bezel}}; border-radius: 10px 10px 34px 10px; padding: 10px 12px 8px">
<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-family: {{f.label}}; font-size: 10px; color: {{shell.bezelInk}}">
<span style="display: flex; align-items: center; gap: 6px"><span style="width: 7px; height: 7px; border-radius: 50%; background: #ff3b3b"></span>{{play.kicker}}</span>
<span>{{play.title}}</span>
</div>
<div style="flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden">
<div style="width: 100%; height: {{gameH}}; overflow: hidden; border: 2px solid #000000; position: relative">
<sc-if value="{{play.isFootball}}" hint-placeholder-val="{{ true }}"><dc-import name="FootballGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isRace}}" hint-placeholder-val="{{ false }}"><dc-import name="RaceGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isBugs}}" hint-placeholder-val="{{ false }}"><dc-import name="BugHuntGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isMarathon}}" hint-placeholder-val="{{ false }}"><dc-import name="MarathonGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isLabel}}" hint-placeholder-val="{{ false }}"><dc-import name="LabelRushGame" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
<sc-if value="{{play.isSnake}}" hint-placeholder-val="{{ false }}"><dc-import name="SnakeDemo" mode="play" pad="{{pad}}" play-key="{{playKey}}" height="{{gameH}}" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,100%"></dc-import></sc-if>
</div>
</div>
</div>
</div>

<div class="va-pad" style="height: 50%; position: relative; background: {{shell.body}}; display: flex; flex-direction: column; justify-content: space-between; padding: 12px 18px 22px; box-sizing: border-box">
<div style="display: flex; justify-content: space-between; align-items: center; font-family: {{f.display}}; font-weight: 800; font-size: 18px; text-transform: uppercase; color: {{shell.ink}}">
<span>{{shell.brand}}</span>
<sc-if value="{{play.hasR}}" hint-placeholder-val="{{ false }}">
<button type="button" aria-label="{{play.rLabel}}" onPointerDown="{{rOn}}" onPointerUp="{{rOff}}" onPointerLeave="{{rOff}}" onPointerCancel="{{rOff}}" style="min-width: 96px; min-height: 40px; border-radius: 20px 20px 8px 8px; background: {{shell.btn}}; color: {{shell.btnInk}}; border: 2px solid #000000; font-family: {{f.label}}; font-size: 11px; cursor: pointer">R · {{play.rLabel}}</button>
</sc-if>
</div>

<div style="display: flex; justify-content: space-between; align-items: center">
<div style="display: grid; grid-template-columns: repeat(3, 54px); grid-template-rows: repeat(3, 54px)">
<span></span>
<button type="button" aria-label="Up" onPointerDown="{{upOn}}" onPointerUp="{{upOff}}" onPointerLeave="{{upOff}}" onPointerCancel="{{upOff}}" style="background: {{shell.dpad}}; border: 0; border-radius: 6px 6px 0 0; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 15l6-6 6 6"></path></svg></button>
<span></span>
<button type="button" aria-label="Left" onPointerDown="{{leftOn}}" onPointerUp="{{leftOff}}" onPointerLeave="{{leftOff}}" onPointerCancel="{{leftOff}}" style="background: {{shell.dpad}}; border: 0; border-radius: 6px 0 0 6px; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg></button>
<span style="background: {{shell.dpad}}"></span>
<button type="button" aria-label="Right" onPointerDown="{{rightOn}}" onPointerUp="{{rightOff}}" onPointerLeave="{{rightOff}}" onPointerCancel="{{rightOff}}" style="background: {{shell.dpad}}; border: 0; border-radius: 0 6px 6px 0; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg></button>
<span></span>
<button type="button" aria-label="Down" onPointerDown="{{downOn}}" onPointerUp="{{downOff}}" onPointerLeave="{{downOff}}" onPointerCancel="{{downOff}}" style="background: {{shell.dpad}}; border: 0; border-radius: 0 0 6px 6px; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></button>
<span></span>
</div>

<div style="position: relative; width: 150px; height: 130px; transform: rotate(-22deg)">
<sc-if value="{{play.hasB}}" hint-placeholder-val="{{ true }}">
<div style="position: absolute; left: 0; top: 46px; display: flex; flex-direction: column; align-items: center; gap: 4px">
<button type="button" aria-label="{{play.bLabel}}" onPointerDown="{{bOn}}" onPointerUp="{{bOff}}" onPointerLeave="{{bOff}}" onPointerCancel="{{bOff}}" style="width: 62px; height: 62px; border-radius: 50%; background: {{shell.btn}}; color: {{shell.btnInk}}; border: 2px solid #000000; box-shadow: 0 4px 0 #000000; font-family: {{f.display}}; font-weight: 800; font-size: 22px; cursor: pointer">B</button>
<span style="font-family: {{f.label}}; font-size: 10px; color: {{shell.ink}}; white-space: nowrap">{{play.bLabel}}</span>
</div>
</sc-if>
<sc-if value="{{play.hasA}}" hint-placeholder-val="{{ true }}">
<div style="position: absolute; right: 0; top: 0; display: flex; flex-direction: column; align-items: center; gap: 4px">
<button type="button" aria-label="{{play.aLabel}}" onPointerDown="{{aOn}}" onPointerUp="{{aOff}}" onPointerLeave="{{aOff}}" onPointerCancel="{{aOff}}" style="width: 62px; height: 62px; border-radius: 50%; background: {{shell.btn}}; color: {{shell.btnInk}}; border: 2px solid #000000; box-shadow: 0 4px 0 #000000; font-family: {{f.display}}; font-weight: 800; font-size: 22px; cursor: pointer">A</button>
<span style="font-family: {{f.label}}; font-size: 10px; color: {{shell.ink}}; white-space: nowrap">{{play.aLabel}}</span>
</div>
</sc-if>
</div>
</div>

<div style="display: flex; justify-content: center; gap: 22px">
<div style="display: flex; flex-direction: column; align-items: center; gap: 4px">
<button type="button" onClick="{{exitPlay}}" style="min-width: 76px; min-height: 30px; border-radius: 15px; background: {{shell.pill}}; color: {{shell.btnInk}}; border: 2px solid #000000; font-family: {{f.label}}; font-size: 10px; cursor: pointer">Exit</button>
<span style="font-family: {{f.label}}; font-size: 9px; color: {{shell.ink}}">Select</span>
</div>
<div style="display: flex; flex-direction: column; align-items: center; gap: 4px">
<button type="button" onClick="{{restartPlay}}" style="min-width: 76px; min-height: 30px; border-radius: 15px; background: {{shell.pill}}; color: {{shell.btnInk}}; border: 2px solid #000000; font-family: {{f.label}}; font-size: 10px; cursor: pointer">Restart</button>
<span style="font-family: {{f.label}}; font-size: 9px; color: {{shell.ink}}">Start</span>
</div>
</div>
<div aria-hidden="true" style="position: absolute; right: 22px; bottom: 16px; display: flex; gap: 5px; transform: rotate(-22deg)">
<span style="width: 5px; height: 34px; border-radius: 3px; background: {{shell.grille}}"></span><span style="width: 5px; height: 34px; border-radius: 3px; background: {{shell.grille}}"></span><span style="width: 5px; height: 34px; border-radius: 3px; background: {{shell.grille}}"></span><span style="width: 5px; height: 34px; border-radius: 3px; background: {{shell.grille}}"></span>
</div>
</div>
</sc-if>

</div>
</sc-if>

<div class="va-progress" aria-hidden="true"''',
)

# ---------------------------------------------------------------- header: scorebug per world, floodlights only in football, world switcher row
must_replace(
    '''<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: {{c.red}}; color: #ffffff; font-family: {{f.label}}; font-size: 13px; font-weight: 400"><span style="width: 8px; height: 8px; background: #ffffff; display: inline-block; animation: va-pulse 1.2s steps(1) infinite"></span>Live</div>
<div style="display: flex; align-items: center; gap: 10px; padding: 6px 14px; background: {{c.surface}}"><span style="width: 14px; height: 14px; background: {{c.blue}}; display: inline-block; border: 2px solid {{c.ink}}"></span>VA<span style="padding: 0 10px; background: {{accent}}; color: {{onAccent}}">6 – 0</span>Bugs</div>''',
    '''<div style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: {{w.liveBg}}; color: {{w.liveInk}}; font-family: {{f.label}}; font-size: 13px; font-weight: 400"><span style="width: 8px; height: 8px; background: {{w.liveInk}}; display: inline-block; animation: va-pulse 1.2s steps(1) infinite"></span>{{w.sb.live}}</div>
<div style="display: flex; align-items: center; gap: 10px; padding: 6px 14px; background: {{c.surface}}"><span style="width: 14px; height: 14px; background: {{c.blue}}; display: inline-block; border: 2px solid {{c.ink}}"></span>{{w.sb.home}}<span style="padding: 0 10px; background: {{accent}}; color: {{onAccent}}">{{w.sb.score}}</span>{{w.sb.away}}</div>''',
)
must_replace(
    '''<button type="button" class="va-press" onClick="{{toggleNight}}"''',
    '''<sc-if value="{{isFootball}}" hint-placeholder-val="{{ true }}">
<button type="button" class="va-press" onClick="{{toggleNight}}"''',
)
must_replace(
    '''{{themeText}}
</button>
</div>
</div>''',
    '''{{themeText}}
</button>
</sc-if>
</div>
</div>
<div style="max-width: 1280px; margin: 0 auto; padding: 0 24px 14px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px">
<span id="world-label" style="font-family: {{f.label}}; font-size: 12px; color: {{c.muted}}; margin-right: 4px">Choose your world</span>
<div role="group" aria-labelledby="world-label" style="display: flex; flex-wrap: wrap; gap: 8px">
<sc-for list="{{worldButtons}}" as="wb" hint-placeholder-count="5">
<button type="button" class="va-press" onClick="{{wb.pick}}" aria-pressed="{{wb.pressed}}" style="display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 12px; background: {{wb.bg}}; color: {{wb.fg}}; border: 2px solid {{c.line}}; box-shadow: {{wb.shadow}}; font-family: {{f.label}}; font-size: 12px; cursor: pointer"><span aria-hidden="true" style="width: 12px; height: 12px; background: {{wb.swatch}}; border: 2px solid {{c.ink}}"></span>{{wb.name}}</button>
</sc-for>
</div>
</div>''',
)

# ---------------------------------------------------------------- hero
must_replace(">Matchday · Live from Bengaluru</div>", ">{{w.kicker}}</div>")
must_replace(
    '''background: {{accent}}; color: {{onAccent}}; border: 2px solid {{c.ink}}; box-shadow: 5px 5px 0 {{c.shadow}}; text-decoration: none; font-family: {{f.display}}; font-weight: 800; font-size: 20px; text-transform: uppercase">Watch highlights</a>''',
    '''background: {{accent}}; color: {{onAccent}}; border: 2px solid {{c.ink}}; box-shadow: 5px 5px 0 {{c.shadow}}; text-decoration: none; font-family: {{f.display}}; font-weight: 800; font-size: 20px; text-transform: uppercase">{{w.cta1}}</a>''',
)
must_replace(
    '''text-transform: uppercase">Ask the Pundit</a>''',
    '''text-transform: uppercase">Ask the {{w.pundit}}</a>''',
)
must_replace(
    '''<div style="position: relative; height: 460px; overflow: hidden; border: 2px solid {{c.line}}; box-shadow: 8px 8px 0 {{c.shadow}}; background: repeating-linear-gradient(90deg, {{c.pitchA}} 0px, {{c.pitchA}} 64px, {{c.pitchB}} 64px, {{c.pitchB}} 128px)">
<div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: {{c.chalk}}"></div>
<div style="position: absolute; left: 50%; top: 50%; width: 180px; height: 180px; margin: -92px 0 0 -92px; border: 2px solid {{c.chalk}}; border-radius: 50%"></div>
<div style="position: absolute; left: 14px; top: 12px; font-family: {{f.label}}; font-size: 12px; color: #eef3ea; background: #08130e; padding: 4px 8px">Cam 1</div>''',
    '''<div style="position: relative; height: 460px; overflow: hidden; border: 2px solid {{c.line}}; box-shadow: 8px 8px 0 {{c.shadow}}; background: {{stageBg}}">
<sc-if value="{{isFootball}}" hint-placeholder-val="{{ true }}">
<div aria-hidden="true" style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: {{c.chalk}}"></div>
<div aria-hidden="true" style="position: absolute; left: 50%; top: 50%; width: 180px; height: 180px; margin: -92px 0 0 -92px; border: 2px solid {{c.chalk}}; border-radius: 50%"></div>
</sc-if>
<sc-if value="{{isGp}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 22px; background: repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 28px, #c8102e 28px, #c8102e 56px); border-top: 2px solid #160003"></div>
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 40%; height: 3px; background: repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 40px, transparent 40px, transparent 80px); opacity: .5"></div>
</sc-if>
<sc-if value="{{isGaming}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0px, rgba(255,255,255,.05) 1px, transparent 1px, transparent 3px)"></div>
</sc-if>
<sc-if value="{{isRun}}" hint-placeholder-val="{{ false }}">
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 46%; background: repeating-linear-gradient(0deg, #1747a6 0px, #1747a6 34px, #ffffff 34px, #ffffff 37px)"></div>
<div aria-hidden="true" style="position: absolute; left: 12%; bottom: 0; width: 8px; height: 46%; background: #d8ff3a"></div>
</sc-if>
<div style="position: absolute; left: 14px; top: 12px; font-family: {{f.label}}; font-size: 12px; color: #eef3ea; background: #08130e; padding: 4px 8px">{{w.cam}}</div>''',
)
# the sprite picks up the world costume
must_replace(
    '''<div class="va-me" style="background-position: {{gazePos}}; animation: {{gazeAnim}}"></div>
<div class="va-me va-me-lids"></div>''',
    '''<div class="va-me {{spriteClass}}" style="background-position: {{gazePos}}; animation: {{gazeAnim}}"></div>
<div class="va-me va-me-lids {{spriteClass}}"></div>''',
)
must_replace(
    '''<div class="va-me" style="background-position: 0% 0; animation: va-glance 15s step-end -4s infinite"></div>
<div class="va-me va-me-lids" style="animation-duration: 9.3s; animation-delay: -2.1s"></div>''',
    '''<div class="va-me {{spriteClass}}" style="background-position: 0% 0; animation: va-glance 15s step-end -4s infinite"></div>
<div class="va-me va-me-lids {{spriteClass}}" style="animation-duration: 9.3s; animation-delay: -2.1s"></div>''',
)
must_replace(
    '''<div class="va-me" style="background-position: 0% 0; animation: va-glance 12s step-end -7s infinite"></div>
<div class="va-me va-me-lids" style="animation-duration: 13.7s; animation-delay: -6s"></div>''',
    '''<div class="va-me {{spriteClass}}" style="background-position: 0% 0; animation: va-glance 12s step-end -7s infinite"></div>
<div class="va-me va-me-lids {{spriteClass}}" style="animation-duration: 13.7s; animation-delay: -6s"></div>''',
)
# the kickable object and the review overlay change per world
must_replace(
    '''<svg viewBox="0 0 8 8" width="40" height="40" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="0" width="4" height="8" fill="#f3eee2"></rect><rect x="0" y="2" width="8" height="4" fill="#f3eee2"></rect><rect x="1" y="1" width="6" height="6" fill="#f3eee2"></rect><rect x="3" y="3" width="2" height="2" fill="#120e14"></rect><rect x="1" y="1" width="1" height="1" fill="#120e14"></rect><rect x="6" y="5" width="1" height="1" fill="#120e14"></rect></svg>
</button>''',
    '''<svg viewBox="0 0 8 8" width="40" height="40" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="0" width="4" height="8" fill="{{prop.a}}"></rect><rect x="0" y="2" width="8" height="4" fill="{{prop.a}}"></rect><rect x="1" y="1" width="6" height="6" fill="{{prop.a}}"></rect><rect x="3" y="3" width="2" height="2" fill="{{prop.b}}"></rect><rect x="1" y="1" width="1" height="1" fill="{{prop.c}}"></rect><rect x="6" y="5" width="1" height="1" fill="{{prop.c}}"></rect></svg>
</button>''',
)
must_replace('aria-label="Kick the ball"', 'aria-label="{{prop.label}}"')
must_replace('''<span style="position: absolute; left: -2px; top: -26px; background: {{accent}}; color: {{onAccent}}; font-family: {{f.label}}; font-size: 12px; padding: 3px 8px; white-space: nowrap">vishal 0.99</span>''',
             '''<span style="position: absolute; left: -2px; top: -26px; background: {{accent}}; color: {{onAccent}}; font-family: {{f.label}}; font-size: 12px; padding: 3px 8px; white-space: nowrap">{{w.boxLabel}}</span>
<sc-if value="{{isGaming}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; left: 50%; top: 32%; width: 84px; height: 84px; margin: -42px 0 0 -42px; border: 3px solid {{accent}}; border-radius: 50%; animation: va-reticle 1.2s ease-in-out infinite"></span>
<span style="position: absolute; left: 50%; top: 32%; width: 120px; height: 3px; margin: -1px 0 0 -60px; background: {{accent}}"></span>
<span style="position: absolute; left: 50%; top: 32%; width: 3px; height: 120px; margin: -60px 0 0 -1px; background: {{accent}}"></span>
</sc-if>''')
must_replace(
    '''<button type="button" class="va-press" onClick="{{toggleVar}}" aria-pressed="{{varPressed}}"''',
    '''<sc-if value="{{gpBanner}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; left: 14px; right: 14px; top: 48px; display: flex; flex-wrap: wrap; align-items: stretch; justify-content: center; font-family: {{f.label}}; font-size: 11px; animation: va-flag 1s steps(1) infinite">
<span style="background: #ffd400; color: #160003; padding: 4px 8px; border: 2px solid #160003">Race control</span>
<span style="background: #160003; color: #ffffff; padding: 4px 8px; border: 2px solid #160003">Car 4 · track limits · under investigation</span>
</div>
</sc-if>
<sc-if value="{{runStrip}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; right: 14px; top: 12px; display: flex; border: 2px solid #0b2a6b; font-family: {{f.label}}; font-size: 11px">
<span style="background: #d8ff3a; color: #0b2a6b; padding: 4px 8px">km 21</span>
<span style="background: #0b2a6b; color: #ffffff; padding: 4px 8px">5:45 /km · chip #4</span>
</div>
</sc-if>
<sc-if value="{{aiStrip}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; right: 14px; top: 12px; font-family: {{f.label}}; font-size: 12px; background: #0a0614; color: #2de2e6; border: 2px solid #ff2a6d; padding: 4px 8px; white-space: nowrap">yolo · 14 ms · 1 human, 0 bugs</div>
</sc-if>
<button type="button" class="va-press" onClick="{{toggleVar}}" aria-pressed="{{varPressed}}"''',
)
must_replace(">tap the ball</div>", ">{{prop.hint}}</div>")

# ---------------------------------------------------------------- statement
must_replace(">Half-time team talk</div>", ">{{w.talk}}</div>")

# ---------------------------------------------------------------- lineup
must_replace(">01 · Team sheet</div>", ">{{w.s1.kicker}}</div>")
must_replace(
    '''text-transform: uppercase">Starting XI <span style="color: {{c.muted}}; font-size: 28px">4-3-3</span></h2>''',
    '''text-transform: uppercase">{{w.s1.title}} <span style="color: {{c.muted}}; font-size: 28px">{{w.s1.sub}}</span></h2>''',
)
must_replace(
    "background: repeating-linear-gradient(0deg, {{c.pitchA}} 0px, {{c.pitchA}} 56px, {{c.pitchB}} 56px, {{c.pitchB}} 112px)",
    "background: {{formationBg}}",
)
must_replace(
    "background: #f3eee2; color: #0b1610; border: 3px solid #08130e; box-shadow: 3px 3px 0 #08130e;",
    "background: {{w.shirtBg}}; color: {{w.shirtInk}}; border: 3px solid {{w.shirtLine}}; box-shadow: 3px 3px 0 {{w.shirtLine}}; border-radius: {{w.shirtRadius}};",
)
must_replace(
    '''<div style="background: #08130e; color: #eef3ea; padding: 2px 8px; font-weight: 600; font-size: 14px; text-align: center">{{p.name}}</div>''',
    '''<div style="background: {{w.tagBg}}; color: {{w.tagInk}}; padding: 2px 8px; font-weight: 600; font-size: 14px; text-align: center">{{p.name}}</div>''',
)
must_replace(">Bench</span>", ">{{w.s1.bench}}</span>")

# ---------------------------------------------------------------- timeline
must_replace(">02 · Match timeline</div>", ">{{w.s2.kicker}}</div>")
must_replace(">Career so far</h2>", ">{{w.s2.title}}</h2>")

# ---------------------------------------------------------------- highlights
must_replace(">03 · Highlights</div>", ">{{w.s3.kicker}}</div>")
must_replace(">Goals &amp; VAR reviews</h2>", ">{{w.s3.title}}</h2>")
s = s.replace(">VAR check complete</div>", ">{{w.check}}</div>")
must_replace(
    '''<dc-import name="FootballGame" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,360px"></dc-import>''',
    '''<sc-if value="{{cardMatch}}" hint-placeholder-val="{{ true }}">
<sc-if value="{{isFootball}}" hint-placeholder-val="{{ true }}"><dc-import name="FootballGame" mode="attract" height="360px" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>
<sc-if value="{{isGp}}" hint-placeholder-val="{{ false }}"><dc-import name="RaceGame" mode="attract" height="360px" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>
<sc-if value="{{isGaming}}" hint-placeholder-val="{{ false }}"><dc-import name="BugHuntGame" mode="attract" height="360px" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>
<sc-if value="{{isRun}}" hint-placeholder-val="{{ false }}"><dc-import name="MarathonGame" mode="attract" height="360px" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>
<sc-if value="{{isAi}}" hint-placeholder-val="{{ false }}"><dc-import name="LabelRushGame" mode="attract" height="360px" sound="{{soundOn}}" hint-size="100%,360px"></dc-import></sc-if>
</sc-if>
<button type="button" class="va-press" onClick="{{playMatch}}" style="position: absolute; left: 14px; bottom: 14px; z-index: 2; min-height: 48px; padding: 0 18px; background: {{accent}}; color: {{onAccent}}; border: 2px solid {{c.ink}}; box-shadow: 4px 4px 0 #000000; font-family: {{f.display}}; font-weight: 800; font-size: 18px; text-transform: uppercase; cursor: pointer">{{w.game.start}} · play</button>''',
)
must_replace(
    '''<span style="background: {{accent}}; color: {{onAccent}}; font-family: {{f.display}}; font-weight: 800; font-size: 18px; padding: 0 8px">ET 102'</span>
<span style="font-family: {{f.label}}; font-size: 11px; color: {{c.muted}}">Match of the day</span>''',
    '''<span style="background: {{accent}}; color: {{onAccent}}; font-family: {{f.display}}; font-weight: 800; font-size: 18px; padding: 0 8px">{{motdMin}}</span>
<span style="font-family: {{f.label}}; font-size: 11px; color: {{c.muted}}">{{w.game.kicker}}</span>''',
)
must_replace(
    '''<p style="margin: 0; color: {{c.muted}}; font-size: 15px">Drop in a match clip and watch players, ball, possession and passes get tracked, entirely in the browser. Here it is tracking a real mini match: you are #4 with #9 alongside, against the CPU. Sprint, pass, charge your shot. Ninety seconds.</p>''',
    '''<p style="margin: 0; color: {{c.muted}}; font-size: 15px">{{w.game.blurb}}</p>''',
)
must_replace(
    '''<sc-if value="{{p.kSnake}}" hint-placeholder-val="{{ false }}">
<dc-import name="SnakeDemo" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,220px"></dc-import>
</sc-if>''',
    '''<sc-if value="{{p.kSnake}}" hint-placeholder-val="{{ false }}">
<sc-if value="{{cardSnake}}" hint-placeholder-val="{{ true }}">
<dc-import name="SnakeDemo" mode="attract" height="220px" accent="{{accent}}" sound="{{soundOn}}" hint-size="100%,220px"></dc-import>
</sc-if>
<button type="button" class="va-press" onClick="{{playSnake}}" style="position: absolute; left: 10px; bottom: 10px; z-index: 2; min-height: 44px; padding: 0 12px; background: {{accent}}; color: {{onAccent}}; border: 2px solid #0b1610; box-shadow: 3px 3px 0 #000000; font-family: {{f.label}}; font-size: 11px; cursor: pointer">Take control</button>
</sc-if>''',
)

# ---------------------------------------------------------------- off the pitch, pundit, footer
must_replace(">04 · Off the pitch</div>", ">{{w.s4.kicker}}</div>")
must_replace(">Match fitness</h2>", ">{{w.s4.title}}</h2>")
must_replace(">05 · Studio</div>", ">{{w.s5.kicker}}</div>")
must_replace(">Ask the Pundit</h2>", ">Ask the {{w.pundit}}</h2>")
must_replace(">The Pundit</div>", ">The {{w.pundit}}</div>")
must_replace(">Pundit · live</div>", ">{{w.pundit}} · live</div>")
must_replace(">Full time · post-match interview</div>", ">{{w.full}}</div>")
must_replace(">Pundit</a>", ">{{w.pundit}}</a>")

# minutes on cards and the timeline come from the world's unit
must_replace('''font-weight: 800; font-size: 64px; line-height: .9">{{e.min}}</span>''', '''font-weight: 800; font-size: {{e.minSize}}; line-height: .9">{{e.min}}</span>''')

# display type scales per world (Orbitron is far wider than Barlow Condensed)
for size in ["clamp(52px, 7vw, 100px)", "clamp(42px, 6.6vw, 96px)", "clamp(44px, 6vw, 80px)"]:
    s = s.replace("font-size: " + size, "font-size: calc(" + size + " * {{f.scale}})")
s = s.replace("font-size: 56px", "font-size: calc(56px * {{f.scale}})")
# small accent labels need their own colour in the red world
must_replace("color: {{accentText}}; margin-bottom: 6px\">{{w.pundit}} · live", "color: {{accentLabel}}; margin-bottom: 6px\">{{w.pundit}} · live")
# synthetic bold looks wrong on single-weight display faces
must_replace("font-size: 17px; line-height: 1.55; min-height: 100vh;", "font-size: 17px; line-height: 1.55; min-height: 100vh; font-synthesis: none;")
exec(open(HERE / "build_logic.py").read())
OUT.write_text(s)
print("markup ok:", OUT, len(s))
