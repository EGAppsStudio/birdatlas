# Yeni Maviş parçalarını 1254 tuvalinde konumlandırır, webp + yerleşim üretir (deneme)
import os, json, io, base64
from PIL import Image, ImageOps, ImageFilter
T=__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','temiz')+'/'
OLCEK=560/1254
P={}; IMG={}
def ac(ad): return Image.open(T+ad+'.png')
def yari(im, sol):
    w=im.width; im=im.crop((0,0,w//2,im.height)) if sol else im.crop((w//2,0,w,im.height)); return im.crop(im.getbbox())
def cerceve(im, px):
    a=im.split()[3].filter(ImageFilter.MaxFilter(px*2+1))
    pad=Image.new('RGBA',im.size,(255,255,255,0)); w=Image.new('RGBA',im.size,(250,250,250,255)); pad.paste(w,(0,0),a)
    pad.alpha_composite(im); return pad
def koy(ad, im, cx, cy, gen, aynala=False, ust=None):
    im=im.crop(im.getbbox())
    if aynala: im=ImageOps.mirror(im)
    h=gen*im.height/im.width
    px=max(1,round(gen*OLCEK*1.5)),max(1,round(h*OLCEK*1.5))
    im2=im.resize(px,Image.LANCZOS); b=io.BytesIO(); im2.save(b,'WEBP',quality=88,method=6)
    IMG[ad]='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
    y0 = ust if ust is not None else cy-h/2
    P[ad]=[round(cx-gen/2),round(y0),round(gen),round(h)]
    IMG[ad+'_pil']=(im, P[ad])
# mevcutlar (maskot-birlestir ile aynı)
def goz(k,sol): return yari(ac(k),sol)
koy('govde',ac('govde'),(253+998)/2,(37+1201)/2,998-253)
koy('kanatL',ac('kanat'),275,885,215,True); koy('kanatR',ac('kanat'),975,885,215)
koy('gozL',goz('goz-acik',1),465,448,150); koy('gozR',goz('goz-acik',0),785,448,150)
koy('kapaliL',goz('goz-kapali',1),465,455,165); koy('kapaliR',goz('goz-kapali',0),785,455,165)
koy('durbun',ac('durbun'),627,880,390)
# yeniler
koy('gaga',ac('gaga-acik'),622,0,112,ust=447)
m=ac('goz-mutlu'); m=cerceve(m,10)
koy('mutluL',yari(m,1),465,452,150); koy('mutluR',yari(m,0),785,452,150)
s=ac('goz-saskin'); koy('saskinL',yari(s,1),465,446,178); koy('saskinR',yari(s,0),785,446,178)
u=ac('goz-uykulu'); koy('uykuL',yari(u,1),465,438,168); koy('uykuR',yari(u,0),785,438,168)
koy('acikL',ac('kanat-acik'),250,0,320,ust=490); koy('acikR',ac('kanat-acik'),1004,0,320,True,ust=490)
koy('tepe',ac('tepe'),624,0,690,ust=10)
json.dump({k:v for k,v in IMG.items() if not k.endswith('_pil')},open('img.json','w'))
json.dump(P,open('p.json','w'))
# önizleme kompozitleri
def sahne(katmanlar):
    c=Image.new('RGBA',(1254,1254),(255,255,255,255))
    for k in katmanlar:
        im,(x,y,w,h)=IMG[k+'_pil']; c.alpha_composite(im.resize((w,h)),(max(0,x),max(0,y)) if x>=0 and y>=0 else (0,0))
    return c.convert('RGB').resize((400,400))
pozlar=[['govde','kanatL','kanatR','gozL','gozR','durbun'],
 ['govde','kanatL','kanatR','gaga','mutluL','mutluR','durbun'],
 ['govde','tepe','kanatL','kanatR','gaga','saskinL','saskinR','durbun'],
 ['acikL','acikR','govde','uykuL','uykuR','durbun']]
o=Image.new('RGB',(1600,400),'white')
for i,pz in enumerate(pozlar): o.paste(sahne(pz),(i*400,0))
o.save('onizleme.png'); print(P)
