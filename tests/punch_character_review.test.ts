import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import vm from 'node:vm';

const base='design/art/character-bind-review/punch-v03/';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const rig=read(base+'character.json'),materials=read(base+'materials.json');
const accepted=read('design/art/character-bind-review/upright-v02/character.json');
const context=vm.createContext({});
vm.runInContext(readFileSync('design/art/spine-character/runtime/review.html','utf8').match(/<script>([\s\S]*?)<\/script>/)![1],context);
const sdk=context.spine;

/** 獨立讀實際RGBA PNG，守門唔依賴製作腳本自稱alpha正常。 */
function png(path:string) {
  const bytes=readFileSync(path),chunks:Buffer[]=[];
  let cursor=8,width=0,height=0;
  while(cursor<bytes.length) {
    const length=bytes.readUInt32BE(cursor),type=bytes.toString('ascii',cursor+4,cursor+8),data=bytes.subarray(cursor+8,cursor+8+length);
    if(type==='IHDR') {width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12]!==0)throw Error('只驗8位非交錯RGBA原圖');}
    if(type==='IDAT')chunks.push(data);
    cursor+=length+12;
  }
  const packed=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=new Uint8Array(stride*height);
  const paeth=(a:number,b:number,c:number)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++) {
    const filter=packed[y*(stride+1)];
    for(let x=0;x<stride;x++) {
      const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
      const add=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      if(add===undefined)throw Error('未知PNG filter');
      pixels[y*stride+x]=(packed[y*(stride+1)+1+x]+add)&255;
    }
  }
  return {width,height,pixels,alpha(x:number,y:number){return pixels[(Math.round(y)*width+Math.round(x))*4+3]??0;}};
}
const images=Object.fromEntries(['body','near-arm','far-arm','near-punch'].map(name=>[name,png(base+'images/'+name+'.png')]));
const original=png('design/art/spine-character/sources/master-v01.png');

function make(document=rig) {
  const data=new sdk.SkeletonJson({newMeshAttachment:(_:unknown,name:string)=>new sdk.MeshAttachment(name)}).readSkeletonData(document);
  const skeleton=new sdk.Skeleton(data);
  const sample=(t:number)=>{skeleton.setToSetupPose();data.findAnimation('punch').apply(skeleton,0,t,false,[],1,sdk.MixBlend.setup,sdk.MixDirection.mixIn);skeleton.updateWorldTransform(sdk.Physics.update);return skeleton;};
  return {skeleton,sample};
}
function vertices(s:any,name:string):Float32Array {
  const slot=s.findSlot(name),attachment=slot.attachment,out=new Float32Array(attachment.worldVerticesLength);
  attachment.computeWorldVertices(slot,0,out.length,out,0,2);return out;
}
function area(v:Float32Array,a:number,b:number,c:number) {return ((v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]))*.5;}

