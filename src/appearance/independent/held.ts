import type { MotionFrame, PreparedProp } from './types';
export interface HeldPoint{x:number;y:number}
/** 柔鞭用原畫分段沿有界曲線連接，根握點不動；不加入另一個物理時計。 */
export function whipPoints(grip:number[],height:number,time:number,contact:number,duration:number,attack:boolean):HeldPoint[]{
  const tension=attack?Math.max(0,1-Math.abs(time-contact)/Math.max(.1,duration*.48)):0,angle=grip[2],length=height*.8,n=14,out=[{x:grip[0],y:grip[1]}];
  for(let i=0;i<n;i++){const u=(i+.5)/n,hang=Math.PI*.5+.6*Math.sin(u*4.4),swing=angle+.34*Math.sin(u*5-time*9)*(1-u),a=hang+(Math.atan2(Math.sin(swing-hang),Math.cos(swing-hang)))*tension;out.push({x:out[i].x+Math.cos(a)*length/n,y:out[i].y+Math.sin(a)*length/n});}return out;
}
/** 弓弦兩端在原畫弓梢，弦心使用同幀副手握點。 */
export function bowPoints(p:PreparedProp,f:MotionFrame,height:number,draw:boolean):HeldPoint[]{
  const d=p.def,scale=height*.42/Math.hypot(d.tip[0]-d.grip[0],d.tip[1]-d.grip[1]),a=f.grip[2],flip=d.flipX??-1;
  const point=(x:number,y:number)=>{x=(x-d.grip[0])*scale*flip;y=(y-d.grip[1])*scale;return{x:f.grip[0]+x*Math.cos(a)-y*Math.sin(a),y:f.grip[1]+x*Math.sin(a)+y*Math.cos(a)}};
  const top=point(86,8),bottom=point(86,749);return[top,draw?{x:f.farGrip[0],y:f.farGrip[1]}:{x:(top.x+bottom.x)*.5,y:(top.y+bottom.y)*.5},bottom];
}
/** 原弦紋理連接同幀弓梢及拉弦手，不另起動畫時計。 */
export function bitmapCord(ctx:CanvasRenderingContext2D,p:PreparedProp,a:HeldPoint,b:HeldPoint){const dx=b.x-a.x,dy=b.y-a.y;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);ctx.drawImage(p.image,0,0,p.def.w,p.def.h,-.65,0,1.3,Math.hypot(dx,dy));ctx.restore();}
/** 沿固定鏈長曲線拼接原鞭紋理，不伸長或拆散端點。 */
export function bitmapWhip(ctx:CanvasRenderingContext2D,p:PreparedProp,points:HeldPoint[]){const d=p.def,n=points.length-1,ratio=Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)*n/(d.tip[1]-d.grip[1]);for(let i=0;i<n;i++){const a=points[i],b=points[i+1],sy=d.grip[1]+i*(d.tip[1]-d.grip[1])/n,sh=(d.tip[1]-d.grip[1])/n+2;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);ctx.drawImage(p.image,0,sy,d.w,Math.min(sh,d.h-sy),-d.grip[0]*ratio,-ratio,d.w*ratio,Math.hypot(b.x-a.x,b.y-a.y)+2*ratio);ctx.restore();}}
