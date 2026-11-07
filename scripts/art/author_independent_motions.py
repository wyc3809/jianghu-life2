"""逐門明確動作語彙；不是用ID雜湊、換色或速度微調產生假差異。"""
from pathlib import Path
import json,math
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'design/art/independent-animation'
# 手腕目標相對胸骨；腳踝偏移相對站立支點。所有數值是畫面設計單位，不參與戰鬥。
BASE={'near':[40,-210],'far':[190,-200],'hip':[0,-35],'nearFoot':[0,0],'farFoot':[0,0],'lean':0,'head':0,'hand':'fist','farHand':'fist','aim':0,'two':0,'cloth':0}
P={}
def pose(name,**v):P[name]={**BASE,**v,'handSpecified':'hand'in v,'farHandSpecified':'farHand'in v}
pose('guard');pose('rest',near=[-162,-434],far=[198,-430],hip=[0,0])
pose('draw',near=[-90,-120],far=[180,-150],lean=6,head=-2)
pose('draw-deep',near=[-140,-140],far=[150,-160],hip=[-30,-105],nearFoot=[-70,0],farFoot=[70,0],lean=10,head=-3)
pose('punch',near=[240,-55],far=[100,-230],hip=[35,-55],nearFoot=[100,0],farFoot=[-15,0],lean=-9,head=2)
pose('punch-left',near=[65,-180],far=[460,-55],hip=[15,-65],nearFoot=[40,0],farFoot=[70,0],lean=-6,head=2)
pose('punch-long',near=[245,-25],far=[90,-230],hip=[65,-110],nearFoot=[140,0],farFoot=[-30,0],lean=-14,head=3)
pose('punch-short',near=[100,-90],far=[155,-205],hip=[10,-130],nearFoot=[-30,0],farFoot=[80,0],lean=-4)
pose('uppercut',near=[100,180],far=[110,-200],hip=[10,-65],nearFoot=[80,0],lean=-7,aim=75)
pose('elbow',near=[-40,-90],far=[100,-220],hip=[30,-95],nearFoot=[100,0],lean=-12,head=2)
pose('backfist',near=[210,-120],far=[210,-240],hip=[-30,-80],nearFoot=[-35,0],farFoot=[100,0],lean=8,aim=-35)
pose('hammer',near=[150,-275],far=[90,-150],hip=[65,-220],nearFoot=[140,0],farFoot=[-30,0],lean=-15)
pose('pole-crouch',near=[100,-150],hip=[-10,-220],nearFoot=[-80,0],farFoot=[80,0],hand='grip',farHand='grip',aim=10,two=250,lean=10)
pose('pole-wide',near=[180,-120],hip=[-25,-180],nearFoot=[-170,0],farFoot=[180,0],hand='grip',farHand='grip',aim=10,two=260,lean=8)
pose('cross',near=[160,-120],far=[-15,-180],hip=[0,-100],hand='fist')
pose('stagger-left',near=[-90,-220],far=[220,-310],hip=[-60,-115],nearFoot=[-90,0],farFoot=[-20,0],lean=13,head=-4)
pose('stagger-right',near=[160,-240],far=[310,-240],hip=[65,-85],nearFoot=[70,0],farFoot=[100,0],lean=-12,head=3)
pose('palm-low',near=[40,-320],far=[170,-270],hip=[-10,-100],hand='palm',farHand='palm',aim=-70)
pose('palm-up',near=[110,170],far=[175,-180],hip=[0,-60],hand='palm',farHand='palm',aim=75,lean=5)
pose('palm-front',near=[235,-65],far=[110,-210],hip=[35,-75],nearFoot=[100,0],hand='palm',farHand='palm',lean=-7,aim=0)
pose('palm-ground',near=[50,-170],far=[395,-300],hip=[35,-460],nearFoot=[-120,0],farFoot=[160,0],lean=-45,hand='palm',farHand='palm',aim=-70,contact='far')
pose('palm-back',near=[-85,-160],far=[330,-110],hip=[-40,-75],nearFoot=[-60,0],hand='palm',farHand='palm',lean=10,aim=110)
pose('palm-double',near=[210,-90],far=[395,-105],hip=[35,-130],nearFoot=[110,0],farFoot=[50,0],hand='palm',farHand='palm',lean=-10)
pose('palm-cover',near=[20,140],far=[175,-160],hip=[-10,-60],hand='palm',farHand='palm',lean=5,aim=100)
pose('palm-cross',near=[180,-120],far=[-20,-170],hip=[-10,-85],hand='palm',farHand='palm',aim=30,lean=4)
pose('palm-circle',near=[-90,35],far=[420,-90],hip=[-20,-100],nearFoot=[-55,0],farFoot=[60,0],hand='palm',farHand='palm',aim=120,lean=6)
pose('palm-turn',near=[180,60],far=[70,-220],hip=[25,-90],hand='palm',farHand='palm',aim=55,lean=-5)
pose('knee',near=[40,-120],far=[190,-170],hip=[15,-20],nearFoot=[170,400],farFoot=[-15,0],lean=6)
pose('kick',near=[-60,-170],far=[240,-170],hip=[-20,-30],nearFoot=[665,615],farFoot=[-15,0],lean=12,head=-2)
pose('kick-far',near=[100,-170],far=[260,-180],hip=[10,-40],nearFoot=[-40,0],farFoot=[540,510],lean=8)
pose('sweep',near=[150,-110],far=[340,-180],hip=[-15,-245],nearFoot=[510,0],farFoot=[-40,0],lean=-12)
pose('crouch',near=[-30,-180],far=[180,-180],hip=[0,-220],nearFoot=[-80,0],farFoot=[80,0],lean=10)
pose('step-front',near=[50,-210],far=[200,-220],hip=[50,-60],nearFoot=[200,90],farFoot=[-20,0],lean=-4)
pose('step-back',near=[10,-180],far=[210,-230],hip=[-70,-70],nearFoot=[-90,0],farFoot=[-60,80],lean=5)
pose('step-cross',near=[120,-230],far=[220,-150],hip=[25,-110],nearFoot=[220,80],farFoot=[-130,0],lean=-5)
pose('step-wide',near=[-40,-170],far=[310,-180],hip=[-25,-180],nearFoot=[-170,0],farFoot=[180,0],lean=8)
pose('step-high',near=[120,30],far=[200,-140],hip=[0,-15],nearFoot=[280,530],farFoot=[-15,0],lean=4)
pose('step-fold',near=[30,-110],far=[200,-165],hip=[-20,-225],nearFoot=[250,270],farFoot=[-20,0],lean=13)
pose('step-tip',near=[20,-170],far=[220,-230],hip=[0,40],nearFoot=[50,80],farFoot=[0,65],lean=-2)
pose('step-side',near=[-90,-140],far=[320,-210],hip=[-65,-90],nearFoot=[-180,0],farFoot=[100,0],lean=11)
pose('shoulder',near=[-50,-160],far=[130,-190],hip=[80,-150],nearFoot=[230,0],farFoot=[-20,0],lean=-18)
# 持武姿勢明確握法；two是兩個握點在同一桿上的設計間距。
pose('weapon-guard',near=[40,-160],far=[190,-220],hand='grip',aim=30)
pose('weapon-low',near=[60,-290],far=[190,-190],hip=[-30,-80],hand='grip',aim=-55,lean=4)
pose('weapon-draw',near=[-100,-120],far=[200,-200],hand='grip',aim=120,lean=7)
pose('weapon-high',near=[80,220],far=[190,-210],hip=[-20,-65],hand='grip',aim=75,lean=6)
pose('stab',near=[240,-60],far=[100,-230],hip=[45,-90],nearFoot=[140,0],hand='grip',aim=0,lean=-8)
pose('stab-recoil',near=[120,-65],far=[110,-220],hip=[25,-70],hand='grip',aim=0,lean=-4)
pose('stab-high',near=[210,65],far=[100,-220],hip=[30,-75],nearFoot=[100,0],hand='grip',aim=20,lean=-6)
pose('stab-low',near=[180,-245],far=[150,-150],hip=[55,-150],nearFoot=[140,0],hand='grip',aim=-35,lean=-13)
pose('slash-down',near=[145,-300],far=[170,-140],hip=[55,-150],nearFoot=[140,0],hand='grip',aim=-65,lean=-14,cloth=-6)
pose('slash-up',near=[160,130],far=[180,-230],hip=[35,-70],nearFoot=[110,0],hand='grip',aim=60,lean=-6,cloth=5)
pose('slash-level',near=[220,-140],far=[170,-230],hip=[-25,-95],nearFoot=[-45,0],farFoot=[110,0],hand='grip',aim=-10,lean=6,cloth=8)
pose('parry',near=[-80,70],far=[200,-170],hip=[-45,-60],hand='grip',aim=115,lean=10)
pose('blade-settle',near=[-60,-180],hip=[-15,-65],hand='grip',farHand='grip',aim=90,two=140,lean=4)
pose('blade-raise',near=[80,220],hip=[-25,-100],hand='grip',farHand='grip',aim=75,two=140,lean=8)
pose('blade-heavy',near=[150,-275],hip=[65,-190],nearFoot=[180,0],farFoot=[-30,0],hand='grip',farHand='grip',aim=-65,two=130,lean=-15)
pose('pole-guard',near=[150,-120],hip=[0,-85],hand='grip',farHand='grip',aim=10,two=260)
pose('pole-draw',near=[20,-150],hip=[-50,-110],nearFoot=[-60,0],hand='grip',farHand='grip',aim=10,two=230,lean=8)
pose('pole-thrust',near=[240,-80],hip=[55,-135],nearFoot=[180,0],hand='grip',farHand='grip',aim=0,two=270,lean=-12)
pose('pole-up',near=[180,120],hip=[-10,-70],hand='grip',farHand='grip',aim=90,two=300,lean=4)
pose('pole-sweep',near=[140,-220],hip=[30,-150],nearFoot=[130,0],hand='grip',farHand='grip',aim=-25,two=260,lean=-8,cloth=7)
pose('hook-out',near=[200,-50],far=[100,-220],hip=[35,-90],hand='grip',aim=25,lean=-5)
pose('hook-pull',near=[-20,-90],far=[250,-220],hip=[-55,-110],nearFoot=[-100,0],hand='grip',aim=80,lean=12)
pose('whip-back',near=[-100,80],far=[190,-220],hip=[-30,-70],hand='grip',aim=115,lean=10,cloth=-5)
pose('whip-cast',near=[230,-70],far=[100,-230],hip=[45,-110],nearFoot=[140,0],hand='grip',aim=0,lean=-10,cloth=8)
pose('bow-raise',near=[180,-50],far=[80,-170],hip=[-20,-60],hand='grip',farHand='draw',aim=10)
pose('bow-draw',near=[240,-40],far=[30,65],hip=[10,-100],nearFoot=[-50,0],farFoot=[100,0],hand='grip',farHand='draw',aim=0,lean=3)
pose('bow-release',near=[245,-35],far=[-30,70],hip=[10,-100],nearFoot=[-50,0],farFoot=[100,0],hand='grip',farHand='finger',aim=0,lean=1)
pose('needle-hide',near=[-30,-190],far=[160,-180],hip=[-30,-75],hand='pinch',farHand='pinch',lean=7)
pose('needle-front',near=[225,-95],far=[100,-200],hip=[20,-75],hand='pinch',farHand='pinch',aim=0,lean=-4)
pose('needle-left',near=[60,-170],far=[445,-110],hip=[10,-75],hand='pinch',farHand='pinch',aim=0,lean=-3)
pose('throw-high',near=[60,170],far=[170,-180],hip=[-35,-80],hand='pinch',aim=60,lean=9)
pose('throw-release',near=[235,-100],far=[100,-210],hip=[40,-90],nearFoot=[90,0],hand='pinch',aim=-15,lean=-8)
pose('throw-low',near=[150,-300],far=[240,-130],hip=[20,-135],hand='pinch',aim=-50,lean=-8)
pose('finger',near=[235,-100],far=[110,-210],hip=[30,-95],nearFoot=[80,0],hand='finger',aim=0,lean=-6)
pose('finger-high',near=[190,80],far=[140,-220],hip=[15,-75],hand='finger',aim=35,lean=-3)
pose('finger-lock',near=[100,-130],far=[70,-180],hip=[-20,-95],hand='finger',farHand='pinch',aim=25,lean=5)
pose('finger-pull',near=[-60,-120],far=[190,-180],hip=[-55,-110],hand='pinch',farHand='finger',lean=12)
pose('flute-guard',near=[100,-140],hip=[0,-45],hand='flute',farHand='flute',aim=0,two=150)
pose('flute-point',near=[215,-180],hip=[35,-80],nearFoot=[80,0],hand='flute',farHand='flute',aim=10,two=160,lean=-5)
pose('stone-think',near=[20,80],far=[180,-220],hand='stone',farHand='stone',hip=[-20,-35],lean=3)
pose('stone-drop',near=[170,-230],far=[190,-130],hand='stone',farHand='stone',hip=[-35,-110],nearFoot=[-60,0],aim=-70,lean=8)
pose('stone-left',near=[10,-170],far=[380,-220],hand='stone',farHand='stone',hip=[-15,-80],aim=-70,lean=-2)
pose('qi-low',near=[20,-290],far=[130,-290],hip=[0,-70],hand='palm',farHand='palm',aim=-50)
pose('qi-mid',near=[30,-150],far=[100,-170],hip=[0,-25],hand='palm',farHand='palm',aim=30,head=-1)
pose('qi-high',near=[50,160],far=[210,180],hip=[0,0],hand='palm',farHand='palm',aim=80,head=-2)
pose('qi-wide',near=[-200,100],far=[450,-80],hip=[0,-45],hand='palm',farHand='palm',aim=145,head=2)
pose('qi-prayer',near=[70,-180],far=[85,-190],hip=[0,-40],hand='palm',farHand='palm',aim=70)
pose('qi-fist',near=[-80,-280],far=[200,-280],hip=[0,-105],nearFoot=[-60,0],farFoot=[80,0],hand='fist',farHand='fist',lean=-2)
pose('qi-seal',near=[45,-130],far=[105,-150],hip=[-5,-75],hand='finger',farHand='pinch',aim=45)
pose('qi-round',near=[-60,-70],far=[290,-90],hip=[0,-45],hand='palm',farHand='palm',aim=110)
pose('qi-press',near=[70,-345],far=[215,-350],hip=[0,-130],hand='palm',farHand='palm',aim=-70,head=2)
pose('qi-invert',near=[80,20],far=[220,-300],hip=[5,-50],hand='palm',farHand='palm',aim=70)
pose('qi-alternate',near=[0,-300],far=[240,20],hip=[-5,-60],hand='palm',farHand='palm',aim=-60)
pose('qi-string-left',near=[30,-250],far=[280,-190],hip=[0,-55],hand='flute',farHand='flute',aim=-20)
pose('qi-string-right',near=[170,-190],far=[100,-250],hip=[0,-45],hand='flute',farHand='flute',aim=20)
# 每行是獨立招式的實際姿勢順序；相同基本姿勢可共用，整段編排不共用。
ROWS='''
art_river_fist guard draw punch draw punch-left draw-deep punch-long guard
sl_luohan_fist guard crouch cross punch-short elbow punch-left cross guard
pr_mountain_split guard crouch draw-deep uppercut hammer palm-ground draw guard
art_stone_palm guard palm-low palm-up palm-ground palm-ground palm-low palm-front guard
art_wind_chase guard knee kick knee kick-far crouch sweep guard
art_rain_sword weapon-guard weapon-draw stab stab-recoil stab-high stab-recoil stab weapon-guard
pr_wind_thread weapon-guard step-cross parry stab-low weapon-draw stab-high stab weapon-guard
art_thunder_blade weapon-guard draw-deep blade-raise blade-heavy slash-down weapon-low weapon-draw weapon-guard
art_spear_cloud pole-guard pole-draw pole-crouch pole-thrust pole-thrust pole-sweep pole-draw pole-guard
tm_flying_needle needle-hide draw needle-front needle-hide needle-left draw needle-front needle-hide
art_iron_body qi-fist crouch cross qi-round qi-fist palm-double qi-press qi-fist
pr_diamond_body qi-low qi-seal qi-prayer qi-round qi-wide qi-mid qi-press qi-low
qg_broken_bridge guard step-back step-cross step-side step-back step-front step-cross guard
pr_cloud_step guard step-high crouch step-high step-cross kick-far step-tip guard
art_weiqi_trap stone-think step-back stone-think stone-drop qi-low stone-left qi-seal stone-think
art_bridge_step guard step-front crouch shoulder step-cross shoulder step-back guard
art_tomb_sword weapon-low step-side parry stab-high slash-up weapon-draw step-back weapon-low
art_nine_shadow crouch step-cross step-side shoulder step-cross step-wide step-tip crouch
art_cold_palm guard step-back palm-up palm-front palm-front palm-turn palm-low guard
art_moon_sword weapon-low step-cross weapon-draw slash-level slash-up parry step-back weapon-low
art_silk_hand qi-round palm-cross palm-circle palm-double palm-turn qi-round qi-mid qi-round
art_hook_silk weapon-guard parry hook-out hook-out hook-pull step-back weapon-low weapon-guard
art_meteor_palm guard palm-up palm-front palm-ground palm-up palm-double palm-low guard
art_shadow_needle needle-hide crouch draw needle-front needle-hide step-back needle-hide guard
art_staff_iron pole-guard pole-up pole-draw pole-sweep pole-sweep pole-up pole-draw pole-guard
art_whip_silk weapon-low draw whip-back whip-cast slash-level whip-back hook-pull weapon-low
art_bow_star weapon-guard bow-raise bow-draw bow-release bow-release bow-raise weapon-low weapon-guard
art_sand_palm palm-low step-front palm-cover palm-back palm-front step-back palm-low guard
jy_ash_manual guard stagger-left draw backfist elbow punch-short stagger-right guard
art_heavy_halberd pole-guard pole-up pole-wide pole-sweep blade-heavy pole-draw step-back pole-guard
qy_cloud_sword weapon-guard step-front weapon-draw stab stab weapon-draw step-back weapon-guard
qy_mist_step guard step-side finger-lock finger finger-high step-cross finger guard
qy_piercing_needle weapon-low crouch weapon-draw stab-high stab-high weapon-low step-back weapon-guard
qy_sky_intent weapon-guard parry stab-high stab step-cross stab-low slash-up weapon-guard
td_open_blade weapon-guard step-wide blade-raise slash-down blade-heavy weapon-low step-back weapon-guard
td_wind_slash weapon-low step-side weapon-draw slash-level slash-level parry step-back weapon-low
td_thunder_combo weapon-guard blade-raise blade-raise blade-heavy slash-down weapon-low blade-settle weapon-guard
td_no_return weapon-low draw-deep blade-raise blade-heavy blade-heavy slash-down step-back weapon-low
em_soft_palm qi-round palm-cross palm-circle palm-front palm-turn palm-back qi-round guard
em_silk_wrap guard palm-cross finger-lock finger finger-pull palm-turn qi-round guard
em_golden_palm guard palm-low palm-up palm-turn palm-front palm-double qi-mid guard
sl_weituo pole-guard pole-up pole-draw pole-thrust pole-draw pole-sweep pole-up pole-guard
wd_sword_form weapon-guard parry step-side stab-high slash-level parry step-cross weapon-guard
wd_tai_push qi-round palm-cross palm-circle palm-double palm-double qi-round palm-low qi-round
wd_wuji_sword weapon-guard weapon-high parry stab slash-up stab-high parry weapon-guard
tm_poison_dart needle-hide step-back throw-high throw-release throw-low needle-hide step-side guard
tm_thousand_mech guard needle-hide needle-front needle-left needle-front needle-left qi-seal guard
mj_blood_palm palm-low draw-deep palm-up palm-front finger-pull palm-turn palm-low guard
mj_soul_drain guard step-front finger-lock finger finger-lock finger-pull step-back guard
mj_asura_slash weapon-low crouch weapon-draw slash-up slash-level slash-down weapon-low weapon-guard
hs_pine_sword weapon-guard weapon-high draw stab-high stab-high weapon-draw step-back weapon-guard
hs_cloud_step weapon-guard step-high stab-high step-cross stab-low step-high stab weapon-guard
hs_split_peak weapon-guard step-front weapon-high slash-down slash-down blade-heavy weapon-low weapon-guard
art_drunken_fist guard stagger-left stagger-right backfist stagger-left elbow stagger-right guard
th_finger_flick guard qi-seal finger-lock finger finger-pull qi-low step-back guard
th_flute_sword flute-guard step-side flute-guard flute-point slash-level flute-guard step-back flute-guard
th_falling_petals qi-round palm-cover palm-turn palm-front palm-back palm-double palm-circle qi-round
wg_embroidery_needle needle-hide qi-seal finger-pull needle-front needle-left needle-hide step-back needle-hide
wg_yin_soft_palm qi-round palm-low palm-back palm-turn palm-front palm-circle qi-low guard
art_poetry_sword weapon-low weapon-draw parry slash-up slash-level stab-low weapon-draw weapon-low
art_heretic_scripture crouch step-front draw-deep punch-short elbow finger-pull step-back crouch
pr_blood_lotus weapon-low step-cross slash-up slash-level step-cross slash-down hook-pull weapon-low
pr_crimson_moon weapon-low weapon-draw step-cross slash-up stab-high weapon-draw slash-level weapon-low
pr_nine_chain qi-round palm-cross palm-front palm-double palm-turn palm-front palm-double qi-round
pr_heaven_spear pole-guard pole-crouch pole-up pole-thrust pole-thrust pole-sweep pole-draw pole-guard
pr_soul_lock guard finger-lock qi-seal finger finger finger-lock finger-pull guard
pr_mist_blind qi-round palm-cover palm-cross palm-back palm-front palm-circle step-side qi-round
pr_vajra_palm guard step-wide palm-up palm-double palm-double palm-circle qi-round guard
pr_floating_blade weapon-low step-side weapon-draw slash-level step-cross slash-down weapon-low weapon-guard
pr_star_fall needle-hide throw-high throw-release throw-low needle-left throw-high needle-hide guard
基礎吐納 qi-low qi-low qi-mid qi-low qi-mid qi-press qi-low qi-low
art_lake_breath qi-low qi-mid qi-round qi-wide qi-wide qi-round qi-mid qi-low
art_void_breath qi-low qi-round qi-low qi-mid qi-round qi-mid qi-low qi-low
art_tiger_breath qi-fist crouch qi-fist qi-wide qi-fist qi-press qi-mid qi-fist
art_spring_well qi-low crouch qi-press qi-low qi-mid qi-high qi-mid qi-low
art_mirror_breath qi-mid qi-round qi-mid qi-wide qi-round qi-mid qi-prayer qi-mid
em_heart_breath qi-mid qi-prayer qi-round qi-low qi-mid qi-round qi-prayer qi-mid
sl_iron_shirt qi-fist cross crouch qi-fist qi-wide cross qi-press qi-fist
sl_yijin qi-low qi-round qi-high qi-wide qi-high qi-round qi-press qi-low
wd_pure_yang qi-low qi-mid qi-round qi-wide qi-mid qi-prayer qi-low qi-low
mj_devil_breath qi-fist crouch qi-low qi-fist qi-wide qi-press qi-fist qi-fist
hs_yue_breath qi-low qi-high qi-high qi-round qi-mid qi-prayer qi-low qi-low
th_qimen_array qi-low qi-invert qi-wide qi-alternate qi-round qi-high qi-mid qi-low
wg_root_severed_creed qi-prayer qi-prayer qi-mid qi-press qi-wide qi-press qi-low qi-prayer
art_guqin_song qi-low qi-string-left qi-string-right qi-string-left qi-string-right qi-mid qi-low qi-low
art_buddha_heart qi-prayer qi-mid qi-round qi-wide qi-round qi-mid qi-prayer qi-prayer
art_dao_breath qi-low qi-invert qi-round qi-alternate qi-round qi-invert qi-low qi-low
pr_blood_sea qi-low qi-fist qi-mid qi-wide qi-wide qi-round qi-press qi-low
pr_thunder_heart qi-mid qi-seal qi-fist qi-mid qi-fist qi-wide qi-press qi-mid
pr_seal_meridian qi-low qi-seal qi-prayer qi-mid qi-round qi-wide qi-mid qi-low
pr_void_breath qi-low crouch qi-press qi-mid qi-high qi-round qi-low qi-low
qg_snow_track guard step-tip step-front step-tip step-cross step-tip step-back guard
qg_swallow_turn guard step-side step-cross step-wide step-cross step-front step-side guard
qg_feiyan guard crouch step-high kick-far step-front step-high step-tip guard
qg_canopy_void guard step-tip step-high step-tip step-high step-cross step-tip guard
qg_reed_drift guard step-side step-back step-front step-side step-wide step-cross guard
qg_wall_cat crouch step-fold step-high knee step-cross step-fold step-side crouch
qg_lotus_steps guard step-tip step-side step-front step-tip step-cross step-back guard
tm_shadow_step crouch step-side step-fold step-cross step-back step-side step-tip crouch
wg_silent_step guard crouch step-back step-side step-cross step-back step-tip guard
art_ink_illusion guard step-wide step-side step-cross step-front step-wide step-back guard
pr_shadow_flash crouch step-fold step-side step-cross step-fold step-back step-side crouch
pr_tide_step guard step-front step-front step-back step-cross step-front step-back guard
'''
def main():
 rows={}
 for line in ROWS.strip().splitlines():
  id,*tokens=line.split();assert len(tokens)==8,(id,tokens);assert id not in rows;assert all(t in P for t in tokens);rows[id]=tokens
 ids=json.loads((ROOT/'production/qa/evidence/redesign/independent-animations/coverage.json').read_text())['rows'];assert set(rows)=={d['id']for d in ids},({'missing':{d['id']for d in ids}-set(rows),'extra':set(rows)-{d['id']for d in ids}})
 sequences=[tuple(z)for z in rows.values()];assert len(set(sequences))==len(sequences),'整段動作不得重複'
 result={'schema':1,'designHeight':1533,'poses':P,'clips':{d['id']:{'name':d['name'],'kind':d['kind'],'family':d['family'],'poses':rows[d['id']],'direction':d['direction'][1],'sourceBody':'同一所選面孔／衣著；獨立關鍵姿勢序列'}for d in ids}}
 (ART/'motions.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('AUTHORED_MOTIONS',len(rows),'POSE_VOCABULARY',len(P))
if __name__=='__main__':main()