describe('已接受站姿之後：單角色短拳，唔代表動畫美術已通過',()=>{
  it('test_punch_骨架等於已接受母版_全段雙腳原地且無獨立縮放',()=>{
    expect(rig.bones).toEqual(accepted.bones);
    const {sample}=make(),s=sample(0),feet=['near-foot','far-foot'].map(name=>{const b=s.findBone(name);return [name,b.worldX,b.worldY,b.rotation] as const;});
    for(let frame=0;frame<=192;frame++) {
      sample(frame/120);
      for(const[name,x,y,angle]of feet) {const b=s.findBone(name);expect(b.worldX).toBeCloseTo(x,5);expect(b.worldY).toBeCloseTo(y,5);expect(b.rotation).toBe(angle);}
      for(const b of s.bones) {expect(b.scaleX).toBe(1);expect(b.scaleY).toBe(1);expect(Number.isFinite(b.worldX)&&Number.isFinite(b.worldY)).toBe(true);}
      for(const side of ['near','far'])for(const pair of [['upper-arm','lower-arm'],['lower-arm','hand']]) {
        const a=s.findBone(side+'-'+pair[0]),b=s.findBone(side+'-'+pair[1]);
        expect(Math.hypot(b.worldX-a.worldX,b.worldY-a.worldY)).toBeCloseTo(a.data.length,3);
      }
      expect(s.findBone('near-lower-arm').rotation).toBeGreaterThan(5);
      expect(s.findBone('near-lower-arm').rotation).toBeLessThan(65);
    }
  });

  it('test_punch_Spine42絕對曲線_接觸達到真角度且停留不抖',()=>{
    const {sample}=make();
    for(const t of [.52,.54,.56,.579]) {
      const s=sample(t);
      expect(s.findBone('near-upper-arm').rotation).toBeCloseTo(-5,3);
      expect(s.findBone('near-lower-arm').rotation).toBeCloseTo(10,3);
      expect(s.findSlot('near-arm').color.a).toBe(1);expect(s.findSlot('near-punch').color.a).toBe(1);
    }
    const wrong=structuredClone(rig);
    for(const track of Object.values(wrong.animations.punch.bones) as any[]) for(const frame of track.rotate)if(frame.curve)frame.curve=[.3,0,.6,1];
    expect(Math.abs(make(wrong).sample(.52).findBone('near-upper-arm').rotation+5)).toBeGreaterThan(20);
  });

  it('test_punch_頭頸及雙腳保留原可見像素_沒有整幅圖拉手',()=>{
    const body=images.body;
    let maximumDifference=0,checked=0;
    for(const [x0,y0,x1,y1]of [[400,80,620,300],[290,1000,780,1530]]) {
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(original.alpha(x,y)>200) {
        const i=(y*body.width+x)*4;
        for(let c=0;c<4;c++)maximumDifference=Math.max(maximumDifference,Math.abs(body.pixels[i+c]-original.pixels[i+c]));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100_000);expect(maximumDifference).toBe(0);
    expect(rig.slots.map((s:{name:string})=>s.name)).toEqual(['far-arm','body','near-arm','near-punch']);
    const tracks=rig.animations.punch.bones;
    expect(tracks.hip).toBeUndefined();expect(tracks['near-foot']).toBeUndefined();
  });

  it('test_punch_肩根及頸面真材質連續_清斷手腕的負例會被攔截',()=>{
    for(const side of ['near','far']) {
      const image=images[side+'-arm'],origin=materials.origins[side+'-arm'];
      const root=side==='near'?[360,385]:[647,398],wrist=side==='near'?[335,756]:[725,758],fist=side==='near'?[350,814]:[724,814];
      expect(images.body.alpha(...root as [number,number])).toBeGreaterThan(200);
      const points=[root,wrist,fist].map(([x,y])=>[x-origin[0],y-origin[1]]);
      for(const[x,y]of points)expect(image.alpha(x,y),side+' 真腕／拳頭材質').toBeGreaterThan(180);
      const connected=(cut=false)=>{
        const [x0,y0]=points[0].map(Math.round),target=points[2].map(Math.round),seen=new Uint8Array(image.width*image.height),queue=[y0*image.width+x0];seen[queue[0]]=1;
        for(let i=0;i<queue.length;i++) {const p=queue[i],x=p%image.width,y=Math.floor(p/image.width);if(x===target[0]&&y===target[1])return true;for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*image.width+nx;if(nx<0||ny<0||nx>=image.width||ny>=image.height||seen[n]||image.alpha(nx,ny)<128||cut&&Math.abs(ny-points[1][1])<8)continue;seen[n]=1;queue.push(n);}}
        return false;
      };
      expect(connected()).toBe(true);expect(connected(true)).toBe(false);
    }
    for(let y=246;y<=360;y+=2)expect(images.body.alpha(538,y)).toBeGreaterThan(200);
  });

  it('test_punch_120Hz真材質三角形_全段無翻面且護腕無過度拉伸',()=>{
    const {sample}=make(),s=sample(0);
    const records=['near-arm','far-arm','near-punch'].map(name=>{
      sample(name==='near-punch'?.52:0);
      const attachment=s.findSlot(name).attachment,uv=attachment.regionUVs,tri=attachment.triangles,rest=vertices(s,name),image=images[name],visible:number[][]=[];
      for(let i=0;i<tri.length;i+=3) {const[a,b,c]=[tri[i],tri[i+1],tri[i+2]],x=(uv[a*2]+uv[b*2]+uv[c*2])/3*image.width,y=(uv[a*2+1]+uv[b*2+1]+uv[c*2+1])/3*image.height;if(image.alpha(x,y)>180)visible.push([a,b,c,area(rest,a,b,c)]);}
      expect(visible.length).toBeGreaterThan(100);return {name,visible};
    });
    let minimum={ratio:Infinity,frame:0,name:''},maximum={ratio:-Infinity,frame:0,name:''},smallestFacing=Infinity;
    for(let frame=0;frame<=192;frame++) {
      sample(frame/120);
      for(const record of records) {
        if(record.name==='near-punch'&&s.findSlot(record.name).color.a<.05)continue;
        const v=vertices(s,record.name),attachment=s.findSlot(record.name).attachment,uv=attachment.regionUVs;
        for(const[a,b,c,rest]of record.visible) {
          const ratio=area(v,a,b,c)/rest;smallestFacing=Math.min(smallestFacing,ratio);
          // 肩袖用已補畫姿勢作投影修形，輪廓本來會改；護腕係固定人體段，保留原拉伸門檻。
          const sourceY=record.name==='near-arm'?(uv[a*2+1]+uv[b*2+1]+uv[c*2+1])/3*images['near-arm'].height+materials.origins['near-arm'][1]:0;
          if(record.name!=='far-arm'&&!(record.name==='near-arm'&&sourceY>=650&&sourceY<=740))continue;
          if(ratio<minimum.ratio)minimum={ratio,frame,name:record.name};if(ratio>maximum.ratio)maximum={ratio,frame,name:record.name};
        }
      }
    }
    expect(minimum.ratio,JSON.stringify(minimum)).toBeGreaterThan(.65);
    expect(maximum.ratio,JSON.stringify(maximum)).toBeLessThan(1.45);
    expect(smallestFacing).toBeGreaterThan(0);
  });

  it('test_punch_修形共用真輪廓且實心_中途沒有半透明雙手或關節白縫',()=>{
    const {sample}=make(),chart=materials.armChart;
    const names=['near-upper-arm','near-lower-arm','near-hand'];
    for(let frame=0;frame<=192;frame++) {
      const s=sample(frame/120),a=vertices(s,'near-arm'),b=vertices(s,'near-punch');
      expect(a).toEqual(b);
      expect(s.findSlot('near-arm').color.a).toBe(1);
      for(let i=0;i<3;i++) {
        const row=chart.rowPositions.indexOf(chart.jointRows[i]),vertex=row*chart.columns+4,bone=s.findBone(names[i]);
        expect(Math.hypot(a[vertex*2]-bone.worldX,a[vertex*2+1]-bone.worldY)).toBeLessThan(.001);
        const opacity=(name:string)=>{const attachment=s.findSlot(name).attachment,uv=attachment.regionUVs,image=images[name];return image.alpha(uv[vertex*2]*image.width,uv[vertex*2+1]*image.height)/255*s.findSlot(name).color.a;};
        expect(1-(1-opacity('near-arm'))*(1-opacity('near-punch'))).toBeGreaterThan(.98);
      }
    }
    const broken=structuredClone(rig);broken.skins[0].attachments['near-punch']['near-punch'].vertices[2]+=30;
    const bad=make(broken).sample(.467);expect(vertices(bad,'near-arm')).not.toEqual(vertices(bad,'near-punch'));
  });

  it('test_punch_收招及重播回原站姿_同幀輸出完全一致',()=>{
    const {sample}=make(),s=sample(0),before=vertices(s,'near-arm');
    sample(.52);expect(vertices(s,'near-arm')).not.toEqual(before);
    sample(1.6);expect(vertices(s,'near-arm')).toEqual(before);
    for(let i=0;i<10;i++){sample(.52);sample(0);expect(vertices(s,'near-arm')).toEqual(before);}
    expect(Object.keys(rig.animations)).toEqual(['stand','punch']);
  });
});
