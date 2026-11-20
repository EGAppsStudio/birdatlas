import json
P=json.load(open('p.json')); I=json.load(open('img.json'))
def im(k): x,y,w,h=P[k]; return f'<image href="{I[k]}" x="{x}" y="{y}" width="{w}" height="{h}"/>'
svg=f'''<svg class="mavis" id="mv" viewBox="40 -60 1180 1290" xmlns="http://www.w3.org/2000/svg">
<g class="mv-all">
 <ellipse class="mv-golge" cx="627" cy="1196" rx="300" ry="20" fill="#0A3E70" opacity="0.1"/>
 {im('govde')}
 <g class="mv-flyL">{im('acikL')}</g><g class="mv-flyR">{im('acikR')}</g>
 <g class="mv-crest">{im('tepe')}</g>
 <path class="mv-strap" d="M432,688 C455,720 485,752 512,780 M822,688 C799,720 769,752 742,780" stroke="#7A4A22" stroke-width="12" fill="none" stroke-linecap="round"/>
 <g class="mv-wing-l">{im('kanatL')}</g><g class="mv-wing-r">{im('kanatR')}</g>
 <g class="mv-beak">{im('gaga')}</g>
 <g class="mv-eyes"><g class="mv-pupil">{im('gozL')}{im('gozR')}</g></g>
 <g class="mv-eyes-c">{im('kapaliL')}{im('kapaliR')}</g>
 <g class="mv-e-mutlu">{im('mutluL')}{im('mutluR')}</g>
 <g class="mv-e-saskin">{im('saskinL')}{im('saskinR')}</g>
 <g class="mv-e-uyku">{im('uykuL')}{im('uykuR')}</g>
 <g class="mv-binoc">{im('durbun')}</g>
</g>
<g class="mv-deco">
 <g class="mv-notes" fill="#1662B6"><text class="n1" x="1000" y="380" font-size="120">♪</text><text class="n2" x="1080" y="300" font-size="100">♫</text><text class="n3" x="960" y="240" font-size="90">♪</text></g>
 <g class="mv-z" fill="#6b7a8c" font-weight="bold" font-family="sans-serif"><text class="z1" x="930" y="330" font-size="80">z</text><text class="z2" x="1010" y="240" font-size="105">z</text><text class="z3" x="1100" y="140" font-size="130">Z</text></g>
 <text class="mv-unlem" x="1000" y="250" font-size="220" font-weight="900" fill="#F5A623" font-family="sans-serif">!</text>
 <path class="mv-kalp" d="M1010,330 c-40,-60 -130,-20 -95,45 c20,35 95,80 95,80 c0,0 75,-45 95,-80 c35,-65 -55,-105 -95,-45z" fill="#F06A8A"/>
</g>
</svg>'''
html=open('sablon.html').read().replace('%SVG%',svg)
open('mavis-animasyonlar.html','w').write(html)
print(len(html)//1024,'KB')
