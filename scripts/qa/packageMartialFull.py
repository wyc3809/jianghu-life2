"""全目錄影片、正常／慢播、盲辨索引及真實改前後；唔生成遊戲美術。"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageDraw,ImageFont
import json,subprocess,hashlib,html
R=Path(__file__).resolve().parents[2];O=R/'production/qa/evidence/redesign/martial-identities-full';T=Path('/workspace/martial-qa/packaged');T.mkdir(parents=True,exist_ok=True);font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
audit=json.loads((R/'production/qa/evidence/redesign/martial-identities/catalog-audit.json').read_text());report=json.loads((O/'catalog-browser.json').read_text());assert len(report['cases'])==103 and all(c['passed'] for c in report['cases']) and not report['errors']
def ff(args):subprocess.run(['ffmpeg','-loglevel','error','-y','-threads','1',*map(str,args)],check=True)
def package(c):
 id=c['id'];label=c['name']+' · '+('核心戰報' if c['kind']=='external' else '純動作檢視')
 ff(['-i',O/f'{id}.mp4','-vf',f"pad=390:878:0:34:color=0xf6eddd,drawtext=fontfile={font}:text='{label}':x=10:y=8:fontsize=16:fontcolor=0x342c24",'-an','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-crf','21',T/f'{id}.mp4'])
 ff(['-i',O/f'{id}.mp4','-vf','setpts=4*PTS,fps=24','-an','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-crf','23','-movflags','+faststart',O/f'{id}-slow.mp4'])
 return id
with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(package,audit['cards']))
def reel(ids,name):
 lst=T/(name+'.txt');lst.write_text(''.join(f"file '{T/(id+'.mp4')}'\n" for id in ids));ff(['-f','concat','-safe','0','-i',lst,'-c','copy','-movflags','+faststart',O/(name+'.mp4')])
reel([c['id'] for c in audit['cards']],'all-103-reel')
reel(['art_staff_iron','art_whip_silk','art_bow_star','art_heavy_halberd','th_flute_sword','pr_blood_lotus','pr_crimson_moon','pr_nine_chain','pr_heaven_spear','pr_soul_lock','pr_vajra_palm','pr_tide_step'],'new-arts-reel')
for ids,name in [(['art_stone_palm','pr_vajra_palm'],'palm-rarity'),(['art_thunder_blade','pr_blood_lotus'],'blade-rarity'),(['qg_snow_track','pr_tide_step'],'steps-rarity')]:
 ff(['-i',O/f'{ids[0]}.mp4','-i',O/f'{ids[1]}.mp4','-filter_complex','hstack=inputs=2','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-crf','20',O/f'{name}.mp4'])
 ff(['-i',O/f'blind-{ids[0]}.mp4','-i',O/f'blind-{ids[1]}.mp4','-filter_complex','hstack=inputs=2','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-crf','18',O/f'{name}-blind.mp4'])
ff(['-i',O/'pr_blood_lotus.mp4','-filter_complex','fps=12,scale=300:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse','-loop','0',O/'premium-preview.gif'])
ff(['-i',O/'palm-rarity-blind.mp4','-filter_complex','fps=12,split[a][b];[a]palettegen[p];[b][p]paletteuse','-loop','0',O/'palm-blind.gif'])
# 實際改前／改後，紅框標實際人物區域。
f=ImageFont.truetype(font,22);small=ImageFont.truetype(font,17);board=Image.new('RGB',(1160,1350),'#f6eddd');draw=ImageDraw.Draw(board);draw.text((20,10),'103門專屬動畫 · 同seed42／390×844／DPR2／真暴擊85',font=f,fill='#342c24')
for x,p,title in [(15,O/'before-pr_vajra_palm.jpg','改前 · 43d6b77：金剛掌仍用通用動作'),(595,O/'pr_vajra_palm.jpg','改後 · 專屬開掌、真暴擊收勢與山紋特效')]:
 im=Image.open(p).convert('RGB');assert im.size==(780,1688),(p,im.size);im=im.resize((550,1190),Image.Resampling.LANCZOS);board.paste(im,(x,105));draw.text((x,65),title,font=small,fill='#342c24');draw.rectangle((x+198,105+718,x+487,105+896),outline='#b63229',width=4)
board.save(O/'comparison.jpg',quality=94)
# 離線索引，文字標示運氣／身法檢視，唔冒充額外攻擊。
parts=['<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>103門武學動畫驗收</title><style>body{background:#f6eddd;color:#342c24;font:16px system-ui;max-width:1100px;margin:auto;padding:20px}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}article{background:#fffaf0;padding:12px}video{width:100%;max-height:600px}a{color:#963e31}small{display:block}body.blind .name{visibility:hidden}</style><h1>103門武學動畫驗收</h1><p>66門外功為真實核心戰報；37門內功／身法為產品呈現器純動作檢視。慢播為正常錄影四倍慢放，無補幀；盲辨影片關閉特效並統一墨色。未部署，待玩家確認。</p><p><a href="new-arts-reel.mp4">新增武學精選</a> · <a href="all-103-reel.mp4">全103門合集</a> · <a href="comparison.jpg">改前／改後</a></p><button onclick="document.body.classList.toggle(\'blind\')">隱藏／顯示名稱</button><section>']
for c in audit['cards']:
 id=c['id'];kind={'external':'核心戰報','internal':'運氣純動作檢視','qinggong':'步法純動作檢視'}[c['kind']];peer=c['closestPeer']
 parts.append(f'<article><h2 class="name">{html.escape(c["name"])} · {c["rarity"]}</h2><small>{kind} · {c["frameCount"]}格</small><video controls preload="none" poster="{id}.jpg" src="{id}.mp4"></video><p><a href="{id}-slow.mp4">四倍慢播</a> · <a href="blind-{id}.mp4">隱名墨色動作</a> · <a href="blind-{peer}.mp4">近似武學對照</a></p></article>')
parts.append('</section></html>');(O/'index.html').write_text(''.join(parts))
manifest=[]
for p in sorted(O.iterdir()):
 if p.suffix not in ['.jpg','.mp4','.gif']:continue
 item={'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 if p.suffix=='.mp4':
  probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,nb_frames,r_frame_rate','-of','json',str(p)]));item['probe']=probe
 else:item['size']=list(Image.open(p).size)
 manifest.append(item)
(O/'media-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'media':len(manifest),'bytes':sum(m['bytes'] for m in manifest)}))
