/** 用官方Runtime獨立核對實際出幀時間嘅袖面、腕點及數值，唔只讀製作器報告。 */
import fs from 'node:fs';
import vm from 'node:vm';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(`${root}/${p}`,'utf8'));
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(`${root}/design/art/spine-character/runtime/review.html`,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],context);
const sdk=context.spine,clips=read('design/art/independent-animation/compiled-clips.json'),materials=read('design/art/independent-animation/materials.json');
const area=(v,a,b,c)=>((v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]))*.5;
const vertices=(s,name)=>{const slot=s.findSlot(name),a=slot.attachment,v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,v.length,v,0,2);return v;};
const rows=[];
for(const outfit of ['traveller','scholar','cloak']) {
 const folder=`.local-online/full-martial-motion/${outfit}`,rig=read(folder+'/rig.json');
 const data=new sdk.SkeletonJson({newMeshAttachment:(_,name)=>new sdk.MeshAttachment(name)}).readSkeletonData(rig),s=new sdk.Skeleton(data);
 s.updateWorldTransform(sdk.Physics.update);
 const names=outfit==='traveller'?['near-arm','far-arm','near-punch']:['near-arm','far-arm'],baseline={};
 for(const name of names) {
  const a=s.findSlot(name).attachment,source=rig.skins[0].attachments[name][name],uv=source.uvs.map((v,i)=>v*(i%2?source.height:source.width));
  // UV向下、世界向上；以真材質方向作基準，不能以本身可能已翻面嘅舊setup網格作合格標準。
  baseline[name]=Array.from({length:a.triangles.length/3},(_,i)=>-area(uv,...a.triangles.slice(i*3,i*3+3)));
 }
 let samples=0,maxWristError=0,worst={ratio:Infinity};
 for(const[id,clip]of Object.entries(clips)) {
  data.animations=[];
  new sdk.SkeletonJson({}).readAnimation(read(folder+'/clips/'+id+'.json'),id,data);
  for(const t of clip.sampleTimes) {
   s.setToSetupPose();data.findAnimation(id).apply(s,0,t,false,[],1,sdk.MixBlend.setup,sdk.MixDirection.mixIn);s.updateWorldTransform(sdk.Physics.update);
   for(const name of names) {
    const slot=s.findSlot(name),a=slot.attachment;
    if(slot.color.a<.01)continue;
    const v=vertices(s,name);
    if(!v.every(Number.isFinite))throw Error('非有限材質座標 '+outfit+' '+id+' '+t);
    for(let i=0;i<a.triangles.length;i+=3) {
     const rest=baseline[name][i/3];if(Math.abs(rest)<.1)continue;
     const ratio=area(v,...a.triangles.slice(i,i+3))/rest;
     if(ratio<worst.ratio)worst={id,t,name,triangle:i/3,ratio};
    }
   }
   for(const side of ['near','far']) {
    const chart=materials.armCharts[outfit][side],row=chart.sourceY.findIndex(y=>Math.abs(y-chart.jointY[2])<.00001);
    if(row<0)throw Error('缺真腕截面 '+outfit+' '+side);
    const v=vertices(s,side+'-arm'),i=(row*chart.columns+Math.floor(chart.columns/2))*2,b=s.findBone(side+'-hand');
    maxWristError=Math.max(maxWristError,Math.hypot(v[i]-b.worldX,v[i+1]-b.worldY));
   }
   samples++;
  }
 }
 if(worst.ratio<-.001||maxWristError>.02)throw Error(JSON.stringify({outfit,worst,maxWristError}));
 rows.push({outfit,samples,maxWristError,worst});
 console.log('SURFACE_PASS',outfit,samples,maxWristError,worst.ratio);
}
fs.writeFileSync(`${root}/production/qa/evidence/redesign/character-bind-rollout/surfaces.json`,JSON.stringify({officialRuntime:'4.2.120',rows,actualIphone:false},null,2)+'\n');
