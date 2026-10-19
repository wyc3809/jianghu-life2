async (options = {}) => {
 const app=await(await fetch('/src/App.tsx')).text();const url=app.match(/from ["']([^"']*store\/lifeStore\.ts[^"']*)["']/)[1];
 const {useLifeStore}=await import(url);const{useAncestryStore}=await import('/src/store/ancestryStore.ts');
 const{createNewLife}=await import('/core/life/gameState.ts');const{emptyAncestry}=await import('/core/life/ancestry.ts');
 const{FAMILY_MILESTONES}=await import('/data/ancestry/milestones.ts');const{ACHIEVEMENT_RULES}=await import('/core/life/achievements.ts');
 const{SKILL_DEFS}=await import('/data/skills/catalog.ts');const g=await import('/core/life/gacha.ts');const pools=await import('/core/life/schoolGachaPools.ts');
 const s=createNewLife({seed:42,name:'沈雲舟',skipCoach:true});s.character.flags.newbie_done=true;s.character.flags.coach_done=true;s.pending=null;s.tab='jianghu';
 const m=emptyAncestry();m.jade=options.jade??{free:600,paidTest:600};m.milestones=FAMILY_MILESTONES.map(x=>x.id);m.jadeAchv=ACHIEVEMENT_RULES.map(x=>x.id);
 m.gacha={pulls:0,banners:{}};
 if(options.owned)m.manuals=Object.fromEntries(Object.values(SKILL_DEFS).map(d=>[d.id,{stars:0,copies:0,vols:[1,2,3,4,5,6,7]}]));
 const banner=options.banner??'jianghu';
 if(options.wish){const ids=g.wishPool(banner,m);g.setWish(m,banner,ids[0]);g.bannerState(m,banner).sinceWish=39;}
 if(options.premium&&!options.wish){
  for(let i=0;i<100;i++){const probe=structuredClone(m);probe.gacha.pulls=i;const result=g.pull(probe,banner,options.n??1);if(result?.some(r=>r.isPremium)){m.gacha.pulls=i;break;}}
 }
 useLifeStore.setState({state:s,lastResult:null,combatReplay:null});useAncestryStore.setState({meta:m,lastPull:null,lastPullSource:null,jadeToast:0,milestoneToast:[]});
 window.qa={life:useLifeStore,anc:useAncestryStore,g,pools};
 return {banner,pool:pools.activeSchoolGachaPool(m,banner),meta:structuredClone(m)};
}
