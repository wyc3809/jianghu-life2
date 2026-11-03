/** 用同一官方Runtime取得真材質點，供Python檢查輸出圖集的頭胸像素連通。 */
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('design/art/spine-character/runtime/review.html','utf8'),context=vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const rt=context.spine,json=JSON.parse(fs.readFileSync('design/art/spine-character/production/character.json','utf8'));
const data=new rt.SkeletonJson({newMeshAttachment:(_s,name)=>new rt.MeshAttachment(name)}).readSkeletonData(json),s=new rt.Skeleton(data);
const c=JSON.parse(fs.readFileSync('src/appearance/spine/catalog.json','utf8')),points={};
for(const name of ['idle','attack','hurt','walk']){
 const clip=c.clips[name],animation=data.findAnimation(name);
 for(let i=0;i<clip.frames;i++){
  s.setToSetupPose();animation.apply(s,0,clip.duration*i/(clip.loop?clip.frames:Math.max(1,clip.frames-1)),false,[],1,rt.MixBlend.setup,rt.MixDirection.mixIn);s.updateWorldTransform(rt.Physics.update);
  const pixel=(bone,x,y)=>[(bone.worldX+bone.a*x+bone.b*y+1024)*.125,(1728-bone.worldY-bone.c*x-bone.d*y)*.125];
  points[clip.start+i]={clip:name,face:pixel(s.findBone('head'),20,55),chest:pixel(s.findBone('chest'),20,-40)};
 }
}
fs.writeFileSync('.local-online/spine-rollout/material-points.json',JSON.stringify(points));
