var Cd=Object.defineProperty;var Pd=(r,t,e)=>t in r?Cd(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var Vt=(r,t,e)=>Pd(r,typeof t!="symbol"?t+"":t,e);import{g as oe,h as Ld,j as Rt}from"./vendor-bjXL5PPy.js";import{O as wa,h as is,i as Lh,G as Yn,t as Dd,s as tu,a as Id}from"./index-BpjE218l.js";function ui(r){if(r===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return r}function Dh(r,t){r.prototype=Object.create(t.prototype),r.prototype.constructor=r,r.__proto__=t}/*!
 * GSAP 3.15.0
 * https://gsap.com
 *
 * @license Copyright 2008-2026, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/var gn={autoSleep:120,force3D:"auto",nullTargetWarn:1,units:{lineHeight:""}},Es={duration:.5,overwrite:!1,delay:0},Ql,Ve,Se,An=1e8,_e=1/An,Zo=Math.PI*2,Nd=Zo/4,Ud=0,Ih=Math.sqrt,Fd=Math.cos,Od=Math.sin,ze=function(t){return typeof t=="string"},Re=function(t){return typeof t=="function"},_i=function(t){return typeof t=="number"},jl=function(t){return typeof t>"u"},ii=function(t){return typeof t=="object"},nn=function(t){return t!==!1},tc=function(){return typeof window<"u"},Xs=function(t){return Re(t)||ze(t)},Nh=typeof ArrayBuffer=="function"&&ArrayBuffer.isView||function(){},Ke=Array.isArray,Bd=/random\([^)]+\)/g,zd=/,\s*/g,eu=/(?:-?\.?\d|\.)+/gi,Uh=/[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g,Nr=/[-+=.]*\d+[.e-]*\d*[a-z%]*/g,ja=/[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi,Fh=/[+-]=-?[.\d]+/,kd=/[^,'"\[\]\s]+/gi,Gd=/^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i,be,Zn,Ko,ec,vn={},Aa={},Oh,Bh=function(t){return(Aa=Wr(t,vn))&&ln},nc=function(t,e){return console.warn("Invalid property",t,"set to",e,"Missing plugin? gsap.registerPlugin()")},ws=function(t,e){return!e&&console.warn(t)},zh=function(t,e){return t&&(vn[t]=e)&&Aa&&(Aa[t]=e)||vn},As=function(){return 0},Vd={suppressEvents:!0,isStart:!0,kill:!1},ga={suppressEvents:!0,kill:!1},Hd={suppressEvents:!0},ic={},Ui=[],$o={},kh,hn={},to={},nu=30,xa=[],rc="",sc=function(t){var e=t[0],n,i;if(ii(e)||Re(e)||(t=[t]),!(n=(e._gsap||{}).harness)){for(i=xa.length;i--&&!xa[i].targetTest(e););n=xa[i]}for(i=t.length;i--;)t[i]&&(t[i]._gsap||(t[i]._gsap=new cf(t[i],n)))||t.splice(i,1);return t},er=function(t){return t._gsap||sc(Rn(t))[0]._gsap},Gh=function(t,e,n){return(n=t[e])&&Re(n)?t[e]():jl(n)&&t.getAttribute&&t.getAttribute(e)||n},rn=function(t,e){return(t=t.split(",")).forEach(e)||t},Pe=function(t){return Math.round(t*1e5)/1e5||0},ye=function(t){return Math.round(t*1e7)/1e7||0},Br=function(t,e){var n=e.charAt(0),i=parseFloat(e.substr(2));return t=parseFloat(t),n==="+"?t+i:n==="-"?t-i:n==="*"?t*i:t/i},Wd=function(t,e){for(var n=e.length,i=0;t.indexOf(e[i])<0&&++i<n;);return i<n},Ra=function(){var t=Ui.length,e=Ui.slice(0),n,i;for($o={},Ui.length=0,n=0;n<t;n++)i=e[n],i&&i._lazy&&(i.render(i._lazy[0],i._lazy[1],!0)._lazy=0)},ac=function(t){return!!(t._initted||t._startAt||t.add)},Vh=function(t,e,n,i){Ui.length&&!Ve&&Ra(),t.render(e,n,!!(Ve&&e<0&&ac(t))),Ui.length&&!Ve&&Ra()},Hh=function(t){var e=parseFloat(t);return(e||e===0)&&(t+"").match(kd).length<2?e:ze(t)?t.trim():t},Wh=function(t){return t},Mn=function(t,e){for(var n in e)n in t||(t[n]=e[n]);return t},Xd=function(t){return function(e,n){for(var i in n)i in e||i==="duration"&&t||i==="ease"||(e[i]=n[i])}},Wr=function(t,e){for(var n in e)t[n]=e[n];return t},iu=function r(t,e){for(var n in e)n!=="__proto__"&&n!=="constructor"&&n!=="prototype"&&(t[n]=ii(e[n])?r(t[n]||(t[n]={}),e[n]):e[n]);return t},Ca=function(t,e){var n={},i;for(i in t)i in e||(n[i]=t[i]);return n},gs=function(t){var e=t.parent||be,n=t.keyframes?Xd(Ke(t.keyframes)):Mn;if(nn(t.inherit))for(;e;)n(t,e.vars.defaults),e=e.parent||e._dp;return t},qd=function(t,e){for(var n=t.length,i=n===e.length;i&&n--&&t[n]===e[n];);return n<0},Xh=function(t,e,n,i,s){var a=t[i],o;if(s)for(o=e[s];a&&a[s]>o;)a=a._prev;return a?(e._next=a._next,a._next=e):(e._next=t[n],t[n]=e),e._next?e._next._prev=e:t[i]=e,e._prev=a,e.parent=e._dp=t,e},Ha=function(t,e,n,i){n===void 0&&(n="_first"),i===void 0&&(i="_last");var s=e._prev,a=e._next;s?s._next=a:t[n]===e&&(t[n]=a),a?a._prev=s:t[i]===e&&(t[i]=s),e._next=e._prev=e.parent=null},Oi=function(t,e){t.parent&&(!e||t.parent.autoRemoveChildren)&&t.parent.remove&&t.parent.remove(t),t._act=0},nr=function(t,e){if(t&&(!e||e._end>t._dur||e._start<0))for(var n=t;n;)n._dirty=1,n=n.parent;return t},Yd=function(t){for(var e=t.parent;e&&e.parent;)e._dirty=1,e.totalDuration(),e=e.parent;return t},Jo=function(t,e,n,i){return t._startAt&&(Ve?t._startAt.revert(ga):t.vars.immediateRender&&!t.vars.autoRevert||t._startAt.render(e,!0,i))},Zd=function r(t){return!t||t._ts&&r(t.parent)},ru=function(t){return t._repeat?Xr(t._tTime,t=t.duration()+t._rDelay)*t:0},Xr=function(t,e){var n=Math.floor(t=ye(t/e));return t&&n===t?n-1:n},Pa=function(t,e){return(t-e._start)*e._ts+(e._ts>=0?0:e._dirty?e.totalDuration():e._tDur)},Wa=function(t){return t._end=ye(t._start+(t._tDur/Math.abs(t._ts||t._rts||_e)||0))},Xa=function(t,e){var n=t._dp;return n&&n.smoothChildTiming&&t._ts&&(t._start=ye(n._time-(t._ts>0?e/t._ts:((t._dirty?t.totalDuration():t._tDur)-e)/-t._ts)),Wa(t),n._dirty||nr(n,t)),t},qh=function(t,e){var n;if((e._time||!e._dur&&e._initted||e._start<t._time&&(e._dur||!e.add))&&(n=Pa(t.rawTime(),e),(!e._dur||Gs(0,e.totalDuration(),n)-e._tTime>_e)&&e.render(n,!0)),nr(t,e)._dp&&t._initted&&t._time>=t._dur&&t._ts){if(t._dur<t.duration())for(n=t;n._dp;)n.rawTime()>=0&&n.totalTime(n._tTime),n=n._dp;t._zTime=-_e}},$n=function(t,e,n,i){return e.parent&&Oi(e),e._start=ye((_i(n)?n:n||t!==be?Tn(t,n,e):t._time)+e._delay),e._end=ye(e._start+(e.totalDuration()/Math.abs(e.timeScale())||0)),Xh(t,e,"_first","_last",t._sort?"_start":0),Qo(e)||(t._recent=e),i||qh(t,e),t._ts<0&&Xa(t,t._tTime),t},Yh=function(t,e){return(vn.ScrollTrigger||nc("scrollTrigger",e))&&vn.ScrollTrigger.create(e,t)},Zh=function(t,e,n,i,s){if(lc(t,e,s),!t._initted)return 1;if(!n&&t._pt&&!Ve&&(t._dur&&t.vars.lazy!==!1||!t._dur&&t.vars.lazy)&&kh!==dn.frame)return Ui.push(t),t._lazy=[s,i],1},Kd=function r(t){var e=t.parent;return e&&e._ts&&e._initted&&!e._lock&&(e.rawTime()<0||r(e))},Qo=function(t){var e=t.data;return e==="isFromStart"||e==="isStart"},$d=function(t,e,n,i){var s=t.ratio,a=e<0||!e&&(!t._start&&Kd(t)&&!(!t._initted&&Qo(t))||(t._ts<0||t._dp._ts<0)&&!Qo(t))?0:1,o=t._rDelay,l=0,c,u,f;if(o&&t._repeat&&(l=Gs(0,t._tDur,e),u=Xr(l,o),t._yoyo&&u&1&&(a=1-a),u!==Xr(t._tTime,o)&&(s=1-a,t.vars.repeatRefresh&&t._initted&&t.invalidate())),a!==s||Ve||i||t._zTime===_e||!e&&t._zTime){if(!t._initted&&Zh(t,e,i,n,l))return;for(f=t._zTime,t._zTime=e||(n?_e:0),n||(n=e&&!f),t.ratio=a,t._from&&(a=1-a),t._time=0,t._tTime=l,c=t._pt;c;)c.r(a,c.d),c=c._next;e<0&&Jo(t,e,n,!0),t._onUpdate&&!n&&mn(t,"onUpdate"),l&&t._repeat&&!n&&t.parent&&mn(t,"onRepeat"),(e>=t._tDur||e<0)&&t.ratio===a&&(a&&Oi(t,1),!n&&!Ve&&(mn(t,a?"onComplete":"onReverseComplete",!0),t._prom&&t._prom()))}else t._zTime||(t._zTime=e)},Jd=function(t,e,n){var i;if(n>e)for(i=t._first;i&&i._start<=n;){if(i.data==="isPause"&&i._start>e)return i;i=i._next}else for(i=t._last;i&&i._start>=n;){if(i.data==="isPause"&&i._start<e)return i;i=i._prev}},qr=function(t,e,n,i){var s=t._repeat,a=ye(e)||0,o=t._tTime/t._tDur;return o&&!i&&(t._time*=a/t._dur),t._dur=a,t._tDur=s?s<0?1e10:ye(a*(s+1)+t._rDelay*s):a,o>0&&!i&&Xa(t,t._tTime=t._tDur*o),t.parent&&Wa(t),n||nr(t.parent,t),t},su=function(t){return t instanceof en?nr(t):qr(t,t._dur)},Qd={_start:0,endTime:As,totalDuration:As},Tn=function r(t,e,n){var i=t.labels,s=t._recent||Qd,a=t.duration()>=An?s.endTime(!1):t._dur,o,l,c;return ze(e)&&(isNaN(e)||e in i)?(l=e.charAt(0),c=e.substr(-1)==="%",o=e.indexOf("="),l==="<"||l===">"?(o>=0&&(e=e.replace(/=/,"")),(l==="<"?s._start:s.endTime(s._repeat>=0))+(parseFloat(e.substr(1))||0)*(c?(o<0?s:n).totalDuration()/100:1)):o<0?(e in i||(i[e]=a),i[e]):(l=parseFloat(e.charAt(o-1)+e.substr(o+1)),c&&n&&(l=l/100*(Ke(n)?n[0]:n).totalDuration()),o>1?r(t,e.substr(0,o-1),n)+l:a+l)):e==null?a:+e},xs=function(t,e,n){var i=_i(e[1]),s=(i?2:1)+(t<2?0:1),a=e[s],o,l;if(i&&(a.duration=e[1]),a.parent=n,t){for(o=a,l=n;l&&!("immediateRender"in o);)o=l.vars.defaults||{},l=nn(l.vars.inherit)&&l.parent;a.immediateRender=nn(o.immediateRender),t<2?a.runBackwards=1:a.startAt=e[s-1]}return new Ie(e[0],a,e[s+1])},ki=function(t,e){return t||t===0?e(t):e},Gs=function(t,e,n){return n<t?t:n>e?e:n},Ye=function(t,e){return!ze(t)||!(e=Gd.exec(t))?"":e[1]},jd=function(t,e,n){return ki(n,function(i){return Gs(t,e,i)})},jo=[].slice,Kh=function(t,e){return t&&ii(t)&&"length"in t&&(!e&&!t.length||t.length-1 in t&&ii(t[0]))&&!t.nodeType&&t!==Zn},tp=function(t,e,n){return n===void 0&&(n=[]),t.forEach(function(i){var s;return ze(i)&&!e||Kh(i,1)?(s=n).push.apply(s,Rn(i)):n.push(i)})||n},Rn=function(t,e,n){return Se&&!e&&Se.selector?Se.selector(t):ze(t)&&!n&&(Ko||!Yr())?jo.call((e||ec).querySelectorAll(t),0):Ke(t)?tp(t,n):Kh(t)?jo.call(t,0):t?[t]:[]},tl=function(t){return t=Rn(t)[0]||ws("Invalid scope")||{},function(e){var n=t.current||t.nativeElement||t;return Rn(e,n.querySelectorAll?n:n===t?ws("Invalid scope")||ec.createElement("div"):t)}},$h=function(t){return t.sort(function(){return .5-Math.random()})},Jh=function(t){if(Re(t))return t;var e=ii(t)?t:{each:t},n=ir(e.ease),i=e.from||0,s=parseFloat(e.base)||0,a={},o=i>0&&i<1,l=isNaN(i)||o,c=e.axis,u=i,f=i;return ze(i)?u=f={center:.5,edges:.5,end:1}[i]||0:!o&&l&&(u=i[0],f=i[1]),function(h,d,g){var _=(g||e).length,m=a[_],p,M,T,x,y,E,A,v,b;if(!m){if(b=e.grid==="auto"?0:(e.grid||[1,An])[1],!b){for(A=-An;A<(A=g[b++].getBoundingClientRect().left)&&b<_;);b<_&&b--}for(m=a[_]=[],p=l?Math.min(b,_)*u-.5:i%b,M=b===An?0:l?_*f/b-.5:i/b|0,A=0,v=An,E=0;E<_;E++)T=E%b-p,x=M-(E/b|0),m[E]=y=c?Math.abs(c==="y"?x:T):Ih(T*T+x*x),y>A&&(A=y),y<v&&(v=y);i==="random"&&$h(m),m.max=A-v,m.min=v,m.v=_=(parseFloat(e.amount)||parseFloat(e.each)*(b>_?_-1:c?c==="y"?_/b:b:Math.max(b,_/b))||0)*(i==="edges"?-1:1),m.b=_<0?s-_:s,m.u=Ye(e.amount||e.each)||0,n=n&&_<0?dp(n):n}return _=(m[h]-m.min)/m.max||0,ye(m.b+(n?n(_):_)*m.v)+m.u}},el=function(t){var e=Math.pow(10,((t+"").split(".")[1]||"").length);return function(n){var i=ye(Math.round(parseFloat(n)/t)*t*e);return(i-i%1)/e+(_i(n)?0:Ye(n))}},Qh=function(t,e){var n=Ke(t),i,s;return!n&&ii(t)&&(i=n=t.radius||An,t.values?(t=Rn(t.values),(s=!_i(t[0]))&&(i*=i)):t=el(t.increment)),ki(e,n?Re(t)?function(a){return s=t(a),Math.abs(s-a)<=i?s:a}:function(a){for(var o=parseFloat(s?a.x:a),l=parseFloat(s?a.y:0),c=An,u=0,f=t.length,h,d;f--;)s?(h=t[f].x-o,d=t[f].y-l,h=h*h+d*d):h=Math.abs(t[f]-o),h<c&&(c=h,u=f);return u=!i||c<=i?t[u]:a,s||u===a||_i(a)?u:u+Ye(a)}:el(t))},jh=function(t,e,n,i){return ki(Ke(t)?!e:n===!0?!!(n=0):!i,function(){return Ke(t)?t[~~(Math.random()*t.length)]:(n=n||1e-5)&&(i=n<1?Math.pow(10,(n+"").length-2):1)&&Math.floor(Math.round((t-n/2+Math.random()*(e-t+n*.99))/n)*n*i)/i})},ep=function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];return function(i){return e.reduce(function(s,a){return a(s)},i)}},np=function(t,e){return function(n){return t(parseFloat(n))+(e||Ye(n))}},ip=function(t,e,n){return ef(t,e,0,1,n)},tf=function(t,e,n){return ki(n,function(i){return t[~~e(i)]})},rp=function r(t,e,n){var i=e-t;return Ke(t)?tf(t,r(0,t.length),e):ki(n,function(s){return(i+(s-t)%i)%i+t})},sp=function r(t,e,n){var i=e-t,s=i*2;return Ke(t)?tf(t,r(0,t.length-1),e):ki(n,function(a){return a=(s+(a-t)%s)%s||0,t+(a>i?s-a:a)})},Rs=function(t){return t.replace(Bd,function(e){var n=e.indexOf("[")+1,i=e.substring(n||7,n?e.indexOf("]"):e.length-1).split(zd);return jh(n?i:+i[0],n?0:+i[1],+i[2]||1e-5)})},ef=function(t,e,n,i,s){var a=e-t,o=i-n;return ki(s,function(l){return n+((l-t)/a*o||0)})},ap=function r(t,e,n,i){var s=isNaN(t+e)?0:function(d){return(1-d)*t+d*e};if(!s){var a=ze(t),o={},l,c,u,f,h;if(n===!0&&(i=1)&&(n=null),a)t={p:t},e={p:e};else if(Ke(t)&&!Ke(e)){for(u=[],f=t.length,h=f-2,c=1;c<f;c++)u.push(r(t[c-1],t[c]));f--,s=function(g){g*=f;var _=Math.min(h,~~g);return u[_](g-_)},n=e}else i||(t=Wr(Ke(t)?[]:{},t));if(!u){for(l in e)oc.call(o,t,l,"get",e[l]);s=function(g){return hc(g,o)||(a?t.p:t)}}}return ki(n,s)},au=function(t,e,n){var i=t.labels,s=An,a,o,l;for(a in i)o=i[a]-e,o<0==!!n&&o&&s>(o=Math.abs(o))&&(l=a,s=o);return l},mn=function(t,e,n){var i=t.vars,s=i[e],a=Se,o=t._ctx,l,c,u;if(s)return l=i[e+"Params"],c=i.callbackScope||t,n&&Ui.length&&Ra(),o&&(Se=o),u=l?s.apply(c,l):s.call(c),Se=a,u},fs=function(t){return Oi(t),t.scrollTrigger&&t.scrollTrigger.kill(!!Ve),t.progress()<1&&mn(t,"onInterrupt"),t},Ur,nf=[],rf=function(t){if(t)if(t=!t.name&&t.default||t,tc()||t.headless){var e=t.name,n=Re(t),i=e&&!n&&t.init?function(){this._props=[]}:t,s={init:As,render:hc,add:oc,kill:bp,modifier:yp,rawVars:0},a={targetTest:0,get:0,getSetter:uc,aliases:{},register:0};if(Yr(),t!==i){if(hn[e])return;Mn(i,Mn(Ca(t,s),a)),Wr(i.prototype,Wr(s,Ca(t,a))),hn[i.prop=e]=i,t.targetTest&&(xa.push(i),ic[e]=1),e=(e==="css"?"CSS":e.charAt(0).toUpperCase()+e.substr(1))+"Plugin"}zh(e,i),t.register&&t.register(ln,i,sn)}else nf.push(t)},me=255,ds={aqua:[0,me,me],lime:[0,me,0],silver:[192,192,192],black:[0,0,0],maroon:[128,0,0],teal:[0,128,128],blue:[0,0,me],navy:[0,0,128],white:[me,me,me],olive:[128,128,0],yellow:[me,me,0],orange:[me,165,0],gray:[128,128,128],purple:[128,0,128],green:[0,128,0],red:[me,0,0],pink:[me,192,203],cyan:[0,me,me],transparent:[me,me,me,0]},eo=function(t,e,n){return t+=t<0?1:t>1?-1:0,(t*6<1?e+(n-e)*t*6:t<.5?n:t*3<2?e+(n-e)*(2/3-t)*6:e)*me+.5|0},sf=function(t,e,n){var i=t?_i(t)?[t>>16,t>>8&me,t&me]:0:ds.black,s,a,o,l,c,u,f,h,d,g;if(!i){if(t.substr(-1)===","&&(t=t.substr(0,t.length-1)),ds[t])i=ds[t];else if(t.charAt(0)==="#"){if(t.length<6&&(s=t.charAt(1),a=t.charAt(2),o=t.charAt(3),t="#"+s+s+a+a+o+o+(t.length===5?t.charAt(4)+t.charAt(4):"")),t.length===9)return i=parseInt(t.substr(1,6),16),[i>>16,i>>8&me,i&me,parseInt(t.substr(7),16)/255];t=parseInt(t.substr(1),16),i=[t>>16,t>>8&me,t&me]}else if(t.substr(0,3)==="hsl"){if(i=g=t.match(eu),!e)l=+i[0]%360/360,c=+i[1]/100,u=+i[2]/100,a=u<=.5?u*(c+1):u+c-u*c,s=u*2-a,i.length>3&&(i[3]*=1),i[0]=eo(l+1/3,s,a),i[1]=eo(l,s,a),i[2]=eo(l-1/3,s,a);else if(~t.indexOf("="))return i=t.match(Uh),n&&i.length<4&&(i[3]=1),i}else i=t.match(eu)||ds.transparent;i=i.map(Number)}return e&&!g&&(s=i[0]/me,a=i[1]/me,o=i[2]/me,f=Math.max(s,a,o),h=Math.min(s,a,o),u=(f+h)/2,f===h?l=c=0:(d=f-h,c=u>.5?d/(2-f-h):d/(f+h),l=f===s?(a-o)/d+(a<o?6:0):f===a?(o-s)/d+2:(s-a)/d+4,l*=60),i[0]=~~(l+.5),i[1]=~~(c*100+.5),i[2]=~~(u*100+.5)),n&&i.length<4&&(i[3]=1),i},af=function(t){var e=[],n=[],i=-1;return t.split(Fi).forEach(function(s){var a=s.match(Nr)||[];e.push.apply(e,a),n.push(i+=a.length+1)}),e.c=n,e},ou=function(t,e,n){var i="",s=(t+i).match(Fi),a=e?"hsla(":"rgba(",o=0,l,c,u,f;if(!s)return t;if(s=s.map(function(h){return(h=sf(h,e,1))&&a+(e?h[0]+","+h[1]+"%,"+h[2]+"%,"+h[3]:h.join(","))+")"}),n&&(u=af(t),l=n.c,l.join(i)!==u.c.join(i)))for(c=t.replace(Fi,"1").split(Nr),f=c.length-1;o<f;o++)i+=c[o]+(~l.indexOf(o)?s.shift()||a+"0,0,0,0)":(u.length?u:s.length?s:n).shift());if(!c)for(c=t.split(Fi),f=c.length-1;o<f;o++)i+=c[o]+s[o];return i+c[f]},Fi=(function(){var r="(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b",t;for(t in ds)r+="|"+t+"\\b";return new RegExp(r+")","gi")})(),op=/hsl[a]?\(/,of=function(t){var e=t.join(" "),n;if(Fi.lastIndex=0,Fi.test(e))return n=op.test(e),t[1]=ou(t[1],n),t[0]=ou(t[0],n,af(t[1])),!0},Cs,dn=(function(){var r=Date.now,t=500,e=33,n=r(),i=n,s=1e3/240,a=s,o=[],l,c,u,f,h,d,g=function _(m){var p=r()-i,M=m===!0,T,x,y,E;if((p>t||p<0)&&(n+=p-e),i+=p,y=i-n,T=y-a,(T>0||M)&&(E=++f.frame,h=y-f.time*1e3,f.time=y=y/1e3,a+=T+(T>=s?4:s-T),x=1),M||(l=c(_)),x)for(d=0;d<o.length;d++)o[d](y,h,E,m)};return f={time:0,frame:0,tick:function(){g(!0)},deltaRatio:function(m){return h/(1e3/(m||60))},wake:function(){Oh&&(!Ko&&tc()&&(Zn=Ko=window,ec=Zn.document||{},vn.gsap=ln,(Zn.gsapVersions||(Zn.gsapVersions=[])).push(ln.version),Bh(Aa||Zn.GreenSockGlobals||!Zn.gsap&&Zn||{}),nf.forEach(rf)),u=typeof requestAnimationFrame<"u"&&requestAnimationFrame,l&&f.sleep(),c=u||function(m){return setTimeout(m,a-f.time*1e3+1|0)},Cs=1,g(2))},sleep:function(){(u?cancelAnimationFrame:clearTimeout)(l),Cs=0,c=As},lagSmoothing:function(m,p){t=m||1/0,e=Math.min(p||33,t)},fps:function(m){s=1e3/(m||240),a=f.time*1e3+s},add:function(m,p,M){var T=p?function(x,y,E,A){m(x,y,E,A),f.remove(T)}:m;return f.remove(m),o[M?"unshift":"push"](T),Yr(),T},remove:function(m,p){~(p=o.indexOf(m))&&o.splice(p,1)&&d>=p&&d--},_listeners:o},f})(),Yr=function(){return!Cs&&dn.wake()},se={},lp=/^[\d.\-M][\d.\-,\s]/,cp=/["']/g,up=function(t){for(var e={},n=t.substr(1,t.length-3).split(":"),i=n[0],s=1,a=n.length,o,l,c;s<a;s++)l=n[s],o=s!==a-1?l.lastIndexOf(","):l.length,c=l.substr(0,o),e[i]=isNaN(c)?c.replace(cp,"").trim():+c,i=l.substr(o+1).trim();return e},hp=function(t){var e=t.indexOf("(")+1,n=t.indexOf(")"),i=t.indexOf("(",e);return t.substring(e,~i&&i<n?t.indexOf(")",n+1):n)},fp=function(t){var e=(t+"").split("("),n=se[e[0]];return n&&e.length>1&&n.config?n.config.apply(null,~t.indexOf("{")?[up(e[1])]:hp(t).split(",").map(Hh)):se._CE&&lp.test(t)?se._CE("",t):n},dp=function(t){return function(e){return 1-t(1-e)}},ir=function(t,e){return t&&(Re(t)?t:se[t]||fp(t))||e},hr=function(t,e,n,i){n===void 0&&(n=function(l){return 1-e(1-l)}),i===void 0&&(i=function(l){return l<.5?e(l*2)/2:1-e((1-l)*2)/2});var s={easeIn:e,easeOut:n,easeInOut:i},a;return rn(t,function(o){se[o]=vn[o]=s,se[a=o.toLowerCase()]=n;for(var l in s)se[a+(l==="easeIn"?".in":l==="easeOut"?".out":".inOut")]=se[o+"."+l]=s[l]}),s},lf=function(t){return function(e){return e<.5?(1-t(1-e*2))/2:.5+t((e-.5)*2)/2}},no=function r(t,e,n){var i=e>=1?e:1,s=(n||(t?.3:.45))/(e<1?e:1),a=s/Zo*(Math.asin(1/i)||0),o=function(u){return u===1?1:i*Math.pow(2,-10*u)*Od((u-a)*s)+1},l=t==="out"?o:t==="in"?function(c){return 1-o(1-c)}:lf(o);return s=Zo/s,l.config=function(c,u){return r(t,c,u)},l},io=function r(t,e){e===void 0&&(e=1.70158);var n=function(a){return a?--a*a*((e+1)*a+e)+1:0},i=t==="out"?n:t==="in"?function(s){return 1-n(1-s)}:lf(n);return i.config=function(s){return r(t,s)},i};rn("Linear,Quad,Cubic,Quart,Quint,Strong",function(r,t){var e=t<5?t+1:t;hr(r+",Power"+(e-1),t?function(n){return Math.pow(n,e)}:function(n){return n},function(n){return 1-Math.pow(1-n,e)},function(n){return n<.5?Math.pow(n*2,e)/2:1-Math.pow((1-n)*2,e)/2})});se.Linear.easeNone=se.none=se.Linear.easeIn;hr("Elastic",no("in"),no("out"),no());(function(r,t){var e=1/t,n=2*e,i=2.5*e,s=function(o){return o<e?r*o*o:o<n?r*Math.pow(o-1.5/t,2)+.75:o<i?r*(o-=2.25/t)*o+.9375:r*Math.pow(o-2.625/t,2)+.984375};hr("Bounce",function(a){return 1-s(1-a)},s)})(7.5625,2.75);hr("Expo",function(r){return Math.pow(2,10*(r-1))*r+r*r*r*r*r*r*(1-r)});hr("Circ",function(r){return-(Ih(1-r*r)-1)});hr("Sine",function(r){return r===1?1:-Fd(r*Nd)+1});hr("Back",io("in"),io("out"),io());se.SteppedEase=se.steps=vn.SteppedEase={config:function(t,e){t===void 0&&(t=1);var n=1/t,i=t+(e?0:1),s=e?1:0,a=1-_e;return function(o){return((i*Gs(0,a,o)|0)+s)*n}}};Es.ease=se["quad.out"];rn("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt",function(r){return rc+=r+","+r+"Params,"});var cf=function(t,e){this.id=Ud++,t._gsap=this,this.target=t,this.harness=e,this.get=e?e.get:Gh,this.set=e?e.getSetter:uc},Ps=(function(){function r(e){this.vars=e,this._delay=+e.delay||0,(this._repeat=e.repeat===1/0?-2:e.repeat||0)&&(this._rDelay=e.repeatDelay||0,this._yoyo=!!e.yoyo||!!e.yoyoEase),this._ts=1,qr(this,+e.duration,1,1),this.data=e.data,Se&&(this._ctx=Se,Se.data.push(this)),Cs||dn.wake()}var t=r.prototype;return t.delay=function(n){return n||n===0?(this.parent&&this.parent.smoothChildTiming&&this.startTime(this._start+n-this._delay),this._delay=n,this):this._delay},t.duration=function(n){return arguments.length?this.totalDuration(this._repeat>0?n+(n+this._rDelay)*this._repeat:n):this.totalDuration()&&this._dur},t.totalDuration=function(n){return arguments.length?(this._dirty=0,qr(this,this._repeat<0?n:(n-this._repeat*this._rDelay)/(this._repeat+1))):this._tDur},t.totalTime=function(n,i){if(Yr(),!arguments.length)return this._tTime;var s=this._dp;if(s&&s.smoothChildTiming&&this._ts){for(Xa(this,n),!s._dp||s.parent||qh(s,this);s&&s.parent;)s.parent._time!==s._start+(s._ts>=0?s._tTime/s._ts:(s.totalDuration()-s._tTime)/-s._ts)&&s.totalTime(s._tTime,!0),s=s.parent;!this.parent&&this._dp.autoRemoveChildren&&(this._ts>0&&n<this._tDur||this._ts<0&&n>0||!this._tDur&&!n)&&$n(this._dp,this,this._start-this._delay)}return(this._tTime!==n||!this._dur&&!i||this._initted&&Math.abs(this._zTime)===_e||!this._initted&&this._dur&&n||!n&&!this._initted&&(this.add||this._ptLookup))&&(this._ts||(this._pTime=n),Vh(this,n,i)),this},t.time=function(n,i){return arguments.length?this.totalTime(Math.min(this.totalDuration(),n+ru(this))%(this._dur+this._rDelay)||(n?this._dur:0),i):this._time},t.totalProgress=function(n,i){return arguments.length?this.totalTime(this.totalDuration()*n,i):this.totalDuration()?Math.min(1,this._tTime/this._tDur):this.rawTime()>=0&&this._initted?1:0},t.progress=function(n,i){return arguments.length?this.totalTime(this.duration()*(this._yoyo&&!(this.iteration()&1)?1-n:n)+ru(this),i):this.duration()?Math.min(1,this._time/this._dur):this.rawTime()>0?1:0},t.iteration=function(n,i){var s=this.duration()+this._rDelay;return arguments.length?this.totalTime(this._time+(n-1)*s,i):this._repeat?Xr(this._tTime,s)+1:1},t.timeScale=function(n,i){if(!arguments.length)return this._rts===-_e?0:this._rts;if(this._rts===n)return this;var s=this.parent&&this._ts?Pa(this.parent._time,this):this._tTime;return this._rts=+n||0,this._ts=this._ps||n===-_e?0:this._rts,this.totalTime(Gs(-Math.abs(this._delay),this.totalDuration(),s),i!==!1),Wa(this),Yd(this)},t.paused=function(n){return arguments.length?(this._ps!==n&&(this._ps=n,n?(this._pTime=this._tTime||Math.max(-this._delay,this.rawTime()),this._ts=this._act=0):(Yr(),this._ts=this._rts,this.totalTime(this.parent&&!this.parent.smoothChildTiming?this.rawTime():this._tTime||this._pTime,this.progress()===1&&Math.abs(this._zTime)!==_e&&(this._tTime-=_e)))),this):this._ps},t.startTime=function(n){if(arguments.length){this._start=ye(n);var i=this.parent||this._dp;return i&&(i._sort||!this.parent)&&$n(i,this,this._start-this._delay),this}return this._start},t.endTime=function(n){return this._start+(nn(n)?this.totalDuration():this.duration())/Math.abs(this._ts||1)},t.rawTime=function(n){var i=this.parent||this._dp;return i?n&&(!this._ts||this._repeat&&this._time&&this.totalProgress()<1)?this._tTime%(this._dur+this._rDelay):this._ts?Pa(i.rawTime(n),this):this._tTime:this._tTime},t.revert=function(n){n===void 0&&(n=Hd);var i=Ve;return Ve=n,ac(this)&&(this.timeline&&this.timeline.revert(n),this.totalTime(-.01,n.suppressEvents)),this.data!=="nested"&&n.kill!==!1&&this.kill(),Ve=i,this},t.globalTime=function(n){for(var i=this,s=arguments.length?n:i.rawTime();i;)s=i._start+s/(Math.abs(i._ts)||1),i=i._dp;return!this.parent&&this._sat?this._sat.globalTime(n):s},t.repeat=function(n){return arguments.length?(this._repeat=n===1/0?-2:n,su(this)):this._repeat===-2?1/0:this._repeat},t.repeatDelay=function(n){if(arguments.length){var i=this._time;return this._rDelay=n,su(this),i?this.time(i):this}return this._rDelay},t.yoyo=function(n){return arguments.length?(this._yoyo=n,this):this._yoyo},t.seek=function(n,i){return this.totalTime(Tn(this,n),nn(i))},t.restart=function(n,i){return this.play().totalTime(n?-this._delay:0,nn(i)),this._dur||(this._zTime=-_e),this},t.play=function(n,i){return n!=null&&this.seek(n,i),this.reversed(!1).paused(!1)},t.reverse=function(n,i){return n!=null&&this.seek(n||this.totalDuration(),i),this.reversed(!0).paused(!1)},t.pause=function(n,i){return n!=null&&this.seek(n,i),this.paused(!0)},t.resume=function(){return this.paused(!1)},t.reversed=function(n){return arguments.length?(!!n!==this.reversed()&&this.timeScale(-this._rts||(n?-_e:0)),this):this._rts<0},t.invalidate=function(){return this._initted=this._act=0,this._zTime=-_e,this},t.isActive=function(){var n=this.parent||this._dp,i=this._start,s;return!!(!n||this._ts&&this._initted&&n.isActive()&&(s=n.rawTime(!0))>=i&&s<this.endTime(!0)-_e)},t.eventCallback=function(n,i,s){var a=this.vars;return arguments.length>1?(i?(a[n]=i,s&&(a[n+"Params"]=s),n==="onUpdate"&&(this._onUpdate=i)):delete a[n],this):a[n]},t.then=function(n){var i=this,s=i._prom;return new Promise(function(a){var o=Re(n)?n:Wh,l=function(){var u=i.then;i.then=null,s&&s(),Re(o)&&(o=o(i))&&(o.then||o===i)&&(i.then=u),a(o),i.then=u};i._initted&&i.totalProgress()===1&&i._ts>=0||!i._tTime&&i._ts<0?l():i._prom=l})},t.kill=function(){fs(this)},r})();Mn(Ps.prototype,{_time:0,_start:0,_end:0,_tTime:0,_tDur:0,_dirty:0,_repeat:0,_yoyo:!1,parent:null,_initted:!1,_rDelay:0,_ts:1,_dp:0,ratio:0,_zTime:-_e,_prom:0,_ps:!1,_rts:1});var en=(function(r){Dh(t,r);function t(n,i){var s;return n===void 0&&(n={}),s=r.call(this,n)||this,s.labels={},s.smoothChildTiming=!!n.smoothChildTiming,s.autoRemoveChildren=!!n.autoRemoveChildren,s._sort=nn(n.sortChildren),be&&$n(n.parent||be,ui(s),i),n.reversed&&s.reverse(),n.paused&&s.paused(!0),n.scrollTrigger&&Yh(ui(s),n.scrollTrigger),s}var e=t.prototype;return e.to=function(i,s,a){return xs(0,arguments,this),this},e.from=function(i,s,a){return xs(1,arguments,this),this},e.fromTo=function(i,s,a,o){return xs(2,arguments,this),this},e.set=function(i,s,a){return s.duration=0,s.parent=this,gs(s).repeatDelay||(s.repeat=0),s.immediateRender=!!s.immediateRender,new Ie(i,s,Tn(this,a),1),this},e.call=function(i,s,a){return $n(this,Ie.delayedCall(0,i,s),a)},e.staggerTo=function(i,s,a,o,l,c,u){return a.duration=s,a.stagger=a.stagger||o,a.onComplete=c,a.onCompleteParams=u,a.parent=this,new Ie(i,a,Tn(this,l)),this},e.staggerFrom=function(i,s,a,o,l,c,u){return a.runBackwards=1,gs(a).immediateRender=nn(a.immediateRender),this.staggerTo(i,s,a,o,l,c,u)},e.staggerFromTo=function(i,s,a,o,l,c,u,f){return o.startAt=a,gs(o).immediateRender=nn(o.immediateRender),this.staggerTo(i,s,o,l,c,u,f)},e.render=function(i,s,a){var o=this._time,l=this._dirty?this.totalDuration():this._tDur,c=this._dur,u=i<=0?0:ye(i),f=this._zTime<0!=i<0&&(this._initted||!c),h,d,g,_,m,p,M,T,x,y,E,A;if(this!==be&&u>l&&i>=0&&(u=l),u!==this._tTime||a||f){if(o!==this._time&&c&&(u+=this._time-o,i+=this._time-o),h=u,x=this._start,T=this._ts,p=!T,f&&(c||(o=this._zTime),(i||!s)&&(this._zTime=i)),this._repeat){if(E=this._yoyo,m=c+this._rDelay,this._repeat<-1&&i<0)return this.totalTime(m*100+i,s,a);if(h=ye(u%m),u===l?(_=this._repeat,h=c):(y=ye(u/m),_=~~y,_&&_===y&&(h=c,_--),h>c&&(h=c)),y=Xr(this._tTime,m),!o&&this._tTime&&y!==_&&this._tTime-y*m-this._dur<=0&&(y=_),E&&_&1&&(h=c-h,A=1),_!==y&&!this._lock){var v=E&&y&1,b=v===(E&&_&1);if(_<y&&(v=!v),o=v?0:u%c?c:u,this._lock=1,this.render(o||(A?0:ye(_*m)),s,!c)._lock=0,this._tTime=u,!s&&this.parent&&mn(this,"onRepeat"),this.vars.repeatRefresh&&!A&&(this.invalidate()._lock=1,y=_),o&&o!==this._time||p!==!this._ts||this.vars.onRepeat&&!this.parent&&!this._act)return this;if(c=this._dur,l=this._tDur,b&&(this._lock=2,o=v?c:-1e-4,this.render(o,!0),this.vars.repeatRefresh&&!A&&this.invalidate()),this._lock=0,!this._ts&&!p)return this}}if(this._hasPause&&!this._forcing&&this._lock<2&&(M=Jd(this,ye(o),ye(h)),M&&(u-=h-(h=M._start))),this._tTime=u,this._time=h,this._act=!!T,this._initted||(this._onUpdate=this.vars.onUpdate,this._initted=1,this._zTime=i,o=0),!o&&u&&c&&!s&&!y&&(mn(this,"onStart"),this._tTime!==u))return this;if(h>=o&&i>=0)for(d=this._first;d;){if(g=d._next,(d._act||h>=d._start)&&d._ts&&M!==d){if(d.parent!==this)return this.render(i,s,a);if(d.render(d._ts>0?(h-d._start)*d._ts:(d._dirty?d.totalDuration():d._tDur)+(h-d._start)*d._ts,s,a),h!==this._time||!this._ts&&!p){M=0,g&&(u+=this._zTime=-_e);break}}d=g}else{d=this._last;for(var R=i<0?i:h;d;){if(g=d._prev,(d._act||R<=d._end)&&d._ts&&M!==d){if(d.parent!==this)return this.render(i,s,a);if(d.render(d._ts>0?(R-d._start)*d._ts:(d._dirty?d.totalDuration():d._tDur)+(R-d._start)*d._ts,s,a||Ve&&ac(d)),h!==this._time||!this._ts&&!p){M=0,g&&(u+=this._zTime=R?-_e:_e);break}}d=g}}if(M&&!s&&(this.pause(),M.render(h>=o?0:-_e)._zTime=h>=o?1:-1,this._ts))return this._start=x,Wa(this),this.render(i,s,a);this._onUpdate&&!s&&mn(this,"onUpdate",!0),(u===l&&this._tTime>=this.totalDuration()||!u&&o)&&(x===this._start||Math.abs(T)!==Math.abs(this._ts))&&(this._lock||((i||!c)&&(u===l&&this._ts>0||!u&&this._ts<0)&&Oi(this,1),!s&&!(i<0&&!o)&&(u||o||!l)&&(mn(this,u===l&&i>=0?"onComplete":"onReverseComplete",!0),this._prom&&!(u<l&&this.timeScale()>0)&&this._prom())))}return this},e.add=function(i,s){var a=this;if(_i(s)||(s=Tn(this,s,i)),!(i instanceof Ps)){if(Ke(i))return i.forEach(function(o){return a.add(o,s)}),this;if(ze(i))return this.addLabel(i,s);if(Re(i))i=Ie.delayedCall(0,i);else return this}return this!==i?$n(this,i,s):this},e.getChildren=function(i,s,a,o){i===void 0&&(i=!0),s===void 0&&(s=!0),a===void 0&&(a=!0),o===void 0&&(o=-An);for(var l=[],c=this._first;c;)c._start>=o&&(c instanceof Ie?s&&l.push(c):(a&&l.push(c),i&&l.push.apply(l,c.getChildren(!0,s,a)))),c=c._next;return l},e.getById=function(i){for(var s=this.getChildren(1,1,1),a=s.length;a--;)if(s[a].vars.id===i)return s[a]},e.remove=function(i){return ze(i)?this.removeLabel(i):Re(i)?this.killTweensOf(i):(i.parent===this&&Ha(this,i),i===this._recent&&(this._recent=this._last),nr(this))},e.totalTime=function(i,s){return arguments.length?(this._forcing=1,!this._dp&&this._ts&&(this._start=ye(dn.time-(this._ts>0?i/this._ts:(this.totalDuration()-i)/-this._ts))),r.prototype.totalTime.call(this,i,s),this._forcing=0,this):this._tTime},e.addLabel=function(i,s){return this.labels[i]=Tn(this,s),this},e.removeLabel=function(i){return delete this.labels[i],this},e.addPause=function(i,s,a){var o=Ie.delayedCall(0,s||As,a);return o.data="isPause",this._hasPause=1,$n(this,o,Tn(this,i))},e.removePause=function(i){var s=this._first;for(i=Tn(this,i);s;)s._start===i&&s.data==="isPause"&&Oi(s),s=s._next},e.killTweensOf=function(i,s,a){for(var o=this.getTweensOf(i,a),l=o.length;l--;)Li!==o[l]&&o[l].kill(i,s);return this},e.getTweensOf=function(i,s){for(var a=[],o=Rn(i),l=this._first,c=_i(s),u;l;)l instanceof Ie?Wd(l._targets,o)&&(c?(!Li||l._initted&&l._ts)&&l.globalTime(0)<=s&&l.globalTime(l.totalDuration())>s:!s||l.isActive())&&a.push(l):(u=l.getTweensOf(o,s)).length&&a.push.apply(a,u),l=l._next;return a},e.tweenTo=function(i,s){s=s||{};var a=this,o=Tn(a,i),l=s,c=l.startAt,u=l.onStart,f=l.onStartParams,h=l.immediateRender,d,g=Ie.to(a,Mn({ease:s.ease||"none",lazy:!1,immediateRender:!1,time:o,overwrite:"auto",duration:s.duration||Math.abs((o-(c&&"time"in c?c.time:a._time))/a.timeScale())||_e,onStart:function(){if(a.pause(),!d){var m=s.duration||Math.abs((o-(c&&"time"in c?c.time:a._time))/a.timeScale());g._dur!==m&&qr(g,m,0,1).render(g._time,!0,!0),d=1}u&&u.apply(g,f||[])}},s));return h?g.render(0):g},e.tweenFromTo=function(i,s,a){return this.tweenTo(s,Mn({startAt:{time:Tn(this,i)}},a))},e.recent=function(){return this._recent},e.nextLabel=function(i){return i===void 0&&(i=this._time),au(this,Tn(this,i))},e.previousLabel=function(i){return i===void 0&&(i=this._time),au(this,Tn(this,i),1)},e.currentLabel=function(i){return arguments.length?this.seek(i,!0):this.previousLabel(this._time+_e)},e.shiftChildren=function(i,s,a){a===void 0&&(a=0);var o=this._first,l=this.labels,c;for(i=ye(i);o;)o._start>=a&&(o._start+=i,o._end+=i),o=o._next;if(s)for(c in l)l[c]>=a&&(l[c]+=i);return nr(this)},e.invalidate=function(i){var s=this._first;for(this._lock=0;s;)s.invalidate(i),s=s._next;return r.prototype.invalidate.call(this,i)},e.clear=function(i){i===void 0&&(i=!0);for(var s=this._first,a;s;)a=s._next,this.remove(s),s=a;return this._dp&&(this._time=this._tTime=this._pTime=0),i&&(this.labels={}),nr(this)},e.totalDuration=function(i){var s=0,a=this,o=a._last,l=An,c,u,f;if(arguments.length)return a.timeScale((a._repeat<0?a.duration():a.totalDuration())/(a.reversed()?-i:i));if(a._dirty){for(f=a.parent;o;)c=o._prev,o._dirty&&o.totalDuration(),u=o._start,u>l&&a._sort&&o._ts&&!a._lock?(a._lock=1,$n(a,o,u-o._delay,1)._lock=0):l=u,u<0&&o._ts&&(s-=u,(!f&&!a._dp||f&&f.smoothChildTiming)&&(a._start+=ye(u/a._ts),a._time-=u,a._tTime-=u),a.shiftChildren(-u,!1,-1/0),l=0),o._end>s&&o._ts&&(s=o._end),o=c;qr(a,a===be&&a._time>s?a._time:s,1,1),a._dirty=0}return a._tDur},t.updateRoot=function(i){if(be._ts&&(Vh(be,Pa(i,be)),kh=dn.frame),dn.frame>=nu){nu+=gn.autoSleep||120;var s=be._first;if((!s||!s._ts)&&gn.autoSleep&&dn._listeners.length<2){for(;s&&!s._ts;)s=s._next;s||dn.sleep()}}},t})(Ps);Mn(en.prototype,{_lock:0,_hasPause:0,_forcing:0});var pp=function(t,e,n,i,s,a,o){var l=new sn(this._pt,t,e,0,1,mf,null,s),c=0,u=0,f,h,d,g,_,m,p,M;for(l.b=n,l.e=i,n+="",i+="",(p=~i.indexOf("random("))&&(i=Rs(i)),a&&(M=[n,i],a(M,t,e),n=M[0],i=M[1]),h=n.match(ja)||[];f=ja.exec(i);)g=f[0],_=i.substring(c,f.index),d?d=(d+1)%5:_.substr(-5)==="rgba("&&(d=1),g!==h[u++]&&(m=parseFloat(h[u-1])||0,l._pt={_next:l._pt,p:_||u===1?_:",",s:m,c:g.charAt(1)==="="?Br(m,g)-m:parseFloat(g)-m,m:d&&d<4?Math.round:0},c=ja.lastIndex);return l.c=c<i.length?i.substring(c,i.length):"",l.fp=o,(Fh.test(i)||p)&&(l.e=0),this._pt=l,l},oc=function(t,e,n,i,s,a,o,l,c,u){Re(i)&&(i=i(s||0,t,a));var f=t[e],h=n!=="get"?n:Re(f)?c?t[e.indexOf("set")||!Re(t["get"+e.substr(3)])?e:"get"+e.substr(3)](c):t[e]():f,d=Re(f)?c?vp:df:cc,g;if(ze(i)&&(~i.indexOf("random(")&&(i=Rs(i)),i.charAt(1)==="="&&(g=Br(h,i)+(Ye(h)||0),(g||g===0)&&(i=g))),!u||h!==i||nl)return!isNaN(h*i)&&i!==""?(g=new sn(this._pt,t,e,+h||0,i-(h||0),typeof f=="boolean"?Sp:pf,0,d),c&&(g.fp=c),o&&g.modifier(o,this,t),this._pt=g):(!f&&!(e in t)&&nc(e,i),pp.call(this,t,e,h,i,d,l||gn.stringFilter,c))},mp=function(t,e,n,i,s){if(Re(t)&&(t=vs(t,s,e,n,i)),!ii(t)||t.style&&t.nodeType||Ke(t)||Nh(t))return ze(t)?vs(t,s,e,n,i):t;var a={},o;for(o in t)a[o]=vs(t[o],s,e,n,i);return a},uf=function(t,e,n,i,s,a){var o,l,c,u;if(hn[t]&&(o=new hn[t]).init(s,o.rawVars?e[t]:mp(e[t],i,s,a,n),n,i,a)!==!1&&(n._pt=l=new sn(n._pt,s,t,0,1,o.render,o,0,o.priority),n!==Ur))for(c=n._ptLookup[n._targets.indexOf(s)],u=o._props.length;u--;)c[o._props[u]]=l;return o},Li,nl,lc=function r(t,e,n){var i=t.vars,s=i.ease,a=i.startAt,o=i.immediateRender,l=i.lazy,c=i.onUpdate,u=i.runBackwards,f=i.yoyoEase,h=i.keyframes,d=i.autoRevert,g=t._dur,_=t._startAt,m=t._targets,p=t.parent,M=p&&p.data==="nested"?p.vars.targets:m,T=t._overwrite==="auto"&&!Ql,x=t.timeline,y=i.easeReverse||f,E,A,v,b,R,P,N,z,L,B,X,G,et;if(x&&(!h||!s)&&(s="none"),t._ease=ir(s,Es.ease),t._rEase=y&&(ir(y)||t._ease),t._from=!x&&!!i.runBackwards,t._from&&(t.ratio=1),!x||h&&!i.stagger){if(z=m[0]?er(m[0]).harness:0,G=z&&i[z.prop],E=Ca(i,ic),_&&(_._zTime<0&&_.progress(1),e<0&&u&&o&&!d?_.render(-1,!0):_.revert(u&&g?ga:Vd),_._lazy=0),a){if(Oi(t._startAt=Ie.set(m,Mn({data:"isStart",overwrite:!1,parent:p,immediateRender:!0,lazy:!_&&nn(l),startAt:null,delay:0,onUpdate:c&&function(){return mn(t,"onUpdate")},stagger:0},a))),t._startAt._dp=0,t._startAt._sat=t,e<0&&(Ve||!o&&!d)&&t._startAt.revert(ga),o&&g&&e<=0&&n<=0){e&&(t._zTime=e);return}}else if(u&&g&&!_){if(e&&(o=!1),v=Mn({overwrite:!1,data:"isFromStart",lazy:o&&!_&&nn(l),immediateRender:o,stagger:0,parent:p},E),G&&(v[z.prop]=G),Oi(t._startAt=Ie.set(m,v)),t._startAt._dp=0,t._startAt._sat=t,e<0&&(Ve?t._startAt.revert(ga):t._startAt.render(-1,!0)),t._zTime=e,!o)r(t._startAt,_e,_e);else if(!e)return}for(t._pt=t._ptCache=0,l=g&&nn(l)||l&&!g,A=0;A<m.length;A++){if(R=m[A],N=R._gsap||sc(m)[A]._gsap,t._ptLookup[A]=B={},$o[N.id]&&Ui.length&&Ra(),X=M===m?A:M.indexOf(R),z&&(L=new z).init(R,G||E,t,X,M)!==!1&&(t._pt=b=new sn(t._pt,R,L.name,0,1,L.render,L,0,L.priority),L._props.forEach(function(Y){B[Y]=b}),L.priority&&(P=1)),!z||G)for(v in E)hn[v]&&(L=uf(v,E,t,X,R,M))?L.priority&&(P=1):B[v]=b=oc.call(t,R,v,"get",E[v],X,M,0,i.stringFilter);t._op&&t._op[A]&&t.kill(R,t._op[A]),T&&t._pt&&(Li=t,be.killTweensOf(R,B,t.globalTime(e)),et=!t.parent,Li=0),t._pt&&l&&($o[N.id]=1)}P&&_f(t),t._onInit&&t._onInit(t)}t._onUpdate=c,t._initted=(!t._op||t._pt)&&!et,h&&e<=0&&x.render(An,!0,!0)},_p=function(t,e,n,i,s,a,o,l){var c=(t._pt&&t._ptCache||(t._ptCache={}))[e],u,f,h,d;if(!c)for(c=t._ptCache[e]=[],h=t._ptLookup,d=t._targets.length;d--;){if(u=h[d][e],u&&u.d&&u.d._pt)for(u=u.d._pt;u&&u.p!==e&&u.fp!==e;)u=u._next;if(!u)return nl=1,t.vars[e]="+=0",lc(t,o),nl=0,l?ws(e+" not eligible for reset. Try splitting into individual properties"):1;c.push(u)}for(d=c.length;d--;)f=c[d],u=f._pt||f,u.s=(i||i===0)&&!s?i:u.s+(i||0)+a*u.c,u.c=n-u.s,f.e&&(f.e=Pe(n)+Ye(f.e)),f.b&&(f.b=u.s+Ye(f.b))},gp=function(t,e){var n=t[0]?er(t[0]).harness:0,i=n&&n.aliases,s,a,o,l;if(!i)return e;s=Wr({},e);for(a in i)if(a in s)for(l=i[a].split(","),o=l.length;o--;)s[l[o]]=s[a];return s},xp=function(t,e,n,i){var s=e.ease||i||"power1.inOut",a,o;if(Ke(e))o=n[t]||(n[t]=[]),e.forEach(function(l,c){return o.push({t:c/(e.length-1)*100,v:l,e:s})});else for(a in e)o=n[a]||(n[a]=[]),a==="ease"||o.push({t:parseFloat(t),v:e[a],e:s})},vs=function(t,e,n,i,s){return Re(t)?t.call(e,n,i,s):ze(t)&&~t.indexOf("random(")?Rs(t):t},hf=rc+"repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,easeReverse,autoRevert",ff={};rn(hf+",id,stagger,delay,duration,paused,scrollTrigger",function(r){return ff[r]=1});var Ie=(function(r){Dh(t,r);function t(n,i,s,a){var o;typeof i=="number"&&(s.duration=i,i=s,s=null),o=r.call(this,a?i:gs(i))||this;var l=o.vars,c=l.duration,u=l.delay,f=l.immediateRender,h=l.stagger,d=l.overwrite,g=l.keyframes,_=l.defaults,m=l.scrollTrigger,p=i.parent||be,M=(Ke(n)||Nh(n)?_i(n[0]):"length"in i)?[n]:Rn(n),T,x,y,E,A,v,b,R;if(o._targets=M.length?sc(M):ws("GSAP target "+n+" not found. https://gsap.com",!gn.nullTargetWarn)||[],o._ptLookup=[],o._overwrite=d,g||h||Xs(c)||Xs(u)){i=o.vars;var P=i.easeReverse||i.yoyoEase;if(T=o.timeline=new en({data:"nested",defaults:_||{},targets:p&&p.data==="nested"?p.vars.targets:M}),T.kill(),T.parent=T._dp=ui(o),T._start=0,h||Xs(c)||Xs(u)){if(E=M.length,b=h&&Jh(h),ii(h))for(A in h)~hf.indexOf(A)&&(R||(R={}),R[A]=h[A]);for(x=0;x<E;x++)y=Ca(i,ff),y.stagger=0,P&&(y.easeReverse=P),R&&Wr(y,R),v=M[x],y.duration=+vs(c,ui(o),x,v,M),y.delay=(+vs(u,ui(o),x,v,M)||0)-o._delay,!h&&E===1&&y.delay&&(o._delay=u=y.delay,o._start+=u,y.delay=0),T.to(v,y,b?b(x,v,M):0),T._ease=se.none;T.duration()?c=u=0:o.timeline=0}else if(g){gs(Mn(T.vars.defaults,{ease:"none"})),T._ease=ir(g.ease||i.ease||"none");var N=0,z,L,B;if(Ke(g))g.forEach(function(X){return T.to(M,X,">")}),T.duration();else{y={};for(A in g)A==="ease"||A==="easeEach"||xp(A,g[A],y,g.easeEach);for(A in y)for(z=y[A].sort(function(X,G){return X.t-G.t}),N=0,x=0;x<z.length;x++)L=z[x],B={ease:L.e,duration:(L.t-(x?z[x-1].t:0))/100*c},B[A]=L.v,T.to(M,B,N),N+=B.duration;T.duration()<c&&T.to({},{duration:c-T.duration()})}}c||o.duration(c=T.duration())}else o.timeline=0;return d===!0&&!Ql&&(Li=ui(o),be.killTweensOf(M),Li=0),$n(p,ui(o),s),i.reversed&&o.reverse(),i.paused&&o.paused(!0),(f||!c&&!g&&o._start===ye(p._time)&&nn(f)&&Zd(ui(o))&&p.data!=="nested")&&(o._tTime=-_e,o.render(Math.max(0,-u)||0)),m&&Yh(ui(o),m),o}var e=t.prototype;return e.render=function(i,s,a){var o=this._time,l=this._tDur,c=this._dur,u=i<0,f=i>l-_e&&!u?l:i<_e?0:i,h,d,g,_,m,p,M,T;if(!c)$d(this,i,s,a);else if(f!==this._tTime||!i||a||!this._initted&&this._tTime||this._startAt&&this._zTime<0!==u||this._lazy){if(h=f,T=this.timeline,this._repeat){if(_=c+this._rDelay,this._repeat<-1&&u)return this.totalTime(_*100+i,s,a);if(h=ye(f%_),f===l?(g=this._repeat,h=c):(m=ye(f/_),g=~~m,g&&g===m?(h=c,g--):h>c&&(h=c)),p=this._yoyo&&g&1,p&&(h=c-h),m=Xr(this._tTime,_),h===o&&!a&&this._initted&&g===m)return this._tTime=f,this;g!==m&&this.vars.repeatRefresh&&!p&&!this._lock&&h!==_&&this._initted&&(this._lock=a=1,this.render(ye(_*g),!0).invalidate()._lock=0)}if(!this._initted){if(Zh(this,u?i:h,a,s,f))return this._tTime=0,this;if(o!==this._time&&!(a&&this.vars.repeatRefresh&&g!==m))return this;if(c!==this._dur)return this.render(i,s,a)}if(this._rEase){var x=h<o;if(x!==this._inv){var y=x?o:c-o;this._inv=x,this._from&&(this.ratio=1-this.ratio),this._invRatio=this.ratio,this._invTime=o,this._invRecip=y?(x?-1:1)/y:0,this._invScale=x?-this.ratio:1-this.ratio,this._invEase=x?this._rEase:this._ease}this.ratio=M=this._invRatio+this._invScale*this._invEase((h-this._invTime)*this._invRecip)}else this.ratio=M=this._ease(h/c);if(this._from&&(this.ratio=M=1-M),this._tTime=f,this._time=h,!this._act&&this._ts&&(this._act=1,this._lazy=0),!o&&f&&!s&&!m&&(mn(this,"onStart"),this._tTime!==f))return this;for(d=this._pt;d;)d.r(M,d.d),d=d._next;T&&T.render(i<0?i:T._dur*T._ease(h/this._dur),s,a)||this._startAt&&(this._zTime=i),this._onUpdate&&!s&&(u&&Jo(this,i,s,a),mn(this,"onUpdate")),this._repeat&&g!==m&&this.vars.onRepeat&&!s&&this.parent&&mn(this,"onRepeat"),(f===this._tDur||!f)&&this._tTime===f&&(u&&!this._onUpdate&&Jo(this,i,!0,!0),(i||!c)&&(f===this._tDur&&this._ts>0||!f&&this._ts<0)&&Oi(this,1),!s&&!(u&&!o)&&(f||o||p)&&(mn(this,f===l?"onComplete":"onReverseComplete",!0),this._prom&&!(f<l&&this.timeScale()>0)&&this._prom()))}return this},e.targets=function(){return this._targets},e.invalidate=function(i){return(!i||!this.vars.runBackwards)&&(this._startAt=0),this._pt=this._op=this._onUpdate=this._lazy=this.ratio=0,this._ptLookup=[],this.timeline&&this.timeline.invalidate(i),r.prototype.invalidate.call(this,i)},e.resetTo=function(i,s,a,o,l){Cs||dn.wake(),this._ts||this.play();var c=Math.min(this._dur,(this._dp._time-this._start)*this._ts),u;return this._initted||lc(this,c),u=this._ease(c/this._dur),_p(this,i,s,a,o,u,c,l)?this.resetTo(i,s,a,o,1):(Xa(this,0),this.parent||Xh(this._dp,this,"_first","_last",this._dp._sort?"_start":0),this.render(0))},e.kill=function(i,s){if(s===void 0&&(s="all"),!i&&(!s||s==="all"))return this._lazy=this._pt=0,this.parent?fs(this):this.scrollTrigger&&this.scrollTrigger.kill(!!Ve),this;if(this.timeline){var a=this.timeline.totalDuration();return this.timeline.killTweensOf(i,s,Li&&Li.vars.overwrite!==!0)._first||fs(this),this.parent&&a!==this.timeline.totalDuration()&&qr(this,this._dur*this.timeline._tDur/a,0,1),this}var o=this._targets,l=i?Rn(i):o,c=this._ptLookup,u=this._pt,f,h,d,g,_,m,p;if((!s||s==="all")&&qd(o,l))return s==="all"&&(this._pt=0),fs(this);for(f=this._op=this._op||[],s!=="all"&&(ze(s)&&(_={},rn(s,function(M){return _[M]=1}),s=_),s=gp(o,s)),p=o.length;p--;)if(~l.indexOf(o[p])){h=c[p],s==="all"?(f[p]=s,g=h,d={}):(d=f[p]=f[p]||{},g=s);for(_ in g)m=h&&h[_],m&&((!("kill"in m.d)||m.d.kill(_)===!0)&&Ha(this,m,"_pt"),delete h[_]),d!=="all"&&(d[_]=1)}return this._initted&&!this._pt&&u&&fs(this),this},t.to=function(i,s){return new t(i,s,arguments[2])},t.from=function(i,s){return xs(1,arguments)},t.delayedCall=function(i,s,a,o){return new t(s,0,{immediateRender:!1,lazy:!1,overwrite:!1,delay:i,onComplete:s,onReverseComplete:s,onCompleteParams:a,onReverseCompleteParams:a,callbackScope:o})},t.fromTo=function(i,s,a){return xs(2,arguments)},t.set=function(i,s){return s.duration=0,s.repeatDelay||(s.repeat=0),new t(i,s)},t.killTweensOf=function(i,s,a){return be.killTweensOf(i,s,a)},t})(Ps);Mn(Ie.prototype,{_targets:[],_lazy:0,_startAt:0,_op:0,_onInit:0});rn("staggerTo,staggerFrom,staggerFromTo",function(r){Ie[r]=function(){var t=new en,e=jo.call(arguments,0);return e.splice(r==="staggerFromTo"?5:4,0,0),t[r].apply(t,e)}});var cc=function(t,e,n){return t[e]=n},df=function(t,e,n){return t[e](n)},vp=function(t,e,n,i){return t[e](i.fp,n)},Mp=function(t,e,n){return t.setAttribute(e,n)},uc=function(t,e){return Re(t[e])?df:jl(t[e])&&t.setAttribute?Mp:cc},pf=function(t,e){return e.set(e.t,e.p,Math.round((e.s+e.c*t)*1e6)/1e6,e)},Sp=function(t,e){return e.set(e.t,e.p,!!(e.s+e.c*t),e)},mf=function(t,e){var n=e._pt,i="";if(!t&&e.b)i=e.b;else if(t===1&&e.e)i=e.e;else{for(;n;)i=n.p+(n.m?n.m(n.s+n.c*t):Math.round((n.s+n.c*t)*1e4)/1e4)+i,n=n._next;i+=e.c}e.set(e.t,e.p,i,e)},hc=function(t,e){for(var n=e._pt;n;)n.r(t,n.d),n=n._next},yp=function(t,e,n,i){for(var s=this._pt,a;s;)a=s._next,s.p===i&&s.modifier(t,e,n),s=a},bp=function(t){for(var e=this._pt,n,i;e;)i=e._next,e.p===t&&!e.op||e.op===t?Ha(this,e,"_pt"):e.dep||(n=1),e=i;return!n},Tp=function(t,e,n,i){i.mSet(t,e,i.m.call(i.tween,n,i.mt),i)},_f=function(t){for(var e=t._pt,n,i,s,a;e;){for(n=e._next,i=s;i&&i.pr>e.pr;)i=i._next;(e._prev=i?i._prev:a)?e._prev._next=e:s=e,(e._next=i)?i._prev=e:a=e,e=n}t._pt=s},sn=(function(){function r(e,n,i,s,a,o,l,c,u){this.t=n,this.s=s,this.c=a,this.p=i,this.r=o||pf,this.d=l||this,this.set=c||cc,this.pr=u||0,this._next=e,e&&(e._prev=this)}var t=r.prototype;return t.modifier=function(n,i,s){this.mSet=this.mSet||this.set,this.set=Tp,this.m=n,this.mt=s,this.tween=i},r})();rn(rc+"parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger,easeReverse",function(r){return ic[r]=1});vn.TweenMax=vn.TweenLite=Ie;vn.TimelineLite=vn.TimelineMax=en;be=new en({sortChildren:!1,defaults:Es,autoRemoveChildren:!0,id:"root",smoothChildTiming:!0});gn.stringFilter=of;var rr=[],va={},Ep=[],lu=0,wp=0,ro=function(t){return(va[t]||Ep).map(function(e){return e()})},il=function(){var t=Date.now(),e=[];t-lu>2&&(ro("matchMediaInit"),rr.forEach(function(n){var i=n.queries,s=n.conditions,a,o,l,c;for(o in i)a=Zn.matchMedia(i[o]).matches,a&&(l=1),a!==s[o]&&(s[o]=a,c=1);c&&(n.revert(),l&&e.push(n))}),ro("matchMediaRevert"),e.forEach(function(n){return n.onMatch(n,function(i){return n.add(null,i)})}),lu=t,ro("matchMedia"))},gf=(function(){function r(e,n){this.selector=n&&tl(n),this.data=[],this._r=[],this.isReverted=!1,this.id=wp++,e&&this.add(e)}var t=r.prototype;return t.add=function(n,i,s){Re(n)&&(s=i,i=n,n=Re);var a=this,o=function(){var c=Se,u=a.selector,f;return c&&c!==a&&c.data.push(a),s&&(a.selector=tl(s)),Se=a,f=i.apply(a,arguments),Re(f)&&a._r.push(f),Se=c,a.selector=u,a.isReverted=!1,f};return a.last=o,n===Re?o(a,function(l){return a.add(null,l)}):n?a[n]=o:o},t.ignore=function(n){var i=Se;Se=null,n(this),Se=i},t.getTweens=function(){var n=[];return this.data.forEach(function(i){return i instanceof r?n.push.apply(n,i.getTweens()):i instanceof Ie&&!(i.parent&&i.parent.data==="nested")&&n.push(i)}),n},t.clear=function(){this._r.length=this.data.length=0},t.kill=function(n,i){var s=this;if(n?(function(){for(var o=s.getTweens(),l=s.data.length,c;l--;)c=s.data[l],c.data==="isFlip"&&(c.revert(),c.getChildren(!0,!0,!1).forEach(function(u){return o.splice(o.indexOf(u),1)}));for(o.map(function(u){return{g:u._dur||u._delay||u._sat&&!u._sat.vars.immediateRender?u.globalTime(0):-1/0,t:u}}).sort(function(u,f){return f.g-u.g||-1/0}).forEach(function(u){return u.t.revert(n)}),l=s.data.length;l--;)c=s.data[l],c instanceof en?c.data!=="nested"&&(c.scrollTrigger&&c.scrollTrigger.revert(),c.kill()):!(c instanceof Ie)&&c.revert&&c.revert(n);s._r.forEach(function(u){return u(n,s)}),s.isReverted=!0})():this.data.forEach(function(o){return o.kill&&o.kill()}),this.clear(),i)for(var a=rr.length;a--;)rr[a].id===this.id&&rr.splice(a,1)},t.revert=function(n){this.kill(n||{})},r})(),Ap=(function(){function r(e){this.contexts=[],this.scope=e,Se&&Se.data.push(this)}var t=r.prototype;return t.add=function(n,i,s){ii(n)||(n={matches:n});var a=new gf(0,s||this.scope),o=a.conditions={},l,c,u;Se&&!a.selector&&(a.selector=Se.selector),this.contexts.push(a),i=a.add("onMatch",i),a.queries=n;for(c in n)c==="all"?u=1:(l=Zn.matchMedia(n[c]),l&&(rr.indexOf(a)<0&&rr.push(a),(o[c]=l.matches)&&(u=1),l.addListener?l.addListener(il):l.addEventListener("change",il)));return u&&i(a,function(f){return a.add(null,f)}),this},t.revert=function(n){this.kill(n||{})},t.kill=function(n){this.contexts.forEach(function(i){return i.kill(n,!0)})},r})(),La={registerPlugin:function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];e.forEach(function(i){return rf(i)})},timeline:function(t){return new en(t)},getTweensOf:function(t,e){return be.getTweensOf(t,e)},getProperty:function(t,e,n,i){ze(t)&&(t=Rn(t)[0]);var s=er(t||{}).get,a=n?Wh:Hh;return n==="native"&&(n=""),t&&(e?a((hn[e]&&hn[e].get||s)(t,e,n,i)):function(o,l,c){return a((hn[o]&&hn[o].get||s)(t,o,l,c))})},quickSetter:function(t,e,n){if(t=Rn(t),t.length>1){var i=t.map(function(u){return ln.quickSetter(u,e,n)}),s=i.length;return function(u){for(var f=s;f--;)i[f](u)}}t=t[0]||{};var a=hn[e],o=er(t),l=o.harness&&(o.harness.aliases||{})[e]||e,c=a?function(u){var f=new a;Ur._pt=0,f.init(t,n?u+n:u,Ur,0,[t]),f.render(1,f),Ur._pt&&hc(1,Ur)}:o.set(t,l);return a?c:function(u){return c(t,l,n?u+n:u,o,1)}},quickTo:function(t,e,n){var i,s=ln.to(t,Mn((i={},i[e]="+=0.1",i.paused=!0,i.stagger=0,i),n||{})),a=function(l,c,u){return s.resetTo(e,l,c,u)};return a.tween=s,a},isTweening:function(t){return be.getTweensOf(t,!0).length>0},defaults:function(t){return t&&t.ease&&(t.ease=ir(t.ease,Es.ease)),iu(Es,t||{})},config:function(t){return iu(gn,t||{})},registerEffect:function(t){var e=t.name,n=t.effect,i=t.plugins,s=t.defaults,a=t.extendTimeline;(i||"").split(",").forEach(function(o){return o&&!hn[o]&&!vn[o]&&ws(e+" effect requires "+o+" plugin.")}),to[e]=function(o,l,c){return n(Rn(o),Mn(l||{},s),c)},a&&(en.prototype[e]=function(o,l,c){return this.add(to[e](o,ii(l)?l:(c=l)&&{},this),c)})},registerEase:function(t,e){se[t]=ir(e)},parseEase:function(t,e){return arguments.length?ir(t,e):se},getById:function(t){return be.getById(t)},exportRoot:function(t,e){t===void 0&&(t={});var n=new en(t),i,s;for(n.smoothChildTiming=nn(t.smoothChildTiming),be.remove(n),n._dp=0,n._time=n._tTime=be._time,i=be._first;i;)s=i._next,(e||!(!i._dur&&i instanceof Ie&&i.vars.onComplete===i._targets[0]))&&$n(n,i,i._start-i._delay),i=s;return $n(be,n,0),n},context:function(t,e){return t?new gf(t,e):Se},matchMedia:function(t){return new Ap(t)},matchMediaRefresh:function(){return rr.forEach(function(t){var e=t.conditions,n,i;for(i in e)e[i]&&(e[i]=!1,n=1);n&&t.revert()})||il()},addEventListener:function(t,e){var n=va[t]||(va[t]=[]);~n.indexOf(e)||n.push(e)},removeEventListener:function(t,e){var n=va[t],i=n&&n.indexOf(e);i>=0&&n.splice(i,1)},utils:{wrap:rp,wrapYoyo:sp,distribute:Jh,random:jh,snap:Qh,normalize:ip,getUnit:Ye,clamp:jd,splitColor:sf,toArray:Rn,selector:tl,mapRange:ef,pipe:ep,unitize:np,interpolate:ap,shuffle:$h},install:Bh,effects:to,ticker:dn,updateRoot:en.updateRoot,plugins:hn,globalTimeline:be,core:{PropTween:sn,globals:zh,Tween:Ie,Timeline:en,Animation:Ps,getCache:er,_removeLinkedListItem:Ha,reverting:function(){return Ve},context:function(t){return t&&Se&&(Se.data.push(t),t._ctx=Se),Se},suppressOverwrites:function(t){return Ql=t}}};rn("to,from,fromTo,delayedCall,set,killTweensOf",function(r){return La[r]=Ie[r]});dn.add(en.updateRoot);Ur=La.to({},{duration:0});var Rp=function(t,e){for(var n=t._pt;n&&n.p!==e&&n.op!==e&&n.fp!==e;)n=n._next;return n},Cp=function(t,e){var n=t._targets,i,s,a;for(i in e)for(s=n.length;s--;)a=t._ptLookup[s][i],a&&(a=a.d)&&(a._pt&&(a=Rp(a,i)),a&&a.modifier&&a.modifier(e[i],t,n[s],i))},so=function(t,e){return{name:t,headless:1,rawVars:1,init:function(i,s,a){a._onInit=function(o){var l,c;if(ze(s)&&(l={},rn(s,function(u){return l[u]=1}),s=l),e){l={};for(c in s)l[c]=e(s[c]);s=l}Cp(o,s)}}}},ln=La.registerPlugin({name:"attr",init:function(t,e,n,i,s){var a,o,l;this.tween=n;for(a in e)l=t.getAttribute(a)||"",o=this.add(t,"setAttribute",(l||0)+"",e[a],i,s,0,0,a),o.op=a,o.b=l,this._props.push(a)},render:function(t,e){for(var n=e._pt;n;)Ve?n.set(n.t,n.p,n.b,n):n.r(t,n.d),n=n._next}},{name:"endArray",headless:1,init:function(t,e){for(var n=e.length;n--;)this.add(t,n,t[n]||0,e[n],0,0,0,0,0,1)}},so("roundProps",el),so("modifiers"),so("snap",Qh))||La;Ie.version=en.version=ln.version="3.15.0";Oh=1;tc()&&Yr();se.Power0;se.Power1;se.Power2;se.Power3;se.Power4;se.Linear;se.Quad;se.Cubic;se.Quart;se.Quint;se.Strong;se.Elastic;se.Back;se.SteppedEase;se.Bounce;se.Sine;se.Expo;se.Circ;/*!
 * CSSPlugin 3.15.0
 * https://gsap.com
 *
 * Copyright 2008-2026, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license
 * @author: Jack Doyle, jack@greensock.com
*/var cu,Di,zr,fc,Qi,uu,dc,Pp=function(){return typeof window<"u"},gi={},Ji=180/Math.PI,kr=Math.PI/180,_r=Math.atan2,hu=1e8,pc=/([A-Z])/g,Lp=/(left|right|width|margin|padding|x)/i,Dp=/[\s,\(]\S/,Qn={autoAlpha:"opacity,visibility",scale:"scaleX,scaleY",alpha:"opacity"},rl=function(t,e){return e.set(e.t,e.p,Math.round((e.s+e.c*t)*1e4)/1e4+e.u,e)},Ip=function(t,e){return e.set(e.t,e.p,t===1?e.e:Math.round((e.s+e.c*t)*1e4)/1e4+e.u,e)},Np=function(t,e){return e.set(e.t,e.p,t?Math.round((e.s+e.c*t)*1e4)/1e4+e.u:e.b,e)},Up=function(t,e){return e.set(e.t,e.p,t===1?e.e:t?Math.round((e.s+e.c*t)*1e4)/1e4+e.u:e.b,e)},Fp=function(t,e){var n=e.s+e.c*t;e.set(e.t,e.p,~~(n+(n<0?-.5:.5))+e.u,e)},xf=function(t,e){return e.set(e.t,e.p,t?e.e:e.b,e)},vf=function(t,e){return e.set(e.t,e.p,t!==1?e.b:e.e,e)},Op=function(t,e,n){return t.style[e]=n},Bp=function(t,e,n){return t.style.setProperty(e,n)},zp=function(t,e,n){return t._gsap[e]=n},kp=function(t,e,n){return t._gsap.scaleX=t._gsap.scaleY=n},Gp=function(t,e,n,i,s){var a=t._gsap;a.scaleX=a.scaleY=n,a.renderTransform(s,a)},Vp=function(t,e,n,i,s){var a=t._gsap;a[e]=n,a.renderTransform(s,a)},Te="transform",an=Te+"Origin",Hp=function r(t,e){var n=this,i=this.target,s=i.style,a=i._gsap;if(t in gi&&s){if(this.tfm=this.tfm||{},t!=="transform")t=Qn[t]||t,~t.indexOf(",")?t.split(",").forEach(function(o){return n.tfm[o]=hi(i,o)}):this.tfm[t]=a.x?a[t]:hi(i,t),t===an&&(this.tfm.zOrigin=a.zOrigin);else return Qn.transform.split(",").forEach(function(o){return r.call(n,o,e)});if(this.props.indexOf(Te)>=0)return;a.svg&&(this.svgo=i.getAttribute("data-svg-origin"),this.props.push(an,e,"")),t=Te}(s||e)&&this.props.push(t,e,s[t])},Mf=function(t){t.translate&&(t.removeProperty("translate"),t.removeProperty("scale"),t.removeProperty("rotate"))},Wp=function(){var t=this.props,e=this.target,n=e.style,i=e._gsap,s,a;for(s=0;s<t.length;s+=3)t[s+1]?t[s+1]===2?e[t[s]](t[s+2]):e[t[s]]=t[s+2]:t[s+2]?n[t[s]]=t[s+2]:n.removeProperty(t[s].substr(0,2)==="--"?t[s]:t[s].replace(pc,"-$1").toLowerCase());if(this.tfm){for(a in this.tfm)i[a]=this.tfm[a];i.svg&&(i.renderTransform(),e.setAttribute("data-svg-origin",this.svgo||"")),s=dc(),(!s||!s.isStart)&&!n[Te]&&(Mf(n),i.zOrigin&&n[an]&&(n[an]+=" "+i.zOrigin+"px",i.zOrigin=0,i.renderTransform()),i.uncache=1)}},Sf=function(t,e){var n={target:t,props:[],revert:Wp,save:Hp};return t._gsap||ln.core.getCache(t),e&&t.style&&t.nodeType&&e.split(",").forEach(function(i){return n.save(i)}),n},yf,sl=function(t,e){var n=Di.createElementNS?Di.createElementNS((e||"http://www.w3.org/1999/xhtml").replace(/^https/,"http"),t):Di.createElement(t);return n&&n.style?n:Di.createElement(t)},_n=function r(t,e,n){var i=getComputedStyle(t);return i[e]||i.getPropertyValue(e.replace(pc,"-$1").toLowerCase())||i.getPropertyValue(e)||!n&&r(t,Zr(e)||e,1)||""},fu="O,Moz,ms,Ms,Webkit".split(","),Zr=function(t,e,n){var i=e||Qi,s=i.style,a=5;if(t in s&&!n)return t;for(t=t.charAt(0).toUpperCase()+t.substr(1);a--&&!(fu[a]+t in s););return a<0?null:(a===3?"ms":a>=0?fu[a]:"")+t},al=function(){Pp()&&window.document&&(cu=window,Di=cu.document,zr=Di.documentElement,Qi=sl("div")||{style:{}},sl("div"),Te=Zr(Te),an=Te+"Origin",Qi.style.cssText="border-width:0;line-height:0;position:absolute;padding:0",yf=!!Zr("perspective"),dc=ln.core.reverting,fc=1)},du=function(t){var e=t.ownerSVGElement,n=sl("svg",e&&e.getAttribute("xmlns")||"http://www.w3.org/2000/svg"),i=t.cloneNode(!0),s;i.style.display="block",n.appendChild(i),zr.appendChild(n);try{s=i.getBBox()}catch{}return n.removeChild(i),zr.removeChild(n),s},pu=function(t,e){for(var n=e.length;n--;)if(t.hasAttribute(e[n]))return t.getAttribute(e[n])},bf=function(t){var e,n;try{e=t.getBBox()}catch{e=du(t),n=1}return e&&(e.width||e.height)||n||(e=du(t)),e&&!e.width&&!e.x&&!e.y?{x:+pu(t,["x","cx","x1"])||0,y:+pu(t,["y","cy","y1"])||0,width:0,height:0}:e},Tf=function(t){return!!(t.getCTM&&(!t.parentNode||t.ownerSVGElement)&&bf(t))},Bi=function(t,e){if(e){var n=t.style,i;e in gi&&e!==an&&(e=Te),n.removeProperty?(i=e.substr(0,2),(i==="ms"||e.substr(0,6)==="webkit")&&(e="-"+e),n.removeProperty(i==="--"?e:e.replace(pc,"-$1").toLowerCase())):n.removeAttribute(e)}},Ii=function(t,e,n,i,s,a){var o=new sn(t._pt,e,n,0,1,a?vf:xf);return t._pt=o,o.b=i,o.e=s,t._props.push(n),o},mu={deg:1,rad:1,turn:1},Xp={grid:1,flex:1},zi=function r(t,e,n,i){var s=parseFloat(n)||0,a=(n+"").trim().substr((s+"").length)||"px",o=Qi.style,l=Lp.test(e),c=t.tagName.toLowerCase()==="svg",u=(c?"client":"offset")+(l?"Width":"Height"),f=100,h=i==="px",d=i==="%",g,_,m,p;if(i===a||!s||mu[i]||mu[a])return s;if(a!=="px"&&!h&&(s=r(t,e,n,"px")),p=t.getCTM&&Tf(t),(d||a==="%")&&(gi[e]||~e.indexOf("adius")))return g=p?t.getBBox()[l?"width":"height"]:t[u],Pe(d?s/g*f:s/100*g);if(o[l?"width":"height"]=f+(h?a:i),_=i!=="rem"&&~e.indexOf("adius")||i==="em"&&t.appendChild&&!c?t:t.parentNode,p&&(_=(t.ownerSVGElement||{}).parentNode),(!_||_===Di||!_.appendChild)&&(_=Di.body),m=_._gsap,m&&d&&m.width&&l&&m.time===dn.time&&!m.uncache)return Pe(s/m.width*f);if(d&&(e==="height"||e==="width")){var M=t.style[e];t.style[e]=f+i,g=t[u],M?t.style[e]=M:Bi(t,e)}else(d||a==="%")&&!Xp[_n(_,"display")]&&(o.position=_n(t,"position")),_===t&&(o.position="static"),_.appendChild(Qi),g=Qi[u],_.removeChild(Qi),o.position="absolute";return l&&d&&(m=er(_),m.time=dn.time,m.width=_[u]),Pe(h?g*s/f:g&&s?f/g*s:0)},hi=function(t,e,n,i){var s;return fc||al(),e in Qn&&e!=="transform"&&(e=Qn[e],~e.indexOf(",")&&(e=e.split(",")[0])),gi[e]&&e!=="transform"?(s=Ds(t,i),s=e!=="transformOrigin"?s[e]:s.svg?s.origin:Ia(_n(t,an))+" "+s.zOrigin+"px"):(s=t.style[e],(!s||s==="auto"||i||~(s+"").indexOf("calc("))&&(s=Da[e]&&Da[e](t,e,n)||_n(t,e)||Gh(t,e)||(e==="opacity"?1:0))),n&&!~(s+"").trim().indexOf(" ")?zi(t,e,s,n)+n:s},qp=function(t,e,n,i){if(!n||n==="none"){var s=Zr(e,t,1),a=s&&_n(t,s,1);a&&a!==n?(e=s,n=a):e==="borderColor"&&(n=_n(t,"borderTopColor"))}var o=new sn(this._pt,t.style,e,0,1,mf),l=0,c=0,u,f,h,d,g,_,m,p,M,T,x,y;if(o.b=n,o.e=i,n+="",i+="",i.substring(0,6)==="var(--"&&(i=_n(t,i.substring(4,i.indexOf(")")))),i==="auto"&&(_=t.style[e],t.style[e]=i,i=_n(t,e)||i,_?t.style[e]=_:Bi(t,e)),u=[n,i],of(u),n=u[0],i=u[1],h=n.match(Nr)||[],y=i.match(Nr)||[],y.length){for(;f=Nr.exec(i);)m=f[0],M=i.substring(l,f.index),g?g=(g+1)%5:(M.substr(-5)==="rgba("||M.substr(-5)==="hsla(")&&(g=1),m!==(_=h[c++]||"")&&(d=parseFloat(_)||0,x=_.substr((d+"").length),m.charAt(1)==="="&&(m=Br(d,m)+x),p=parseFloat(m),T=m.substr((p+"").length),l=Nr.lastIndex-T.length,T||(T=T||gn.units[e]||x,l===i.length&&(i+=T,o.e+=T)),x!==T&&(d=zi(t,e,_,T)||0),o._pt={_next:o._pt,p:M||c===1?M:",",s:d,c:p-d,m:g&&g<4||e==="zIndex"?Math.round:0});o.c=l<i.length?i.substring(l,i.length):""}else o.r=e==="display"&&i==="none"?vf:xf;return Fh.test(i)&&(o.e=0),this._pt=o,o},_u={top:"0%",bottom:"100%",left:"0%",right:"100%",center:"50%"},Yp=function(t){var e=t.split(" "),n=e[0],i=e[1]||"50%";return(n==="top"||n==="bottom"||i==="left"||i==="right")&&(t=n,n=i,i=t),e[0]=_u[n]||n,e[1]=_u[i]||i,e.join(" ")},Zp=function(t,e){if(e.tween&&e.tween._time===e.tween._dur){var n=e.t,i=n.style,s=e.u,a=n._gsap,o,l,c;if(s==="all"||s===!0)i.cssText="",l=1;else for(s=s.split(","),c=s.length;--c>-1;)o=s[c],gi[o]&&(l=1,o=o==="transformOrigin"?an:Te),Bi(n,o);l&&(Bi(n,Te),a&&(a.svg&&n.removeAttribute("transform"),i.scale=i.rotate=i.translate="none",Ds(n,1),a.uncache=1,Mf(i)))}},Da={clearProps:function(t,e,n,i,s){if(s.data!=="isFromStart"){var a=t._pt=new sn(t._pt,e,n,0,0,Zp);return a.u=i,a.pr=-10,a.tween=s,t._props.push(n),1}}},Ls=[1,0,0,1,0,0],Ef={},wf=function(t){return t==="matrix(1, 0, 0, 1, 0, 0)"||t==="none"||!t},gu=function(t){var e=_n(t,Te);return wf(e)?Ls:e.substr(7).match(Uh).map(Pe)},mc=function(t,e){var n=t._gsap||er(t),i=t.style,s=gu(t),a,o,l,c;return n.svg&&t.getAttribute("transform")?(l=t.transform.baseVal.consolidate().matrix,s=[l.a,l.b,l.c,l.d,l.e,l.f],s.join(",")==="1,0,0,1,0,0"?Ls:s):(s===Ls&&!t.offsetParent&&t!==zr&&!n.svg&&(l=i.display,i.display="block",a=t.parentNode,(!a||!t.offsetParent&&!t.getBoundingClientRect().width)&&(c=1,o=t.nextElementSibling,zr.appendChild(t)),s=gu(t),l?i.display=l:Bi(t,"display"),c&&(o?a.insertBefore(t,o):a?a.appendChild(t):zr.removeChild(t))),e&&s.length>6?[s[0],s[1],s[4],s[5],s[12],s[13]]:s)},ol=function(t,e,n,i,s,a){var o=t._gsap,l=s||mc(t,!0),c=o.xOrigin||0,u=o.yOrigin||0,f=o.xOffset||0,h=o.yOffset||0,d=l[0],g=l[1],_=l[2],m=l[3],p=l[4],M=l[5],T=e.split(" "),x=parseFloat(T[0])||0,y=parseFloat(T[1])||0,E,A,v,b;n?l!==Ls&&(A=d*m-g*_)&&(v=x*(m/A)+y*(-_/A)+(_*M-m*p)/A,b=x*(-g/A)+y*(d/A)-(d*M-g*p)/A,x=v,y=b):(E=bf(t),x=E.x+(~T[0].indexOf("%")?x/100*E.width:x),y=E.y+(~(T[1]||T[0]).indexOf("%")?y/100*E.height:y)),i||i!==!1&&o.smooth?(p=x-c,M=y-u,o.xOffset=f+(p*d+M*_)-p,o.yOffset=h+(p*g+M*m)-M):o.xOffset=o.yOffset=0,o.xOrigin=x,o.yOrigin=y,o.smooth=!!i,o.origin=e,o.originIsAbsolute=!!n,t.style[an]="0px 0px",a&&(Ii(a,o,"xOrigin",c,x),Ii(a,o,"yOrigin",u,y),Ii(a,o,"xOffset",f,o.xOffset),Ii(a,o,"yOffset",h,o.yOffset)),t.setAttribute("data-svg-origin",x+" "+y)},Ds=function(t,e){var n=t._gsap||new cf(t);if("x"in n&&!e&&!n.uncache)return n;var i=t.style,s=n.scaleX<0,a="px",o="deg",l=getComputedStyle(t),c=_n(t,an)||"0",u,f,h,d,g,_,m,p,M,T,x,y,E,A,v,b,R,P,N,z,L,B,X,G,et,Y,J,Q,bt,xt,Zt,Ht;return u=f=h=_=m=p=M=T=x=0,d=g=1,n.svg=!!(t.getCTM&&Tf(t)),l.translate&&((l.translate!=="none"||l.scale!=="none"||l.rotate!=="none")&&(i[Te]=(l.translate!=="none"?"translate3d("+(l.translate+" 0 0").split(" ").slice(0,3).join(", ")+") ":"")+(l.rotate!=="none"?"rotate("+l.rotate+") ":"")+(l.scale!=="none"?"scale("+l.scale.split(" ").join(",")+") ":"")+(l[Te]!=="none"?l[Te]:"")),i.scale=i.rotate=i.translate="none"),A=mc(t,n.svg),n.svg&&(n.uncache?(et=t.getBBox(),c=n.xOrigin-et.x+"px "+(n.yOrigin-et.y)+"px",G=""):G=!e&&t.getAttribute("data-svg-origin"),ol(t,G||c,!!G||n.originIsAbsolute,n.smooth!==!1,A)),y=n.xOrigin||0,E=n.yOrigin||0,A!==Ls&&(P=A[0],N=A[1],z=A[2],L=A[3],u=B=A[4],f=X=A[5],A.length===6?(d=Math.sqrt(P*P+N*N),g=Math.sqrt(L*L+z*z),_=P||N?_r(N,P)*Ji:0,M=z||L?_r(z,L)*Ji+_:0,M&&(g*=Math.abs(Math.cos(M*kr))),n.svg&&(u-=y-(y*P+E*z),f-=E-(y*N+E*L))):(Ht=A[6],xt=A[7],J=A[8],Q=A[9],bt=A[10],Zt=A[11],u=A[12],f=A[13],h=A[14],v=_r(Ht,bt),m=v*Ji,v&&(b=Math.cos(-v),R=Math.sin(-v),G=B*b+J*R,et=X*b+Q*R,Y=Ht*b+bt*R,J=B*-R+J*b,Q=X*-R+Q*b,bt=Ht*-R+bt*b,Zt=xt*-R+Zt*b,B=G,X=et,Ht=Y),v=_r(-z,bt),p=v*Ji,v&&(b=Math.cos(-v),R=Math.sin(-v),G=P*b-J*R,et=N*b-Q*R,Y=z*b-bt*R,Zt=L*R+Zt*b,P=G,N=et,z=Y),v=_r(N,P),_=v*Ji,v&&(b=Math.cos(v),R=Math.sin(v),G=P*b+N*R,et=B*b+X*R,N=N*b-P*R,X=X*b-B*R,P=G,B=et),m&&Math.abs(m)+Math.abs(_)>359.9&&(m=_=0,p=180-p),d=Pe(Math.sqrt(P*P+N*N+z*z)),g=Pe(Math.sqrt(X*X+Ht*Ht)),v=_r(B,X),M=Math.abs(v)>2e-4?v*Ji:0,x=Zt?1/(Zt<0?-Zt:Zt):0),n.svg&&(G=t.getAttribute("transform"),n.forceCSS=t.setAttribute("transform","")||!wf(_n(t,Te)),G&&t.setAttribute("transform",G))),Math.abs(M)>90&&Math.abs(M)<270&&(s?(d*=-1,M+=_<=0?180:-180,_+=_<=0?180:-180):(g*=-1,M+=M<=0?180:-180)),e=e||n.uncache,n.x=u-((n.xPercent=u&&(!e&&n.xPercent||(Math.round(t.offsetWidth/2)===Math.round(-u)?-50:0)))?t.offsetWidth*n.xPercent/100:0)+a,n.y=f-((n.yPercent=f&&(!e&&n.yPercent||(Math.round(t.offsetHeight/2)===Math.round(-f)?-50:0)))?t.offsetHeight*n.yPercent/100:0)+a,n.z=h+a,n.scaleX=Pe(d),n.scaleY=Pe(g),n.rotation=Pe(_)+o,n.rotationX=Pe(m)+o,n.rotationY=Pe(p)+o,n.skewX=M+o,n.skewY=T+o,n.transformPerspective=x+a,(n.zOrigin=parseFloat(c.split(" ")[2])||!e&&n.zOrigin||0)&&(i[an]=Ia(c)),n.xOffset=n.yOffset=0,n.force3D=gn.force3D,n.renderTransform=n.svg?$p:yf?Af:Kp,n.uncache=0,n},Ia=function(t){return(t=t.split(" "))[0]+" "+t[1]},ao=function(t,e,n){var i=Ye(e);return Pe(parseFloat(e)+parseFloat(zi(t,"x",n+"px",i)))+i},Kp=function(t,e){e.z="0px",e.rotationY=e.rotationX="0deg",e.force3D=0,Af(t,e)},Vi="0deg",rs="0px",Hi=") ",Af=function(t,e){var n=e||this,i=n.xPercent,s=n.yPercent,a=n.x,o=n.y,l=n.z,c=n.rotation,u=n.rotationY,f=n.rotationX,h=n.skewX,d=n.skewY,g=n.scaleX,_=n.scaleY,m=n.transformPerspective,p=n.force3D,M=n.target,T=n.zOrigin,x="",y=p==="auto"&&t&&t!==1||p===!0;if(T&&(f!==Vi||u!==Vi)){var E=parseFloat(u)*kr,A=Math.sin(E),v=Math.cos(E),b;E=parseFloat(f)*kr,b=Math.cos(E),a=ao(M,a,A*b*-T),o=ao(M,o,-Math.sin(E)*-T),l=ao(M,l,v*b*-T+T)}m!==rs&&(x+="perspective("+m+Hi),(i||s)&&(x+="translate("+i+"%, "+s+"%) "),(y||a!==rs||o!==rs||l!==rs)&&(x+=l!==rs||y?"translate3d("+a+", "+o+", "+l+") ":"translate("+a+", "+o+Hi),c!==Vi&&(x+="rotate("+c+Hi),u!==Vi&&(x+="rotateY("+u+Hi),f!==Vi&&(x+="rotateX("+f+Hi),(h!==Vi||d!==Vi)&&(x+="skew("+h+", "+d+Hi),(g!==1||_!==1)&&(x+="scale("+g+", "+_+Hi),M.style[Te]=x||"translate(0, 0)"},$p=function(t,e){var n=e||this,i=n.xPercent,s=n.yPercent,a=n.x,o=n.y,l=n.rotation,c=n.skewX,u=n.skewY,f=n.scaleX,h=n.scaleY,d=n.target,g=n.xOrigin,_=n.yOrigin,m=n.xOffset,p=n.yOffset,M=n.forceCSS,T=parseFloat(a),x=parseFloat(o),y,E,A,v,b;l=parseFloat(l),c=parseFloat(c),u=parseFloat(u),u&&(u=parseFloat(u),c+=u,l+=u),l||c?(l*=kr,c*=kr,y=Math.cos(l)*f,E=Math.sin(l)*f,A=Math.sin(l-c)*-h,v=Math.cos(l-c)*h,c&&(u*=kr,b=Math.tan(c-u),b=Math.sqrt(1+b*b),A*=b,v*=b,u&&(b=Math.tan(u),b=Math.sqrt(1+b*b),y*=b,E*=b)),y=Pe(y),E=Pe(E),A=Pe(A),v=Pe(v)):(y=f,v=h,E=A=0),(T&&!~(a+"").indexOf("px")||x&&!~(o+"").indexOf("px"))&&(T=zi(d,"x",a,"px"),x=zi(d,"y",o,"px")),(g||_||m||p)&&(T=Pe(T+g-(g*y+_*A)+m),x=Pe(x+_-(g*E+_*v)+p)),(i||s)&&(b=d.getBBox(),T=Pe(T+i/100*b.width),x=Pe(x+s/100*b.height)),b="matrix("+y+","+E+","+A+","+v+","+T+","+x+")",d.setAttribute("transform",b),M&&(d.style[Te]=b)},Jp=function(t,e,n,i,s){var a=360,o=ze(s),l=parseFloat(s)*(o&&~s.indexOf("rad")?Ji:1),c=l-i,u=i+c+"deg",f,h;return o&&(f=s.split("_")[1],f==="short"&&(c%=a,c!==c%(a/2)&&(c+=c<0?a:-a)),f==="cw"&&c<0?c=(c+a*hu)%a-~~(c/a)*a:f==="ccw"&&c>0&&(c=(c-a*hu)%a-~~(c/a)*a)),t._pt=h=new sn(t._pt,e,n,i,c,Ip),h.e=u,h.u="deg",t._props.push(n),h},xu=function(t,e){for(var n in e)t[n]=e[n];return t},Qp=function(t,e,n){var i=xu({},n._gsap),s="perspective,force3D,transformOrigin,svgOrigin",a=n.style,o,l,c,u,f,h,d,g;i.svg?(c=n.getAttribute("transform"),n.setAttribute("transform",""),a[Te]=e,o=Ds(n,1),Bi(n,Te),n.setAttribute("transform",c)):(c=getComputedStyle(n)[Te],a[Te]=e,o=Ds(n,1),a[Te]=c);for(l in gi)c=i[l],u=o[l],c!==u&&s.indexOf(l)<0&&(d=Ye(c),g=Ye(u),f=d!==g?zi(n,l,c,g):parseFloat(c),h=parseFloat(u),t._pt=new sn(t._pt,o,l,f,h-f,rl),t._pt.u=g||0,t._props.push(l));xu(o,i)};rn("padding,margin,Width,Radius",function(r,t){var e="Top",n="Right",i="Bottom",s="Left",a=(t<3?[e,n,i,s]:[e+s,e+n,i+n,i+s]).map(function(o){return t<2?r+o:"border"+o+r});Da[t>1?"border"+r:r]=function(o,l,c,u,f){var h,d;if(arguments.length<4)return h=a.map(function(g){return hi(o,g,c)}),d=h.join(" "),d.split(h[0]).length===5?h[0]:d;h=(u+"").split(" "),d={},a.forEach(function(g,_){return d[g]=h[_]=h[_]||h[(_-1)/2|0]}),o.init(l,d,f)}});var Rf={name:"css",register:al,targetTest:function(t){return t.style&&t.nodeType},init:function(t,e,n,i,s){var a=this._props,o=t.style,l=n.vars.startAt,c,u,f,h,d,g,_,m,p,M,T,x,y,E,A,v,b;fc||al(),this.styles=this.styles||Sf(t),v=this.styles.props,this.tween=n;for(_ in e)if(_!=="autoRound"&&(u=e[_],!(hn[_]&&uf(_,e,n,i,t,s)))){if(d=typeof u,g=Da[_],d==="function"&&(u=u.call(n,i,t,s),d=typeof u),d==="string"&&~u.indexOf("random(")&&(u=Rs(u)),g)g(this,t,_,u,n)&&(A=1);else if(_.substr(0,2)==="--")c=(getComputedStyle(t).getPropertyValue(_)+"").trim(),u+="",Fi.lastIndex=0,Fi.test(c)||(m=Ye(c),p=Ye(u),p?m!==p&&(c=zi(t,_,c,p)+p):m&&(u+=m)),this.add(o,"setProperty",c,u,i,s,0,0,_),a.push(_),v.push(_,0,o[_]);else if(d!=="undefined"){if(l&&_ in l?(c=typeof l[_]=="function"?l[_].call(n,i,t,s):l[_],ze(c)&&~c.indexOf("random(")&&(c=Rs(c)),Ye(c+"")||c==="auto"||(c+=gn.units[_]||Ye(hi(t,_))||""),(c+"").charAt(1)==="="&&(c=hi(t,_))):c=hi(t,_),h=parseFloat(c),M=d==="string"&&u.charAt(1)==="="&&u.substr(0,2),M&&(u=u.substr(2)),f=parseFloat(u),_ in Qn&&(_==="autoAlpha"&&(h===1&&hi(t,"visibility")==="hidden"&&f&&(h=0),v.push("visibility",0,o.visibility),Ii(this,o,"visibility",h?"inherit":"hidden",f?"inherit":"hidden",!f)),_!=="scale"&&_!=="transform"&&(_=Qn[_],~_.indexOf(",")&&(_=_.split(",")[0]))),T=_ in gi,T){if(this.styles.save(_),b=u,d==="string"&&u.substring(0,6)==="var(--"){if(u=_n(t,u.substring(4,u.indexOf(")"))),u.substring(0,5)==="calc("){var R=t.style.perspective;t.style.perspective=u,u=_n(t,"perspective"),R?t.style.perspective=R:Bi(t,"perspective")}f=parseFloat(u)}if(x||(y=t._gsap,y.renderTransform&&!e.parseTransform||Ds(t,e.parseTransform),E=e.smoothOrigin!==!1&&y.smooth,x=this._pt=new sn(this._pt,o,Te,0,1,y.renderTransform,y,0,-1),x.dep=1),_==="scale")this._pt=new sn(this._pt,y,"scaleY",y.scaleY,(M?Br(y.scaleY,M+f):f)-y.scaleY||0,rl),this._pt.u=0,a.push("scaleY",_),_+="X";else if(_==="transformOrigin"){v.push(an,0,o[an]),u=Yp(u),y.svg?ol(t,u,0,E,0,this):(p=parseFloat(u.split(" ")[2])||0,p!==y.zOrigin&&Ii(this,y,"zOrigin",y.zOrigin,p),Ii(this,o,_,Ia(c),Ia(u)));continue}else if(_==="svgOrigin"){ol(t,u,1,E,0,this);continue}else if(_ in Ef){Jp(this,y,_,h,M?Br(h,M+u):u);continue}else if(_==="smoothOrigin"){Ii(this,y,"smooth",y.smooth,u);continue}else if(_==="force3D"){y[_]=u;continue}else if(_==="transform"){Qp(this,u,t);continue}}else _ in o||(_=Zr(_)||_);if(T||(f||f===0)&&(h||h===0)&&!Dp.test(u)&&_ in o)m=(c+"").substr((h+"").length),f||(f=0),p=Ye(u)||(_ in gn.units?gn.units[_]:m),m!==p&&(h=zi(t,_,c,p)),this._pt=new sn(this._pt,T?y:o,_,h,(M?Br(h,M+f):f)-h,!T&&(p==="px"||_==="zIndex")&&e.autoRound!==!1?Fp:rl),this._pt.u=p||0,T&&b!==u?(this._pt.b=c,this._pt.e=b,this._pt.r=Up):m!==p&&p!=="%"&&(this._pt.b=c,this._pt.r=Np);else if(_ in o)qp.call(this,t,_,c,M?M+u:u);else if(_ in t)this.add(t,_,c||t[_],M?M+u:u,i,s);else if(_!=="parseTransform"){nc(_,u);continue}T||(_ in o?v.push(_,0,o[_]):typeof t[_]=="function"?v.push(_,2,t[_]()):v.push(_,1,c||t[_])),a.push(_)}}A&&_f(this)},render:function(t,e){if(e.tween._time||!dc())for(var n=e._pt;n;)n.r(t,n.d),n=n._next;else e.styles.revert()},get:hi,aliases:Qn,getSetter:function(t,e,n){var i=Qn[e];return i&&i.indexOf(",")<0&&(e=i),e in gi&&e!==an&&(t._gsap.x||hi(t,"x"))?n&&uu===n?e==="scale"?kp:zp:(uu=n||{})&&(e==="scale"?Gp:Vp):t.style&&!jl(t.style[e])?Op:~e.indexOf("-")?Bp:uc(t,e)},core:{_removeProperty:Bi,_getMatrix:mc}};ln.utils.checkPrefix=Zr;ln.core.getStyleSaver=Sf;(function(r,t,e,n){var i=rn(r+","+t+","+e,function(s){gi[s]=1});rn(t,function(s){gn.units[s]="deg",Ef[s]=1}),Qn[i[13]]=r+","+t,rn(n,function(s){var a=s.split(":");Qn[a[1]]=i[a[0]]})})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent","rotation,rotationX,rotationY,skewX,skewY","transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective","0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");rn("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective",function(r){gn.units[r]="px"});ln.registerPlugin(Rf);var ce=ln.registerPlugin(Rf)||ln;ce.core.Tween;/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const _c="186",jp=0,vu=1,tm=2,Ma=1,em=2,ps=3,ar=0,on=1,Jn=2,di=0,Ms=1,Mu=2,Su=3,yu=4,nm=5,Dr=100,im=101,rm=102,sm=103,am=104,om=200,lm=201,cm=202,um=203,Cf=204,Pf=205,hm=206,fm=207,dm=208,pm=209,mm=210,_m=211,gm=212,xm=213,vm=214,ll=0,cl=1,ul=2,Is=3,hl=4,fl=5,dl=6,pl=7,Lf=0,Mm=1,Sm=2,ni=0,Df=1,If=2,Nf=3,Uf=4,Ff=5,Of=6,Bf=7,zf=300,or=301,Kr=302,oo=303,lo=304,qa=306,ml=1e3,fi=1001,_l=1002,Ne=1003,ym=1004,qs=1005,Ze=1006,co=1007,ji=1008,pn=1009,kf=1010,Gf=1011,Ns=1012,gc=1013,zn=1014,jn=1015,kn=1016,xc=1017,vc=1018,Us=1020,Vf=35902,Hf=35899,Wf=1021,Xf=1022,Cn=1023,xi=1026,tr=1027,qf=1028,Mc=1029,lr=1030,Sc=1031,yc=1033,Sa=33776,ya=33777,ba=33778,Ta=33779,gl=35840,xl=35841,vl=35842,Ml=35843,Sl=36196,yl=37492,bl=37496,Tl=37488,El=37489,Na=37490,wl=37491,Al=37808,Rl=37809,Cl=37810,Pl=37811,Ll=37812,Dl=37813,Il=37814,Nl=37815,Ul=37816,Fl=37817,Ol=37818,Bl=37819,zl=37820,kl=37821,Gl=36492,Vl=36494,Hl=36495,Wl=36283,Xl=36284,Ua=36285,ql=36286,bm=3200,Fa=0,Tm=1,Pi="",fn="srgb",Oa="srgb-linear",Ba="linear",fe="srgb",uo=7680,Em=519,wm=512,Am=513,Rm=514,bc=515,Cm=516,Pm=517,Tc=518,Lm=519,Dm=35044,bu="300 es",ti=2e3,Fs=2001;function Im(r){for(let t=r.length-1;t>=0;--t)if(r[t]>=65535)return!0;return!1}function za(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Nm(){const r=za("canvas");return r.style.display="block",r}const Tu={};function Eu(...r){const t="THREE."+r.shift();console.log(t,...r)}function Yf(r){const t=r[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=r[1];e&&e.isStackTrace?r[0]+=" "+e.getLocation():r[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return r}function Wt(...r){r=Yf(r);const t="THREE."+r.shift();{const e=r[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...r)}}function le(...r){r=Yf(r);const t="THREE."+r.shift();{const e=r[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...r)}}function Gr(...r){const t=r.join(" ");t in Tu||(Tu[t]=!0,Wt(...r))}function Um(r,t,e){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(t,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}const Fm={[ll]:cl,[ul]:dl,[hl]:pl,[Is]:fl,[cl]:ll,[dl]:ul,[pl]:hl,[fl]:Is};class fr{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const i=n[t];if(i!==void 0){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let s=0,a=i.length;s<a;s++)i[s].call(this,t);t.target=null}}}const Xe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let wu=1234567;const Ss=Math.PI/180,Os=180/Math.PI;function dr(){const r=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Xe[r&255]+Xe[r>>8&255]+Xe[r>>16&255]+Xe[r>>24&255]+"-"+Xe[t&255]+Xe[t>>8&255]+"-"+Xe[t>>16&15|64]+Xe[t>>24&255]+"-"+Xe[e&63|128]+Xe[e>>8&255]+"-"+Xe[e>>16&255]+Xe[e>>24&255]+Xe[n&255]+Xe[n>>8&255]+Xe[n>>16&255]+Xe[n>>24&255]).toLowerCase()}function ee(r,t,e){return Math.max(t,Math.min(e,r))}function Ec(r,t){return(r%t+t)%t}function Om(r,t,e,n,i){return n+(r-t)*(i-n)/(e-t)}function Bm(r,t,e){return r!==t?(e-r)/(t-r):0}function ys(r,t,e){return(1-e)*r+e*t}function zm(r,t,e,n){return ys(r,t,1-Math.exp(-e*n))}function km(r,t=1){return t-Math.abs(Ec(r,t*2)-t)}function Gm(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*(3-2*r))}function Vm(r,t,e){return r<=t?0:r>=e?1:(r=(r-t)/(e-t),r*r*r*(r*(r*6-15)+10))}function Hm(r,t){return r+Math.floor(Math.random()*(t-r+1))}function Wm(r,t){return r+Math.random()*(t-r)}function Xm(r){return r*(.5-Math.random())}function qm(r){r!==void 0&&(wu=r);let t=wu+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Ym(r){return r*Ss}function Zm(r){return r*Os}function Km(r){return r>0&&Number.isInteger(r)&&2**Math.round(Math.log2(r))===r}function $m(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function Jm(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function Qm(r,t,e,n,i){const s=Math.cos,a=Math.sin,o=s(e/2),l=a(e/2),c=s((t+n)/2),u=a((t+n)/2),f=s((t-n)/2),h=a((t-n)/2),d=s((n-t)/2),g=a((n-t)/2);switch(i){case"XYX":r.set(o*u,l*f,l*h,o*c);break;case"YZY":r.set(l*h,o*u,l*f,o*c);break;case"ZXZ":r.set(l*f,l*h,o*u,o*c);break;case"XZX":r.set(o*u,l*g,l*d,o*c);break;case"YXY":r.set(l*d,o*u,l*g,o*c);break;case"ZYZ":r.set(l*g,l*d,o*u,o*c);break;default:Wt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Ir(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:case Uint8ClampedArray:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Je(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const jm={DEG2RAD:Ss,RAD2DEG:Os,generateUUID:dr,clamp:ee,euclideanModulo:Ec,mapLinear:Om,inverseLerp:Bm,lerp:ys,damp:zm,pingpong:km,smoothstep:Gm,smootherstep:Vm,randInt:Hm,randFloat:Wm,randFloatSpread:Xm,seededRandom:qm,degToRad:Ym,radToDeg:Zm,isPowerOfTwo:Km,ceilPowerOfTwo:$m,floorPowerOfTwo:Jm,setQuaternionFromProperEuler:Qm,normalize:Je,denormalize:Ir},zc=class zc{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=ee(this.x,t.x,e.x),this.y=ee(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=ee(this.x,t,e),this.y=ee(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ee(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ee(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,a=this.y-t.y;return this.x=s*n-a*i+t.x,this.y=s*i+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};zc.prototype.isVector2=!0;let ft=zc;class jr{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,a,o){let l=n[i+0],c=n[i+1],u=n[i+2],f=n[i+3],h=s[a+0],d=s[a+1],g=s[a+2],_=s[a+3];if(f!==_||l!==h||c!==d||u!==g){let m=l*h+c*d+u*g+f*_;m<0&&(h=-h,d=-d,g=-g,_=-_,m=-m);let p=1-o;if(m<.9995){const M=Math.acos(m),T=Math.sin(M);p=Math.sin(p*M)/T,o=Math.sin(o*M)/T,l=l*p+h*o,c=c*p+d*o,u=u*p+g*o,f=f*p+_*o}else{l=l*p+h*o,c=c*p+d*o,u=u*p+g*o,f=f*p+_*o;const M=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=M,c*=M,u*=M,f*=M}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,i,s,a){const o=n[i],l=n[i+1],c=n[i+2],u=n[i+3],f=s[a],h=s[a+1],d=s[a+2],g=s[a+3];return t[e]=o*g+u*f+l*d-c*h,t[e+1]=l*g+u*h+c*f-o*d,t[e+2]=c*g+u*d+o*h-l*f,t[e+3]=u*g-o*f-l*h-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,s=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(i/2),f=o(s/2),h=l(n/2),d=l(i/2),g=l(s/2);switch(a){case"XYZ":this._x=h*u*f+c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f-h*d*g;break;case"YXZ":this._x=h*u*f+c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f+h*d*g;break;case"ZXY":this._x=h*u*f-c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f-h*d*g;break;case"ZYX":this._x=h*u*f-c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f+h*d*g;break;case"YZX":this._x=h*u*f+c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f-h*d*g;break;case"XZY":this._x=h*u*f-c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f+h*d*g;break;default:Wt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],s=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],f=e[10],h=n+o+f;if(h>0){const d=.5/Math.sqrt(h+1);this._w=.25/d,this._x=(u-l)*d,this._y=(s-c)*d,this._z=(a-i)*d}else if(n>o&&n>f){const d=2*Math.sqrt(1+n-o-f);this._w=(u-l)/d,this._x=.25*d,this._y=(i+a)/d,this._z=(s+c)/d}else if(o>f){const d=2*Math.sqrt(1+o-n-f);this._w=(s-c)/d,this._x=(i+a)/d,this._y=.25*d,this._z=(l+u)/d}else{const d=2*Math.sqrt(1+f-n-o);this._w=(a-i)/d,this._x=(s+c)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ee(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,s=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+a*o+i*c-s*l,this._y=i*u+a*l+s*o-n*c,this._z=s*u+a*c+n*l-i*o,this._w=a*u-n*o-i*l-s*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,s=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,i=-i,s=-s,a=-a,o=-o);let l=1-e;if(o<.9995){const c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,e=Math.sin(e*c)/u,this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+s*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+s*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const kc=class kc{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Au.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Au.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=t.elements,a=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*a,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*a,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,s=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*i-o*n),u=2*(o*e-s*i),f=2*(s*n-a*e);return this.x=e+l*c+a*f-o*u,this.y=n+l*u+o*c-s*f,this.z=i+l*f+s*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=ee(this.x,t.x,e.x),this.y=ee(this.y,t.y,e.y),this.z=ee(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=ee(this.x,t,e),this.y=ee(this.y,t,e),this.z=ee(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ee(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,s=t.z,a=e.x,o=e.y,l=e.z;return this.x=i*l-s*o,this.y=s*a-n*l,this.z=n*o-i*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ho.copy(this).projectOnVector(t),this.sub(ho)}reflect(t){return this.sub(ho.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ee(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};kc.prototype.isVector3=!0;let I=kc;const ho=new I,Au=new jr,Gc=class Gc{constructor(t,e,n,i,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,a,o,l,c)}set(t,e,n,i,s,a,o,l,c){const u=this.elements;return u[0]=t,u[1]=i,u[2]=o,u[3]=e,u[4]=s,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],f=n[7],h=n[2],d=n[5],g=n[8],_=i[0],m=i[3],p=i[6],M=i[1],T=i[4],x=i[7],y=i[2],E=i[5],A=i[8];return s[0]=a*_+o*M+l*y,s[3]=a*m+o*T+l*E,s[6]=a*p+o*x+l*A,s[1]=c*_+u*M+f*y,s[4]=c*m+u*T+f*E,s[7]=c*p+u*x+f*A,s[2]=h*_+d*M+g*y,s[5]=h*m+d*T+g*E,s[8]=h*p+d*x+g*A,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-n*s*u+n*o*l+i*s*c-i*a*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=u*a-o*c,h=o*l-u*s,d=c*s-a*l,g=e*f+n*h+i*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return t[0]=f*_,t[1]=(i*c-u*n)*_,t[2]=(o*n-i*a)*_,t[3]=h*_,t[4]=(u*e-i*l)*_,t[5]=(i*s-o*e)*_,t[6]=d*_,t[7]=(n*l-c*e)*_,t[8]=(a*e-n*s)*_,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-i*c,i*l,-i*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return Gr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(fo.makeScale(t,e)),this}rotate(t){return Gr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(fo.makeRotation(-t)),this}translate(t,e){return Gr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(fo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Gc.prototype.isMatrix3=!0;let Yt=Gc;const fo=new Yt,Ru=new Yt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Cu=new Yt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function t0(){const r={enabled:!0,workingColorSpace:Oa,spaces:{},convert:function(i,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===fe&&(i.r=pi(i.r),i.g=pi(i.g),i.b=pi(i.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(i.applyMatrix3(this.spaces[s].toXYZ),i.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===fe&&(i.r=Vr(i.r),i.g=Vr(i.g),i.b=Vr(i.b))),i},workingToColorSpace:function(i,s){return this.convert(i,this.workingColorSpace,s)},colorSpaceToWorking:function(i,s){return this.convert(i,s,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Pi?Ba:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,s=this.workingColorSpace){return i.fromArray(this.spaces[s].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,s,a){return i.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,s){return Gr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),r.workingToColorSpace(i,s)},toWorkingColorSpace:function(i,s){return Gr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),r.colorSpaceToWorking(i,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return r.define({[Oa]:{primaries:t,whitePoint:n,transfer:Ba,toXYZ:Ru,fromXYZ:Cu,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:fn},outputColorSpaceConfig:{drawingBufferColorSpace:fn}},[fn]:{primaries:t,whitePoint:n,transfer:fe,toXYZ:Ru,fromXYZ:Cu,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:fn}}}),r}const re=t0();function pi(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Vr(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}let gr;class e0{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{gr===void 0&&(gr=za("canvas")),gr.width=t.width,gr.height=t.height;const i=gr.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=gr}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=za("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let a=0;a<s.length;a++)s[a]=pi(s[a]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(pi(e[n]/255)*255):e[n]=pi(e[n]);return{data:e,width:t.width,height:t.height}}else return Wt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let n0=0;class wc{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:n0++}),this.uuid=dr(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?s.push(po(i[a].image)):s.push(po(i[a]))}else s=po(i);n.url=s}return e||(t.images[this.uuid]=n),n}}function po(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?e0.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(Wt("Texture: Unable to serialize Texture."),{})}let i0=0;const mo=new I;class je extends fr{constructor(t=je.DEFAULT_IMAGE,e=je.DEFAULT_MAPPING,n=fi,i=fi,s=Ze,a=ji,o=Cn,l=pn,c=je.DEFAULT_ANISOTROPY,u=Pi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:i0++}),this.uuid=dr(),this.name="",this.source=new wc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ft(0,0),this.repeat=new ft(1,1),this.center=new ft(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Yt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(mo).x}get height(){return this.source.getSize(mo).y}get depth(){return this.source.getSize(mo).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){Wt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){Wt(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==zf)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case ml:t.x=t.x-Math.floor(t.x);break;case fi:t.x=t.x<0?0:1;break;case _l:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case ml:t.y=t.y-Math.floor(t.y);break;case fi:t.y=t.y<0?0:1;break;case _l:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}je.DEFAULT_IMAGE=null;je.DEFAULT_MAPPING=zf;je.DEFAULT_ANISOTROPY=1;const Vc=class Vc{constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*i+a[12]*s,this.y=a[1]*e+a[5]*n+a[9]*i+a[13]*s,this.z=a[2]*e+a[6]*n+a[10]*i+a[14]*s,this.w=a[3]*e+a[7]*n+a[11]*i+a[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s;const l=t.elements,c=l[0],u=l[4],f=l[8],h=l[1],d=l[5],g=l[9],_=l[2],m=l[6],p=l[10];if(Math.abs(u-h)<.01&&Math.abs(f-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const T=(c+1)/2,x=(d+1)/2,y=(p+1)/2,E=(u+h)/4,A=(f+_)/4,v=(g+m)/4;return T>x&&T>y?T<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(T),i=E/n,s=A/n):x>y?x<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(x),n=E/i,s=v/i):y<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(y),n=A/s,i=v/s),this.set(n,i,s,e),this}let M=Math.sqrt((m-g)*(m-g)+(f-_)*(f-_)+(h-u)*(h-u));return Math.abs(M)<.001&&(M=1),this.x=(m-g)/M,this.y=(f-_)/M,this.z=(h-u)/M,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=ee(this.x,t.x,e.x),this.y=ee(this.y,t.y,e.y),this.z=ee(this.z,t.z,e.z),this.w=ee(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=ee(this.x,t,e),this.y=ee(this.y,t,e),this.z=ee(this.z,t,e),this.w=ee(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(ee(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Vc.prototype.isVector4=!0;let Ee=Vc;class r0 extends fr{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ze,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Ee(0,0,t,e),this.scissorTest=!1,this.viewport=new Ee(0,0,t,e),this.textures=[];const i={width:t,height:e,depth:n.depth},s=new je(i),a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:Ze,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const i=Object.assign({},t.textures[e].image);this.textures[e].source=new wc(i)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class xn extends r0{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Zf extends je{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ne,this.minFilter=Ne,this.wrapR=fi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class s0 extends je{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Ne,this.minFilter=Ne,this.wrapR=fi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}const Va=class Va{constructor(t,e,n,i,s,a,o,l,c,u,f,h,d,g,_,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,a,o,l,c,u,f,h,d,g,_,m)}set(t,e,n,i,s,a,o,l,c,u,f,h,d,g,_,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=i,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=u,p[10]=f,p[14]=h,p[3]=d,p[7]=g,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Va().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,n=t.elements,i=1/xr.setFromMatrixColumn(t,0).length(),s=1/xr.setFromMatrixColumn(t,1).length(),a=1/xr.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,s=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),u=Math.cos(s),f=Math.sin(s);if(t.order==="XYZ"){const h=a*u,d=a*f,g=o*u,_=o*f;e[0]=l*u,e[4]=-l*f,e[8]=c,e[1]=d+g*c,e[5]=h-_*c,e[9]=-o*l,e[2]=_-h*c,e[6]=g+d*c,e[10]=a*l}else if(t.order==="YXZ"){const h=l*u,d=l*f,g=c*u,_=c*f;e[0]=h+_*o,e[4]=g*o-d,e[8]=a*c,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=d*o-g,e[6]=_+h*o,e[10]=a*l}else if(t.order==="ZXY"){const h=l*u,d=l*f,g=c*u,_=c*f;e[0]=h-_*o,e[4]=-a*f,e[8]=g+d*o,e[1]=d+g*o,e[5]=a*u,e[9]=_-h*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const h=a*u,d=a*f,g=o*u,_=o*f;e[0]=l*u,e[4]=g*c-d,e[8]=h*c+_,e[1]=l*f,e[5]=_*c+h,e[9]=d*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const h=a*l,d=a*c,g=o*l,_=o*c;e[0]=l*u,e[4]=_-h*f,e[8]=g*f+d,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=d*f+g,e[10]=h-_*f}else if(t.order==="XZY"){const h=a*l,d=a*c,g=o*l,_=o*c;e[0]=l*u,e[4]=-f,e[8]=c*u,e[1]=h*f+_,e[5]=a*u,e[9]=d*f-g,e[2]=g*f-d,e[6]=o*u,e[10]=_*f+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(a0,t,o0)}lookAt(t,e,n){const i=this.elements;return cn.subVectors(t,e),cn.lengthSq()===0&&(cn.z=1),cn.normalize(),bi.crossVectors(n,cn),bi.lengthSq()===0&&(Math.abs(n.z)===1?cn.x+=1e-4:cn.z+=1e-4,cn.normalize(),bi.crossVectors(n,cn)),bi.normalize(),Ys.crossVectors(cn,bi),i[0]=bi.x,i[4]=Ys.x,i[8]=cn.x,i[1]=bi.y,i[5]=Ys.y,i[9]=cn.y,i[2]=bi.z,i[6]=Ys.z,i[10]=cn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],f=n[5],h=n[9],d=n[13],g=n[2],_=n[6],m=n[10],p=n[14],M=n[3],T=n[7],x=n[11],y=n[15],E=i[0],A=i[4],v=i[8],b=i[12],R=i[1],P=i[5],N=i[9],z=i[13],L=i[2],B=i[6],X=i[10],G=i[14],et=i[3],Y=i[7],J=i[11],Q=i[15];return s[0]=a*E+o*R+l*L+c*et,s[4]=a*A+o*P+l*B+c*Y,s[8]=a*v+o*N+l*X+c*J,s[12]=a*b+o*z+l*G+c*Q,s[1]=u*E+f*R+h*L+d*et,s[5]=u*A+f*P+h*B+d*Y,s[9]=u*v+f*N+h*X+d*J,s[13]=u*b+f*z+h*G+d*Q,s[2]=g*E+_*R+m*L+p*et,s[6]=g*A+_*P+m*B+p*Y,s[10]=g*v+_*N+m*X+p*J,s[14]=g*b+_*z+m*G+p*Q,s[3]=M*E+T*R+x*L+y*et,s[7]=M*A+T*P+x*B+y*Y,s[11]=M*v+T*N+x*X+y*J,s[15]=M*b+T*z+x*G+y*Q,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],f=t[6],h=t[10],d=t[14],g=t[3],_=t[7],m=t[11],p=t[15],M=l*d-c*h,T=o*d-c*f,x=o*h-l*f,y=a*d-c*u,E=a*h-l*u,A=a*f-o*u;return e*(_*M-m*T+p*x)-n*(g*M-m*y+p*E)+i*(g*T-_*y+p*A)-s*(g*x-_*E+m*A)}determinantAffine(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[1],a=t[5],o=t[9],l=t[2],c=t[6],u=t[10];return e*(a*u-o*c)-n*(s*u-o*l)+i*(s*c-a*l)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=t[9],h=t[10],d=t[11],g=t[12],_=t[13],m=t[14],p=t[15],M=e*o-n*a,T=e*l-i*a,x=e*c-s*a,y=n*l-i*o,E=n*c-s*o,A=i*c-s*l,v=u*_-f*g,b=u*m-h*g,R=u*p-d*g,P=f*m-h*_,N=f*p-d*_,z=h*p-d*m,L=M*z-T*N+x*P+y*R-E*b+A*v;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/L;return t[0]=(o*z-l*N+c*P)*B,t[1]=(i*N-n*z-s*P)*B,t[2]=(_*A-m*E+p*y)*B,t[3]=(h*E-f*A-d*y)*B,t[4]=(l*R-a*z-c*b)*B,t[5]=(e*z-i*R+s*b)*B,t[6]=(m*x-g*A-p*T)*B,t[7]=(u*A-h*x+d*T)*B,t[8]=(a*N-o*R+c*v)*B,t[9]=(n*R-e*N-s*v)*B,t[10]=(g*E-_*x+p*M)*B,t[11]=(f*x-u*E-d*M)*B,t[12]=(o*b-a*P-l*v)*B,t[13]=(e*P-n*b+i*v)*B,t[14]=(_*T-g*y-m*M)*B,t[15]=(u*y-f*T+h*M)*B,this}scale(t){const e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),s=1-n,a=t.x,o=t.y,l=t.z,c=s*a,u=s*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,u*o+n,u*l-i*a,0,c*l-i*o,u*l+i*a,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,a){return this.set(1,n,s,0,t,1,a,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,s=e._x,a=e._y,o=e._z,l=e._w,c=s+s,u=a+a,f=o+o,h=s*c,d=s*u,g=s*f,_=a*u,m=a*f,p=o*f,M=l*c,T=l*u,x=l*f,y=n.x,E=n.y,A=n.z;return i[0]=(1-(_+p))*y,i[1]=(d+x)*y,i[2]=(g-T)*y,i[3]=0,i[4]=(d-x)*E,i[5]=(1-(h+p))*E,i[6]=(m+M)*E,i[7]=0,i[8]=(g+T)*A,i[9]=(m-M)*A,i[10]=(1-(h+_))*A,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),e.identity(),this;let a=xr.set(i[0],i[1],i[2]).length();const o=xr.set(i[4],i[5],i[6]).length(),l=xr.set(i[8],i[9],i[10]).length();s<0&&(a=-a),In.copy(this);const c=1/a,u=1/o,f=1/l;return In.elements[0]*=c,In.elements[1]*=c,In.elements[2]*=c,In.elements[4]*=u,In.elements[5]*=u,In.elements[6]*=u,In.elements[8]*=f,In.elements[9]*=f,In.elements[10]*=f,e.setFromRotationMatrix(In),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,i,s,a,o=ti,l=!1){const c=this.elements,u=2*s/(e-t),f=2*s/(n-i),h=(e+t)/(e-t),d=(n+i)/(n-i);let g,_;if(l)g=s/(a-s),_=a*s/(a-s);else if(o===ti)g=-(a+s)/(a-s),_=-2*a*s/(a-s);else if(o===Fs)g=-a/(a-s),_=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=f,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,i,s,a,o=ti,l=!1){const c=this.elements,u=2/(e-t),f=2/(n-i),h=-(e+t)/(e-t),d=-(n+i)/(n-i);let g,_;if(l)g=1/(a-s),_=a/(a-s);else if(o===ti)g=-2/(a-s),_=-(a+s)/(a-s);else if(o===Fs)g=-1/(a-s),_=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=f,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Va.prototype.isMatrix4=!0;let Ae=Va;const xr=new I,In=new Ae,a0=new I(0,0,0),o0=new I(1,1,1),bi=new I,Ys=new I,cn=new I,Pu=new Ae,Lu=new jr;class cr{constructor(t=0,e=0,n=0,i=cr.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,s=i[0],a=i[4],o=i[8],l=i[1],c=i[5],u=i[9],f=i[2],h=i[6],d=i[10];switch(e){case"XYZ":this._y=Math.asin(ee(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ee(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(ee(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-ee(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,d),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ee(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-ee(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,d),this._y=0);break;default:Wt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Pu.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Pu,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Lu.setFromEuler(this),this.setFromQuaternion(Lu,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}cr.DEFAULT_ORDER="XYZ";class Kf{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let l0=0;const Du=new I,vr=new jr,si=new Ae,Zs=new I,ss=new I,c0=new I,u0=new jr,Iu=new I(1,0,0),Nu=new I(0,1,0),Uu=new I(0,0,1),Fu={type:"added"},h0={type:"removed"},Mr={type:"childadded",child:null},_o={type:"childremoved",child:null};class He extends fr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:l0++}),this.uuid=dr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=He.DEFAULT_UP.clone();const t=new I,e=new cr,n=new jr,i=new I(1,1,1);function s(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ae},normalMatrix:{value:new Yt}}),this.matrix=new Ae,this.matrixWorld=new Ae,this.matrixAutoUpdate=He.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=He.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Kf,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return vr.setFromAxisAngle(t,e),this.quaternion.multiply(vr),this}rotateOnWorldAxis(t,e){return vr.setFromAxisAngle(t,e),this.quaternion.premultiply(vr),this}rotateX(t){return this.rotateOnAxis(Iu,t)}rotateY(t){return this.rotateOnAxis(Nu,t)}rotateZ(t){return this.rotateOnAxis(Uu,t)}translateOnAxis(t,e){return Du.copy(t).applyQuaternion(this.quaternion),this.position.add(Du.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Iu,t)}translateY(t){return this.translateOnAxis(Nu,t)}translateZ(t){return this.translateOnAxis(Uu,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(si.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Zs.copy(t):Zs.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),ss.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?si.lookAt(ss,Zs,this.up):si.lookAt(Zs,ss,this.up),this.quaternion.setFromRotationMatrix(si),i&&(si.extractRotation(i.matrixWorld),vr.setFromRotationMatrix(si),this.quaternion.premultiply(vr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(le("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Fu),Mr.child=t,this.dispatchEvent(Mr),Mr.child=null):le("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(h0),_o.child=t,this.dispatchEvent(_o),_o.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),si.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),si.multiply(t.parent.matrixWorld)),t.applyMatrix4(si),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Fu),Mr.child=t,this.dispatchEvent(Mr),Mr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let s=0,a=i.length;s<a;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ss,t,c0),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ss,u0,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,i=t.z,s=this.matrix.elements;s[12]+=e-s[0]*e-s[4]*n-s[8]*i,s[13]+=n-s[1]*e-s[5]*n-s[9]*i,s[14]+=i-s[2]*e-s[6]*n-s[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){const i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const f=l[c];s(t.shapes,f)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(t.materials,this.material[l]));i.material=o}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(s(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),f=a(t.shapes),h=a(t.skeletons),d=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),h.length>0&&(n.skeletons=h),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=i,n;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}He.DEFAULT_UP=new I(0,1,0);He.DEFAULT_MATRIX_AUTO_UPDATE=!0;He.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Ge extends He{constructor(){super(),this.isGroup=!0,this.type="Group"}}const f0={type:"move"};class go{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ge,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ge,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ge,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const _ of t.hand.values()){const m=e.getJointPose(_,n),p=this._getHandJoint(c,_);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],h=u.position.distanceTo(f.position),d=.02,g=.005;c.inputState.pinching&&h>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(f0)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Ge;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const $f={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ti={h:0,s:0,l:0},Ks={h:0,s:0,l:0};function xo(r,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?r+(t-r)*6*e:e<1/2?t:e<2/3?r+(t-r)*6*(2/3-e):r}class Jt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=fn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,re.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=re.workingColorSpace){return this.r=t,this.g=e,this.b=n,re.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=re.workingColorSpace){if(t=Ec(t,1),e=ee(e,0,1),n=ee(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,a=2*n-s;this.r=xo(a,s,t+1/3),this.g=xo(a,s,t),this.b=xo(a,s,t-1/3)}return re.colorSpaceToWorking(this,i),this}setStyle(t,e=fn){function n(s){s!==void 0&&parseFloat(s)<1&&Wt("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:Wt("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=i[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(s,16),e);Wt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=fn){const n=$f[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Wt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=pi(t.r),this.g=pi(t.g),this.b=pi(t.b),this}copyLinearToSRGB(t){return this.r=Vr(t.r),this.g=Vr(t.g),this.b=Vr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=fn){return re.workingToColorSpace(qe.copy(this),t),Math.round(ee(qe.r*255,0,255))*65536+Math.round(ee(qe.g*255,0,255))*256+Math.round(ee(qe.b*255,0,255))}getHexString(t=fn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=re.workingColorSpace){re.workingToColorSpace(qe.copy(this),e);const n=qe.r,i=qe.g,s=qe.b,a=Math.max(n,i,s),o=Math.min(n,i,s);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=u<=.5?f/(a+o):f/(2-a-o),a){case n:l=(i-s)/f+(i<s?6:0);break;case i:l=(s-n)/f+2;break;case s:l=(n-i)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=re.workingColorSpace){return re.workingToColorSpace(qe.copy(this),e),t.r=qe.r,t.g=qe.g,t.b=qe.b,t}getStyle(t=fn){re.workingToColorSpace(qe.copy(this),t);const e=qe.r,n=qe.g,i=qe.b;return t!==fn?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Ti),this.setHSL(Ti.h+t,Ti.s+e,Ti.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Ti),t.getHSL(Ks);const n=ys(Ti.h,Ks.h,e),i=ys(Ti.s,Ks.s,e),s=ys(Ti.l,Ks.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const qe=new Jt;Jt.NAMES=$f;class Ou extends He{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new cr,this.environmentIntensity=1,this.environmentRotation=new cr,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}}const Nn=new I,ai=new I,vo=new I,oi=new I,Sr=new I,yr=new I,Bu=new I,Mo=new I,So=new I,yo=new I,bo=new Ee,To=new Ee,Eo=new Ee;class On{constructor(t=new I,e=new I,n=new I){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),Nn.subVectors(t,e),i.cross(Nn);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){Nn.subVectors(i,e),ai.subVectors(n,e),vo.subVectors(t,e);const a=Nn.dot(Nn),o=Nn.dot(ai),l=Nn.dot(vo),c=ai.dot(ai),u=ai.dot(vo),f=a*c-o*o;if(f===0)return s.set(0,0,0),null;const h=1/f,d=(c*l-o*u)*h,g=(a*u-o*l)*h;return s.set(1-d-g,g,d)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,oi)===null?!1:oi.x>=0&&oi.y>=0&&oi.x+oi.y<=1}static getInterpolation(t,e,n,i,s,a,o,l){return this.getBarycoord(t,e,n,i,oi)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,oi.x),l.addScaledVector(a,oi.y),l.addScaledVector(o,oi.z),l)}static getInterpolatedAttribute(t,e,n,i,s,a){return bo.setScalar(0),To.setScalar(0),Eo.setScalar(0),bo.fromBufferAttribute(t,e),To.fromBufferAttribute(t,n),Eo.fromBufferAttribute(t,i),a.setScalar(0),a.addScaledVector(bo,s.x),a.addScaledVector(To,s.y),a.addScaledVector(Eo,s.z),a}static isFrontFacing(t,e,n,i){return Nn.subVectors(n,e),ai.subVectors(t,e),Nn.cross(ai).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Nn.subVectors(this.c,this.b),ai.subVectors(this.a,this.b),Nn.cross(ai).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return On.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return On.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return On.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return On.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return On.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,s=this.c;let a,o;Sr.subVectors(i,n),yr.subVectors(s,n),Mo.subVectors(t,n);const l=Sr.dot(Mo),c=yr.dot(Mo);if(l<=0&&c<=0)return e.copy(n);So.subVectors(t,i);const u=Sr.dot(So),f=yr.dot(So);if(u>=0&&f<=u)return e.copy(i);const h=l*f-u*c;if(h<=0&&l>=0&&u<=0)return a=l/(l-u),e.copy(n).addScaledVector(Sr,a);yo.subVectors(t,s);const d=Sr.dot(yo),g=yr.dot(yo);if(g>=0&&d<=g)return e.copy(s);const _=d*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(yr,o);const m=u*g-d*f;if(m<=0&&f-u>=0&&d-g>=0)return Bu.subVectors(s,i),o=(f-u)/(f-u+(d-g)),e.copy(i).addScaledVector(Bu,o);const p=1/(m+_+h);return a=_*p,o=h*p,e.copy(n).addScaledVector(Sr,a).addScaledVector(yr,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class ts{constructor(t=new I(1/0,1/0,1/0),e=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Un.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Un.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Un.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Un):Un.fromBufferAttribute(s,a),Un.applyMatrix4(t.matrixWorld),this.expandByPoint(Un);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),$s.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),$s.copy(n.boundingBox)),$s.applyMatrix4(t.matrixWorld),this.union($s)}const i=t.children;for(let s=0,a=i.length;s<a;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Un),Un.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(as),Js.subVectors(this.max,as),br.subVectors(t.a,as),Tr.subVectors(t.b,as),Er.subVectors(t.c,as),Ei.subVectors(Tr,br),wi.subVectors(Er,Tr),Wi.subVectors(br,Er);let e=[0,-Ei.z,Ei.y,0,-wi.z,wi.y,0,-Wi.z,Wi.y,Ei.z,0,-Ei.x,wi.z,0,-wi.x,Wi.z,0,-Wi.x,-Ei.y,Ei.x,0,-wi.y,wi.x,0,-Wi.y,Wi.x,0];return!wo(e,br,Tr,Er,Js)||(e=[1,0,0,0,1,0,0,0,1],!wo(e,br,Tr,Er,Js))?!1:(Qs.crossVectors(Ei,wi),e=[Qs.x,Qs.y,Qs.z],wo(e,br,Tr,Er,Js))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Un).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Un).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(li[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),li[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),li[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),li[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),li[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),li[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),li[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),li[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(li),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const li=[new I,new I,new I,new I,new I,new I,new I,new I],Un=new I,$s=new ts,br=new I,Tr=new I,Er=new I,Ei=new I,wi=new I,Wi=new I,as=new I,Js=new I,Qs=new I,Xi=new I;function wo(r,t,e,n,i){for(let s=0,a=r.length-3;s<=a;s+=3){Xi.fromArray(r,s);const o=i.x*Math.abs(Xi.x)+i.y*Math.abs(Xi.y)+i.z*Math.abs(Xi.z),l=t.dot(Xi),c=e.dot(Xi),u=n.dot(Xi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const De=new I,js=new ft;let d0=0;class mi extends fr{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:d0++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Dm,this.updateRanges=[],this.gpuType=jn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)js.fromBufferAttribute(this,e),js.applyMatrix3(t),this.setXY(e,js.x,js.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)De.fromBufferAttribute(this,e),De.applyMatrix3(t),this.setXYZ(e,De.x,De.y,De.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)De.fromBufferAttribute(this,e),De.applyMatrix4(t),this.setXYZ(e,De.x,De.y,De.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)De.fromBufferAttribute(this,e),De.applyNormalMatrix(t),this.setXYZ(e,De.x,De.y,De.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)De.fromBufferAttribute(this,e),De.transformDirection(t),this.setXYZ(e,De.x,De.y,De.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Ir(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Je(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ir(e,this.array)),e}setX(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ir(e,this.array)),e}setY(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ir(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ir(e,this.array)),e}setW(t,e){return this.normalized&&(e=Je(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Je(e,this.array),n=Je(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Je(e,this.array),n=Je(n,this.array),i=Je(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=Je(e,this.array),n=Je(n,this.array),i=Je(i,this.array),s=Je(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class Jf extends mi{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Qf extends mi{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class ve extends mi{constructor(t,e,n){super(new Float32Array(t),e,n)}}const p0=new ts,os=new I,Ao=new I;class Ac{constructor(t=new I,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):p0.setFromPoints(t).getCenter(n);let i=0;for(let s=0,a=t.length;s<a;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;os.subVectors(t,this.center);const e=os.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(os,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ao.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(os.copy(t.center).add(Ao)),this.expandByPoint(os.copy(t.center).sub(Ao))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let m0=0;const yn=new Ae,Ro=new He,wr=new I,un=new ts,ls=new ts,Oe=new I;class tn extends fr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:m0++}),this.uuid=dr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Im(t)?Qf:Jf)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Yt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return yn.makeRotationFromQuaternion(t),this.applyMatrix4(yn),this}rotateX(t){return yn.makeRotationX(t),this.applyMatrix4(yn),this}rotateY(t){return yn.makeRotationY(t),this.applyMatrix4(yn),this}rotateZ(t){return yn.makeRotationZ(t),this.applyMatrix4(yn),this}translate(t,e,n){return yn.makeTranslation(t,e,n),this.applyMatrix4(yn),this}scale(t,e,n){return yn.makeScale(t,e,n),this.applyMatrix4(yn),this}lookAt(t){return Ro.lookAt(t),Ro.updateMatrix(),this.applyMatrix4(Ro.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(wr).negate(),this.translate(wr.x,wr.y,wr.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let i=0,s=t.length;i<s;i++){const a=t[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new ve(n,3))}else{const n=Math.min(t.length,e.count);for(let i=0;i<n;i++){const s=t[i];e.setXYZ(i,s.x,s.y,s.z||0)}t.length>e.count&&Wt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ts);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){le("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const s=e[n];un.setFromBufferAttribute(s),this.morphTargetsRelative?(Oe.addVectors(this.boundingBox.min,un.min),this.boundingBox.expandByPoint(Oe),Oe.addVectors(this.boundingBox.max,un.max),this.boundingBox.expandByPoint(Oe)):(this.boundingBox.expandByPoint(un.min),this.boundingBox.expandByPoint(un.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&le('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ac);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){le("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(t){const n=this.boundingSphere.center;if(un.setFromBufferAttribute(t),e)for(let s=0,a=e.length;s<a;s++){const o=e[s];ls.setFromBufferAttribute(o),this.morphTargetsRelative?(Oe.addVectors(un.min,ls.min),un.expandByPoint(Oe),Oe.addVectors(un.max,ls.max),un.expandByPoint(Oe)):(un.expandByPoint(ls.min),un.expandByPoint(ls.max))}un.getCenter(n);let i=0;for(let s=0,a=t.count;s<a;s++)Oe.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Oe));if(e)for(let s=0,a=e.length;s<a;s++){const o=e[s],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Oe.fromBufferAttribute(o,c),l&&(wr.fromBufferAttribute(t,c),Oe.add(wr)),i=Math.max(i,n.distanceToSquared(Oe))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&le('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){le("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,s=e.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new mi(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let v=0;v<n.count;v++)o[v]=new I,l[v]=new I;const c=new I,u=new I,f=new I,h=new ft,d=new ft,g=new ft,_=new I,m=new I;function p(v,b,R){c.fromBufferAttribute(n,v),u.fromBufferAttribute(n,b),f.fromBufferAttribute(n,R),h.fromBufferAttribute(s,v),d.fromBufferAttribute(s,b),g.fromBufferAttribute(s,R),u.sub(c),f.sub(c),d.sub(h),g.sub(h);const P=1/(d.x*g.y-g.x*d.y);isFinite(P)&&(_.copy(u).multiplyScalar(g.y).addScaledVector(f,-d.y).multiplyScalar(P),m.copy(f).multiplyScalar(d.x).addScaledVector(u,-g.x).multiplyScalar(P),o[v].add(_),o[b].add(_),o[R].add(_),l[v].add(m),l[b].add(m),l[R].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let v=0,b=M.length;v<b;++v){const R=M[v],P=R.start,N=R.count;for(let z=P,L=P+N;z<L;z+=3)p(t.getX(z+0),t.getX(z+1),t.getX(z+2))}const T=new I,x=new I,y=new I,E=new I;function A(v){y.fromBufferAttribute(i,v),E.copy(y);const b=o[v];T.copy(b),T.sub(y.multiplyScalar(y.dot(b))).normalize(),x.crossVectors(E,b);const P=x.dot(l[v])<0?-1:1;a.setXYZW(v,T.x,T.y,T.z,P)}for(let v=0,b=M.length;v<b;++v){const R=M[v],P=R.start,N=R.count;for(let z=P,L=P+N;z<L;z+=3)A(t.getX(z+0)),A(t.getX(z+1)),A(t.getX(z+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new mi(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,d=n.count;h<d;h++)n.setXYZ(h,0,0,0);const i=new I,s=new I,a=new I,o=new I,l=new I,c=new I,u=new I,f=new I;if(t)for(let h=0,d=t.count;h<d;h+=3){const g=t.getX(h+0),_=t.getX(h+1),m=t.getX(h+2);i.fromBufferAttribute(e,g),s.fromBufferAttribute(e,_),a.fromBufferAttribute(e,m),u.subVectors(a,s),f.subVectors(i,s),u.cross(f),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,d=e.count;h<d;h+=3)i.fromBufferAttribute(e,h+0),s.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,s),f.subVectors(i,s),u.cross(f),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Oe.fromBufferAttribute(t,e),Oe.normalize(),t.setXYZ(e,Oe.x,Oe.y,Oe.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,f=o.normalized,h=new c.constructor(l.length*u);let d=0,g=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?d=l[_]*o.data.stride+o.offset:d=l[_]*u;for(let p=0;p<u;p++)h[g++]=c[d++]}return new mi(h,u,f)}if(this.index===null)return Wt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new tn,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=t(l,n);e.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let u=0,f=c.length;u<f;u++){const h=c[u],d=t(h,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let f=0,h=c.length;f<h;f++){const d=c[f];u.push(d.toJSON(t.data))}u.length>0&&(i[l]=u,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const i=t.attributes;for(const c in i){const u=i[c];this.setAttribute(c,u.clone(e))}const s=t.morphAttributes;for(const c in s){const u=[],f=s[c];for(let h=0,d=f.length;h<d;h++)u.push(f[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,u=a.length;c<u;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Co=new I,_0=new I,g0=new Yt;class Ci{constructor(t=new I(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=Co.subVectors(n,e).cross(_0.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){const i=t.delta(Co),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/s;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(i,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||g0.getNormalMatrix(t),i=this.coplanarPoint(Co).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let x0=0;class es extends fr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:x0++}),this.uuid=dr(),this.name="",this.type="Material",this.blending=Ms,this.side=ar,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Cf,this.blendDst=Pf,this.blendEquation=Dr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Jt(0,0,0),this.blendAlpha=0,this.depthFunc=Is,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Em,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=uo,this.stencilZFail=uo,this.stencilZPass=uo,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){Wt(`Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){Wt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(e){const s=i(t.textures),a=i(t.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Jt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new Ci().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ft().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ft().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const ci=new I,Po=new I,ta=new I,ea=new I;class v0{constructor(t=new I,e=new I(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,ci)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=ci.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(ci.copy(this.origin).addScaledVector(this.direction,e),ci.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){Po.copy(t).add(e).multiplyScalar(.5),ta.copy(e).sub(t).normalize(),ea.copy(this.origin).sub(Po);const s=t.distanceTo(e)*.5,a=-this.direction.dot(ta),o=ea.dot(this.direction),l=-ea.dot(ta),c=ea.lengthSq(),u=Math.abs(1-a*a);let f,h,d,g;if(u>0)if(f=a*l-o,h=a*o-l,g=s*u,f>=0)if(h>=-g)if(h<=g){const _=1/u;f*=_,h*=_,d=f*(f+a*h+2*o)+h*(a*f+h+2*l)+c}else h=s,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h=-s,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h<=-g?(f=Math.max(0,-(-a*s+o)),h=f>0?-s:Math.min(Math.max(-s,-l),s),d=-f*f+h*(h+2*l)+c):h<=g?(f=0,h=Math.min(Math.max(-s,-l),s),d=h*(h+2*l)+c):(f=Math.max(0,-(a*s+o)),h=f>0?s:Math.min(Math.max(-s,-l),s),d=-f*f+h*(h+2*l)+c);else h=a>0?-s:s,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),i&&i.copy(Po).addScaledVector(ta,h),d}intersectSphere(t,e){if(t.radius<0)return null;ci.subVectors(t.center,this.origin);const n=ci.dot(this.direction),i=ci.dot(ci)-n*n,s=t.radius*t.radius;if(i>s)return null;const a=Math.sqrt(s-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return c>=0?(n=(t.min.x-h.x)*c,i=(t.max.x-h.x)*c):(n=(t.max.x-h.x)*c,i=(t.min.x-h.x)*c),u>=0?(s=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(s=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),n>a||s>i||((s>n||isNaN(n))&&(n=s),(a<i||isNaN(i))&&(i=a),f>=0?(o=(t.min.z-h.z)*f,l=(t.max.z-h.z)*f):(o=(t.max.z-h.z)*f,l=(t.min.z-h.z)*f),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,ci)!==null}intersectTriangle(t,e,n,i,s){const a=this.origin,o=this.direction,l=o.x,c=o.y,u=o.z,f=t.x-a.x,h=t.y-a.y,d=t.z-a.z,g=e.x-a.x,_=e.y-a.y,m=e.z-a.z,p=n.x-a.x,M=n.y-a.y,T=n.z-a.z,x=Math.abs(l),y=Math.abs(c),E=Math.abs(u);let A,v,b,R,P,N,z,L,B,X,G,et;if(x>=y&&x>=E?(b=l,N=f,B=g,et=p,l>=0?(A=c,v=u,R=h,P=d,z=_,L=m,X=M,G=T):(A=u,v=c,R=d,P=h,z=m,L=_,X=T,G=M)):y>=E?(b=c,N=h,B=_,et=M,c>=0?(A=u,v=l,R=d,P=f,z=m,L=g,X=T,G=p):(A=l,v=u,R=f,P=d,z=g,L=m,X=p,G=T)):(b=u,N=d,B=m,et=T,u>=0?(A=l,v=c,R=f,P=h,z=g,L=_,X=p,G=M):(A=c,v=l,R=h,P=f,z=_,L=g,X=M,G=p)),b===0)return null;const Y=A/b,J=v/b,Q=1/b,bt=R-Y*N,xt=P-J*N,Zt=z-Y*B,Ht=L-J*B,ie=X-Y*et,K=G-J*et,k=ie*Ht-K*Zt,lt=bt*K-xt*ie,Lt=Zt*xt-Ht*bt;if(i){if(k<0||lt<0||Lt<0)return null}else if((k<0||lt<0||Lt<0)&&(k>0||lt>0||Lt>0))return null;const mt=k+lt+Lt;if(mt===0)return null;const Ot=Q*(k*N+lt*B+Lt*et);return(mt>0?Ot<0:Ot>0)?null:this.at(Ot/mt,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Rc extends es{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Jt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new cr,this.combine=Lf,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const zu=new Ae,qi=new v0,na=new Ac,ku=new I,ia=new I,ra=new I,sa=new I,Lo=new I,aa=new I,Gu=new I,oa=new I;class Ln extends He{constructor(t=new tn,e=new Rc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const o=this.morphTargetInfluences;if(s&&o){aa.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=o[l],f=s[l];u!==0&&(Lo.fromBufferAttribute(f,t),a?aa.addScaledVector(Lo,u):aa.addScaledVector(Lo.sub(e),u))}e.add(aa)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),na.copy(n.boundingSphere),na.applyMatrix4(s),qi.copy(t.ray).recast(t.near),!(na.containsPoint(qi.origin)===!1&&(qi.intersectSphere(na,ku)===null||qi.origin.distanceToSquared(ku)>(t.far-t.near)**2))&&(zu.copy(s).invert(),qi.copy(t.ray).applyMatrix4(zu),!(n.boundingBox!==null&&qi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,qi)))}_computeIntersections(t,e,n){let i;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,h=s.groups,d=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,_=h.length;g<_;g++){const m=h[g],p=a[m.materialIndex],M=Math.max(m.start,d.start),T=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let x=M,y=T;x<y;x+=3){const E=o.getX(x),A=o.getX(x+1),v=o.getX(x+2);i=la(this,p,t,n,c,u,f,E,A,v),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,d.start),_=Math.min(o.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){const M=o.getX(m),T=o.getX(m+1),x=o.getX(m+2);i=la(this,a,t,n,c,u,f,M,T,x),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,_=h.length;g<_;g++){const m=h[g],p=a[m.materialIndex],M=Math.max(m.start,d.start),T=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let x=M,y=T;x<y;x+=3){const E=x,A=x+1,v=x+2;i=la(this,p,t,n,c,u,f,E,A,v),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,d.start),_=Math.min(l.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){const M=m,T=m+1,x=m+2;i=la(this,a,t,n,c,u,f,M,T,x),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}}}function M0(r,t,e,n,i,s,a,o){let l;if(t.side===on?l=n.intersectTriangle(a,s,i,!0,o):l=n.intersectTriangle(i,s,a,t.side===ar,o),l===null)return null;oa.copy(o),oa.applyMatrix4(r.matrixWorld);const c=e.ray.origin.distanceTo(oa);return c<e.near||c>e.far?null:{distance:c,point:oa.clone(),object:r}}function la(r,t,e,n,i,s,a,o,l,c){r.getVertexPosition(o,ia),r.getVertexPosition(l,ra),r.getVertexPosition(c,sa);const u=M0(r,t,e,n,ia,ra,sa,Gu);if(u){const f=new I;On.getBarycoord(Gu,ia,ra,sa,f),i&&(u.uv=On.getInterpolatedAttribute(i,o,l,c,f,new ft)),s&&(u.uv1=On.getInterpolatedAttribute(s,o,l,c,f,new ft)),a&&(u.normal=On.getInterpolatedAttribute(a,o,l,c,f,new I),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new I,materialIndex:0};On.getNormal(ia,ra,sa,h.normal),u.face=h,u.barycoord=f}return u}class jf extends je{constructor(t=null,e=1,n=1,i,s,a,o,l,c=Ne,u=Ne,f,h){super(null,a,o,l,c,u,i,s,f,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Yi=new Ac,S0=new ft(.5,.5),ca=new I;class Cc{constructor(t=new Ci,e=new Ci,n=new Ci,i=new Ci,s=new Ci,a=new Ci){this.planes=[t,e,n,i,s,a]}set(t,e,n,i,s,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(s),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=ti,n=!1){const i=this.planes,s=t.elements,a=s[0],o=s[1],l=s[2],c=s[3],u=s[4],f=s[5],h=s[6],d=s[7],g=s[8],_=s[9],m=s[10],p=s[11],M=s[12],T=s[13],x=s[14],y=s[15];if(i[0].setComponents(c-a,d-u,p-g,y-M).normalize(),i[1].setComponents(c+a,d+u,p+g,y+M).normalize(),i[2].setComponents(c+o,d+f,p+_,y+T).normalize(),i[3].setComponents(c-o,d-f,p-_,y-T).normalize(),n)i[4].setComponents(l,h,m,x).normalize(),i[5].setComponents(c-l,d-h,p-m,y-x).normalize();else if(i[4].setComponents(c-l,d-h,p-m,y-x).normalize(),e===ti)i[5].setComponents(c+l,d+h,p+m,y+x).normalize();else if(e===Fs)i[5].setComponents(l,h,m,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Yi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Yi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Yi)}intersectsSprite(t){Yi.center.set(0,0,0);const e=S0.distanceTo(t.center);return Yi.radius=.7071067811865476+e,Yi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Yi)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(ca.x=i.normal.x>0?t.max.x:t.min.x,ca.y=i.normal.y>0?t.max.y:t.min.y,ca.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(ca)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class td extends je{constructor(t=[],e=or,n,i,s,a,o,l,c,u){super(t,e,n,i,s,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class $r extends je{constructor(t,e,n=zn,i,s,a,o=Ne,l=Ne,c,u=xi,f=1){if(u!==xi&&u!==tr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:t,height:e,depth:f};super(h,i,s,a,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new wc(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}}class y0 extends $r{constructor(t,e=zn,n=or,i,s,a=Ne,o=Ne,l,c=xi){const u={width:t,height:t,depth:1},f=[u,u,u,u,u,u];super(t,t,e,n,i,s,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class ed extends je{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class vi extends tn{constructor(t=1,e=1,n=1,i=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:a};const o=this;i=Math.floor(i),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],u=[],f=[];let h=0,d=0;g("z","y","x",-1,-1,n,e,t,a,s,0),g("z","y","x",1,-1,n,e,-t,a,s,1),g("x","z","y",1,1,t,n,e,i,a,2),g("x","z","y",1,-1,t,n,-e,i,a,3),g("x","y","z",1,-1,t,e,n,i,s,4),g("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new ve(c,3)),this.setAttribute("normal",new ve(u,3)),this.setAttribute("uv",new ve(f,2));function g(_,m,p,M,T,x,y,E,A,v,b){const R=x/A,P=y/v,N=x/2,z=y/2,L=E/2,B=A+1,X=v+1;let G=0,et=0;const Y=new I;for(let J=0;J<X;J++){const Q=J*P-z;for(let bt=0;bt<B;bt++){const xt=bt*R-N;Y[_]=xt*M,Y[m]=Q*T,Y[p]=L,c.push(Y.x,Y.y,Y.z),Y[_]=0,Y[m]=0,Y[p]=E>0?1:-1,u.push(Y.x,Y.y,Y.z),f.push(bt/A),f.push(1-J/v),G+=1}}for(let J=0;J<v;J++)for(let Q=0;Q<A;Q++){const bt=h+Q+B*J,xt=h+Q+B*(J+1),Zt=h+(Q+1)+B*(J+1),Ht=h+(Q+1)+B*J;l.push(bt,xt,Ht),l.push(xt,Zt,Ht),et+=6}o.addGroup(d,et,b),d+=et,h+=G}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new vi(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class Pn extends tn{constructor(t=1,e=1,n=1,i=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),s=Math.floor(s);const u=[],f=[],h=[],d=[];let g=0;const _=[],m=n/2;let p=0;M(),a===!1&&(t>0&&T(!0),e>0&&T(!1)),this.setIndex(u),this.setAttribute("position",new ve(f,3)),this.setAttribute("normal",new ve(h,3)),this.setAttribute("uv",new ve(d,2));function M(){const x=new I,y=new I;let E=0;const A=(e-t)/n;for(let v=0;v<=s;v++){const b=[],R=v/s,P=R*(e-t)+t;for(let N=0;N<=i;N++){const z=N/i,L=z*l+o,B=Math.sin(L),X=Math.cos(L);y.x=P*B,y.y=-R*n+m,y.z=P*X,f.push(y.x,y.y,y.z),x.set(B,A,X).normalize(),h.push(x.x,x.y,x.z),d.push(z,1-R),b.push(g++)}_.push(b)}for(let v=0;v<i;v++)for(let b=0;b<s;b++){const R=_[b][v],P=_[b+1][v],N=_[b+1][v+1],z=_[b][v+1];(t>0||b!==0)&&(u.push(R,P,z),E+=3),(e>0||b!==s-1)&&(u.push(P,N,z),E+=3)}c.addGroup(p,E,0),p+=E}function T(x){const y=g,E=new ft,A=new I;let v=0;const b=x===!0?t:e,R=x===!0?1:-1;for(let N=1;N<=i;N++)f.push(0,m*R,0),h.push(0,R,0),d.push(.5,.5),g++;const P=g;for(let N=0;N<=i;N++){const L=N/i*l+o,B=Math.cos(L),X=Math.sin(L);A.x=b*X,A.y=m*R,A.z=b*B,f.push(A.x,A.y,A.z),h.push(0,R,0),E.x=B*.5+.5,E.y=X*.5*R+.5,d.push(E.x,E.y),g++}for(let N=0;N<i;N++){const z=y+N,L=P+N;x===!0?u.push(L,L+1,z):u.push(L+1,L,z),v+=3}c.addGroup(p,v,x===!0?1:2),p+=v}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Pn(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Pc extends Pn{constructor(t=1,e=1,n=32,i=1,s=!1,a=0,o=Math.PI*2){super(0,t,e,n,i,s,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(t){return new Pc(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Lc extends tn{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};const s=[],a=[];o(i),c(n),u(),this.setAttribute("position",new ve(s,3)),this.setAttribute("normal",new ve(s.slice(),3)),this.setAttribute("uv",new ve(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(M){const T=new I,x=new I,y=new I;for(let E=0;E<e.length;E+=3)d(e[E+0],T),d(e[E+1],x),d(e[E+2],y),l(T,x,y,M)}function l(M,T,x,y){const E=y+1,A=[];for(let v=0;v<=E;v++){A[v]=[];const b=M.clone().lerp(x,v/E),R=T.clone().lerp(x,v/E),P=E-v;for(let N=0;N<=P;N++)N===0&&v===E?A[v][N]=b:A[v][N]=b.clone().lerp(R,N/P)}for(let v=0;v<E;v++)for(let b=0;b<2*(E-v)-1;b++){const R=Math.floor(b/2);b%2===0?(h(A[v][R+1]),h(A[v+1][R]),h(A[v][R])):(h(A[v][R+1]),h(A[v+1][R+1]),h(A[v+1][R]))}}function c(M){const T=new I;for(let x=0;x<s.length;x+=3)T.x=s[x+0],T.y=s[x+1],T.z=s[x+2],T.normalize().multiplyScalar(M),s[x+0]=T.x,s[x+1]=T.y,s[x+2]=T.z}function u(){const M=new I;for(let T=0;T<s.length;T+=3){M.x=s[T+0],M.y=s[T+1],M.z=s[T+2];const x=m(M)/2/Math.PI+.5,y=p(M)/Math.PI+.5;a.push(x,1-y)}g(),f()}function f(){for(let M=0;M<a.length;M+=6){const T=a[M+0],x=a[M+2],y=a[M+4],E=Math.max(T,x,y),A=Math.min(T,x,y);E>.9&&A<.1&&(T<.2&&(a[M+0]+=1),x<.2&&(a[M+2]+=1),y<.2&&(a[M+4]+=1))}}function h(M){s.push(M.x,M.y,M.z)}function d(M,T){const x=M*3;T.x=t[x+0],T.y=t[x+1],T.z=t[x+2]}function g(){const M=new I,T=new I,x=new I,y=new I,E=new ft,A=new ft,v=new ft;for(let b=0,R=0;b<s.length;b+=9,R+=6){M.set(s[b+0],s[b+1],s[b+2]),T.set(s[b+3],s[b+4],s[b+5]),x.set(s[b+6],s[b+7],s[b+8]),E.set(a[R+0],a[R+1]),A.set(a[R+2],a[R+3]),v.set(a[R+4],a[R+5]),y.copy(M).add(T).add(x).divideScalar(3);const P=m(y);_(E,R+0,M,P),_(A,R+2,T,P),_(v,R+4,x,P)}}function _(M,T,x,y){y<0&&M.x===1&&(a[T]=M.x-1),x.x===0&&x.z===0&&(a[T]=y/2/Math.PI+.5)}function m(M){return Math.atan2(M.z,-M.x)}function p(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Lc(t.vertices,t.indices,t.radius,t.detail)}}class ri{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Wt("Curve: .getPoint() not implemented.")}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,i=this.getPoint(0),s=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),s+=n.distanceTo(i),e.push(s),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const n=this.getLengths();let i=0;const s=n.length;let a;e?a=e:a=t*n[s-1];let o=0,l=s-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(s-1);const u=n[i],h=n[i+1]-u,d=(a-u)/h;return(i+d)/(s-1)}getTangent(t,e){let i=t-1e-4,s=t+1e-4;i<0&&(i=0),s>1&&(s=1);const a=this.getPoint(i),o=this.getPoint(s),l=e||(a.isVector2?new ft:new I);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){const n=new I,i=[],s=[],a=[],o=new I,l=new Ae;for(let d=0;d<=t;d++){const g=d/t;i[d]=this.getTangentAt(g,new I)}s[0]=new I,a[0]=new I;let c=Number.MAX_VALUE;const u=Math.abs(i[0].x),f=Math.abs(i[0].y),h=Math.abs(i[0].z);u<=c&&(c=u,n.set(1,0,0)),f<=c&&(c=f,n.set(0,1,0)),h<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),s[0].crossVectors(i[0],o),a[0].crossVectors(i[0],s[0]);for(let d=1;d<=t;d++){if(s[d]=s[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(i[d-1],i[d]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(ee(i[d-1].dot(i[d]),-1,1));s[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(i[d],s[d])}if(e===!0){let d=Math.acos(ee(s[0].dot(s[t]),-1,1));d/=t,i[0].dot(o.crossVectors(s[0],s[t]))>0&&(d=-d);for(let g=1;g<=t;g++)s[g].applyMatrix4(l.makeRotationAxis(i[g],d*g)),a[g].crossVectors(i[g],s[g])}return{tangents:i,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Dc extends ri{constructor(t=0,e=0,n=1,i=1,s=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new ft){const n=e,i=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=i;for(;s>i;)s-=i;s<Number.EPSILON&&(a?s=0:s=i),this.aClockwise===!0&&!a&&(s===i?s=-i:s=s-i);const o=this.aStartAngle+t*s;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const u=Math.cos(this.aRotation),f=Math.sin(this.aRotation),h=l-this.aX,d=c-this.aY;l=h*u-d*f+this.aX,c=h*f+d*u+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class b0 extends Dc{constructor(t,e,n,i,s,a){super(t,e,n,n,i,s,a),this.isArcCurve=!0,this.type="ArcCurve"}}function Ic(){let r=0,t=0,e=0,n=0;function i(s,a,o,l){r=s,t=o,e=-3*s+3*a-2*o-l,n=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){i(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,u,f){let h=(a-s)/c-(o-s)/(c+u)+(o-a)/u,d=(o-a)/u-(l-a)/(u+f)+(l-o)/f;h*=u,d*=u,i(a,o,h,d)},calc:function(s){const a=s*s,o=a*s;return r+t*s+e*a+n*o}}}const Vu=new I,Hu=new I,Do=new Ic,Io=new Ic,No=new Ic;class T0 extends ri{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new I){const n=e,i=this.points,s=i.length,a=(s-(this.closed?0:1))*t;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let c,u;this.closed||o>0?c=i[(o-1)%s]:(Hu.subVectors(i[0],i[1]).add(i[0]),c=Hu);const f=i[o%s],h=i[(o+1)%s];if(this.closed||o+2<s?u=i[(o+2)%s]:(Vu.subVectors(i[s-1],i[s-2]).add(i[s-1]),u=Vu),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(f),d),_=Math.pow(f.distanceToSquared(h),d),m=Math.pow(h.distanceToSquared(u),d);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),Do.initNonuniformCatmullRom(c.x,f.x,h.x,u.x,g,_,m),Io.initNonuniformCatmullRom(c.y,f.y,h.y,u.y,g,_,m),No.initNonuniformCatmullRom(c.z,f.z,h.z,u.z,g,_,m)}else this.curveType==="catmullrom"&&(Do.initCatmullRom(c.x,f.x,h.x,u.x,this.tension),Io.initCatmullRom(c.y,f.y,h.y,u.y,this.tension),No.initCatmullRom(c.z,f.z,h.z,u.z,this.tension));return n.set(Do.calc(l),Io.calc(l),No.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new I().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Wu(r,t,e,n,i){const s=(n-t)*.5,a=(i-e)*.5,o=r*r,l=r*o;return(2*e-2*n+s+a)*l+(-3*e+3*n-2*s-a)*o+s*r+e}function E0(r,t){const e=1-r;return e*e*t}function w0(r,t){return 2*(1-r)*r*t}function A0(r,t){return r*r*t}function bs(r,t,e,n){return E0(r,t)+w0(r,e)+A0(r,n)}function R0(r,t){const e=1-r;return e*e*e*t}function C0(r,t){const e=1-r;return 3*e*e*r*t}function P0(r,t){return 3*(1-r)*r*r*t}function L0(r,t){return r*r*r*t}function Ts(r,t,e,n,i){return R0(r,t)+C0(r,e)+P0(r,n)+L0(r,i)}class nd extends ri{constructor(t=new ft,e=new ft,n=new ft,i=new ft){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new ft){const n=e,i=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(Ts(t,i.x,s.x,a.x,o.x),Ts(t,i.y,s.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class D0 extends ri{constructor(t=new I,e=new I,n=new I,i=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new I){const n=e,i=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(Ts(t,i.x,s.x,a.x,o.x),Ts(t,i.y,s.y,a.y,o.y),Ts(t,i.z,s.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class id extends ri{constructor(t=new ft,e=new ft){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ft){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ft){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class I0 extends ri{constructor(t=new I,e=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new I){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new I){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class rd extends ri{constructor(t=new ft,e=new ft,n=new ft){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new ft){const n=e,i=this.v0,s=this.v1,a=this.v2;return n.set(bs(t,i.x,s.x,a.x),bs(t,i.y,s.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class N0 extends ri{constructor(t=new I,e=new I,n=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new I){const n=e,i=this.v0,s=this.v1,a=this.v2;return n.set(bs(t,i.x,s.x,a.x),bs(t,i.y,s.y,a.y),bs(t,i.z,s.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class sd extends ri{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ft){const n=e,i=this.points,s=(i.length-1)*t,a=Math.floor(s),o=s-a,l=i[a===0?a:a-1],c=i[a],u=i[a>i.length-2?i.length-1:a+1],f=i[a>i.length-3?i.length-1:a+2];return n.set(Wu(o,l.x,c.x,u.x,f.x),Wu(o,l.y,c.y,u.y,f.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new ft().fromArray(i))}return this}}var Yl=Object.freeze({__proto__:null,ArcCurve:b0,CatmullRomCurve3:T0,CubicBezierCurve:nd,CubicBezierCurve3:D0,EllipseCurve:Dc,LineCurve:id,LineCurve3:I0,QuadraticBezierCurve:rd,QuadraticBezierCurve3:N0,SplineCurve:sd});class U0 extends ri{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Yl[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),i=this.getCurveLengths();let s=0;for(;s<i.length;){if(i[s]>=n){const a=i[s]-n,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}s++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let i=0,s=this.curves;i<s.length;i++){const a=s[i],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){const u=l[c];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(new Yl[i.type]().fromJSON(i))}return this}}class Xu extends U0{constructor(t){super(),this.type="Path",this.currentPoint=new ft,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new id(this.currentPoint.clone(),new ft(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){const s=new rd(this.currentPoint.clone(),new ft(t,e),new ft(n,i));return this.curves.push(s),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,s,a){const o=new nd(this.currentPoint.clone(),new ft(t,e),new ft(n,i),new ft(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new sd(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,s,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,i,s,a),this}absarc(t,e,n,i,s,a){return this.absellipse(t,e,n,n,i,s,a),this}ellipse(t,e,n,i,s,a,o,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+c,e+u,n,i,s,a,o,l),this}absellipse(t,e,n,i,s,a,o,l){const c=new Dc(t,e,n,i,s,a,o,l);if(this.curves.length>0){const f=c.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Ya extends Xu{constructor(t){super(t),this.uuid=dr(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,i=this.holes.length;n<i;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const i=t.holes[e];this.holes.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const i=this.holes[e];t.holes.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const i=t.holes[e];this.holes.push(new Xu().fromJSON(i))}return this}}function F0(r,t,e=2){const n=t&&t.length,i=n?t[0]*e:r.length;let s=ad(r,0,i,e,!0);const a=[];if(!s||s.next===s.prev)return a;let o,l,c;if(n&&(s=G0(r,t,s,e)),r.length>80*e){o=r[0],l=r[1];let u=o,f=l;for(let h=e;h<i;h+=e){const d=r[h],g=r[h+1];d<o&&(o=d),g<l&&(l=g),d>u&&(u=d),g>f&&(f=g)}c=Math.max(u-o,f-l),c=c!==0?32767/c:0}return Bs(s,a,e,o,l,c,0),a}function ad(r,t,e,n,i){let s;if(i===Q0(r,t,e,n)>0)for(let a=t;a<e;a+=n)s=qu(a/n|0,r[a],r[a+1],s);else for(let a=e-n;a>=t;a-=n)s=qu(a/n|0,r[a],r[a+1],s);return s&&Jr(s,s.next)&&(ks(s),s=s.next),s}function ur(r,t){if(!r)return r;t||(t=r);let e=r,n;do if(n=!1,!e.steiner&&(Jr(e,e.next)||we(e.prev,e,e.next)===0)){if(ks(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Bs(r,t,e,n,i,s,a){if(!r)return;!a&&s&&q0(r,n,i,s);let o=r;for(;r.prev!==r.next;){const l=r.prev,c=r.next;if(s?B0(r,n,i,s):O0(r)){t.push(l.i,r.i,c.i),ks(r),r=c.next,o=c.next;continue}if(r=c,r===o){a?a===1?(r=z0(ur(r),t),Bs(r,t,e,n,i,s,2)):a===2&&k0(r,t,e,n,i,s):Bs(ur(r),t,e,n,i,s,1);break}}}function O0(r){const t=r.prev,e=r,n=r.next;if(we(t,e,n)>=0)return!1;const i=t.x,s=e.x,a=n.x,o=t.y,l=e.y,c=n.y,u=Math.min(i,s,a),f=Math.min(o,l,c),h=Math.max(i,s,a),d=Math.max(o,l,c);let g=n.next;for(;g!==t;){if(g.x>=u&&g.x<=h&&g.y>=f&&g.y<=d&&ms(i,o,s,l,a,c,g.x,g.y)&&we(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function B0(r,t,e,n){const i=r.prev,s=r,a=r.next;if(we(i,s,a)>=0)return!1;const o=i.x,l=s.x,c=a.x,u=i.y,f=s.y,h=a.y,d=Math.min(o,l,c),g=Math.min(u,f,h),_=Math.max(o,l,c),m=Math.max(u,f,h),p=Zl(d,g,t,e,n),M=Zl(_,m,t,e,n);let T=r.prevZ,x=r.nextZ;for(;T&&T.z>=p&&x&&x.z<=M;){if(T.x>=d&&T.x<=_&&T.y>=g&&T.y<=m&&T!==i&&T!==a&&ms(o,u,l,f,c,h,T.x,T.y)&&we(T.prev,T,T.next)>=0||(T=T.prevZ,x.x>=d&&x.x<=_&&x.y>=g&&x.y<=m&&x!==i&&x!==a&&ms(o,u,l,f,c,h,x.x,x.y)&&we(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;T&&T.z>=p;){if(T.x>=d&&T.x<=_&&T.y>=g&&T.y<=m&&T!==i&&T!==a&&ms(o,u,l,f,c,h,T.x,T.y)&&we(T.prev,T,T.next)>=0)return!1;T=T.prevZ}for(;x&&x.z<=M;){if(x.x>=d&&x.x<=_&&x.y>=g&&x.y<=m&&x!==i&&x!==a&&ms(o,u,l,f,c,h,x.x,x.y)&&we(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function z0(r,t){let e=r;do{const n=e.prev,i=e.next.next;!Jr(n,i)&&ld(n,e,e.next,i)&&zs(n,i)&&zs(i,n)&&(t.push(n.i,e.i,i.i),ks(e),ks(e.next),e=r=i),e=e.next}while(e!==r);return ur(e)}function k0(r,t,e,n,i,s){let a=r;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&K0(a,o)){let l=cd(a,o);a=ur(a,a.next),l=ur(l,l.next),Bs(a,t,e,n,i,s,0),Bs(l,t,e,n,i,s,0);return}o=o.next}a=a.next}while(a!==r)}function G0(r,t,e,n){const i=[];for(let s=0,a=t.length;s<a;s++){const o=t[s]*n,l=s<a-1?t[s+1]*n:r.length,c=ad(r,o,l,n,!1);c===c.next&&(c.steiner=!0),i.push(Z0(c))}i.sort(V0);for(let s=0;s<i.length;s++)e=H0(i[s],e);return e}function V0(r,t){let e=r.x-t.x;if(e===0&&(e=r.y-t.y,e===0)){const n=(r.next.y-r.y)/(r.next.x-r.x),i=(t.next.y-t.y)/(t.next.x-t.x);e=n-i}return e}function H0(r,t){const e=W0(r,t);if(!e)return t;const n=cd(e,r);return ur(n,n.next),ur(e,e.next)}function W0(r,t){let e=t;const n=r.x,i=r.y;let s=-1/0,a;if(Jr(r,e))return e;do{if(Jr(r,e.next))return e.next;if(i<=e.y&&i>=e.next.y&&e.next.y!==e.y){const f=e.x+(i-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(f<=n&&f>s&&(s=f,a=e.x<e.next.x?e:e.next,f===n))return a}e=e.next}while(e!==t);if(!a)return null;const o=a,l=a.x,c=a.y;let u=1/0;e=a;do{if(n>=e.x&&e.x>=l&&n!==e.x&&od(i<c?n:s,i,l,c,i<c?s:n,i,e.x,e.y)){const f=Math.abs(i-e.y)/(n-e.x);zs(e,r)&&(f<u||f===u&&(e.x>a.x||e.x===a.x&&X0(a,e)))&&(a=e,u=f)}e=e.next}while(e!==o);return a}function X0(r,t){return we(r.prev,r,t.prev)<0&&we(t.next,r,r.next)<0}function q0(r,t,e,n){let i=r;do i.z===0&&(i.z=Zl(i.x,i.y,t,e,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==r);i.prevZ.nextZ=null,i.prevZ=null,Y0(i)}function Y0(r){let t,e=1;do{let n=r,i;r=null;let s=null;for(t=0;n;){t++;let a=n,o=0;for(let c=0;c<e&&(o++,a=a.nextZ,!!a);c++);let l=e;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(i=n,n=n.nextZ,o--):(i=a,a=a.nextZ,l--),s?s.nextZ=i:r=i,i.prevZ=s,s=i;n=a}s.nextZ=null,e*=2}while(t>1);return r}function Zl(r,t,e,n,i){return r=(r-e)*i|0,t=(t-n)*i|0,r=(r|r<<8)&16711935,r=(r|r<<4)&252645135,r=(r|r<<2)&858993459,r=(r|r<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,r|t<<1}function Z0(r){let t=r,e=r;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==r);return e}function od(r,t,e,n,i,s,a,o){return(i-a)*(t-o)>=(r-a)*(s-o)&&(r-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(s-o)>=(i-a)*(n-o)}function ms(r,t,e,n,i,s,a,o){return!(r===a&&t===o)&&od(r,t,e,n,i,s,a,o)}function K0(r,t){return r.next.i!==t.i&&r.prev.i!==t.i&&!$0(r,t)&&(zs(r,t)&&zs(t,r)&&J0(r,t)&&(we(r.prev,r,t.prev)||we(r,t.prev,t))||Jr(r,t)&&we(r.prev,r,r.next)>0&&we(t.prev,t,t.next)>0)}function we(r,t,e){return(t.y-r.y)*(e.x-t.x)-(t.x-r.x)*(e.y-t.y)}function Jr(r,t){return r.x===t.x&&r.y===t.y}function ld(r,t,e,n){const i=ha(we(r,t,e)),s=ha(we(r,t,n)),a=ha(we(e,n,r)),o=ha(we(e,n,t));return!!(i!==s&&a!==o||i===0&&ua(r,e,t)||s===0&&ua(r,n,t)||a===0&&ua(e,r,n)||o===0&&ua(e,t,n))}function ua(r,t,e){return t.x<=Math.max(r.x,e.x)&&t.x>=Math.min(r.x,e.x)&&t.y<=Math.max(r.y,e.y)&&t.y>=Math.min(r.y,e.y)}function ha(r){return r>0?1:r<0?-1:0}function $0(r,t){let e=r;do{if(e.i!==r.i&&e.next.i!==r.i&&e.i!==t.i&&e.next.i!==t.i&&ld(e,e.next,r,t))return!0;e=e.next}while(e!==r);return!1}function zs(r,t){return we(r.prev,r,r.next)<0?we(r,t,r.next)>=0&&we(r,r.prev,t)>=0:we(r,t,r.prev)<0||we(r,r.next,t)<0}function J0(r,t){let e=r,n=!1;const i=(r.x+t.x)/2,s=(r.y+t.y)/2;do e.y>s!=e.next.y>s&&e.next.y!==e.y&&i<(e.next.x-e.x)*(s-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==r);return n}function cd(r,t){const e=Kl(r.i,r.x,r.y),n=Kl(t.i,t.x,t.y),i=r.next,s=t.prev;return r.next=t,t.prev=r,e.next=i,i.prev=e,n.next=e,e.prev=n,s.next=n,n.prev=s,n}function qu(r,t,e,n){const i=Kl(r,t,e);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function ks(r){r.next.prev=r.prev,r.prev.next=r.next,r.prevZ&&(r.prevZ.nextZ=r.nextZ),r.nextZ&&(r.nextZ.prevZ=r.prevZ)}function Kl(r,t,e){return{i:r,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Q0(r,t,e,n){let i=0;for(let s=t,a=e-n;s<e;s+=n)i+=(r[a]-r[s])*(r[s+1]+r[a+1]),a=s;return i}class j0{static triangulate(t,e,n=2){return F0(t,e,n)}}class Fr{static area(t){const e=t.length;let n=0;for(let i=e-1,s=0;s<e;i=s++)n+=t[i].x*t[s].y-t[s].x*t[i].y;return n*.5}static isClockWise(t){return Fr.area(t)<0}static triangulateShape(t,e){const n=[],i=[],s=[];Yu(t),Zu(n,t);let a=t.length;e.forEach(Yu);for(let l=0;l<e.length;l++)i.push(a),a+=e[l].length,Zu(n,e[l]);const o=j0.triangulate(n,i);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}}function Yu(r){const t=r.length;t>2&&r[t-1].equals(r[0])&&r.pop()}function Zu(r,t){for(let e=0;e<t.length;e++)r.push(t[e].x),r.push(t[e].y)}class Hr extends tn{constructor(t=new Ya([new ft(.5,.5),new ft(-.5,.5),new ft(-.5,-.5),new ft(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,i=[],s=[];for(let o=0,l=t.length;o<l;o++){const c=t[o];a(c)}this.setAttribute("position",new ve(i,3)),this.setAttribute("uv",new ve(s,2)),this.computeVertexNormals();function a(o){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,f=e.depth!==void 0?e.depth:1;let h=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:d-.1,_=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const p=e.extrudePath,M=e.UVGenerator!==void 0?e.UVGenerator:t_;let T,x=!1,y,E,A,v;if(p){T=p.getSpacedPoints(u),x=!0,h=!1;const j=p.isCatmullRomCurve3?p.closed:!1;y=p.computeFrenetFrames(u,j),E=new I,A=new I,v=new I}h||(m=0,d=0,g=0,_=0);const b=o.extractPoints(c);let R=b.shape;const P=b.holes;if(!Fr.isClockWise(R)){R=R.reverse();for(let j=0,it=P.length;j<it;j++){const st=P[j];Fr.isClockWise(st)&&(P[j]=st.reverse())}}function z(j){const st=10000000000000001e-36;let rt=j[0];for(let ot=1;ot<=j.length;ot++){const At=ot%j.length,Tt=j[At],Ft=Tt.x-rt.x,Bt=Tt.y-rt.y,D=Ft*Ft+Bt*Bt,Qt=Math.max(Math.abs(Tt.x),Math.abs(Tt.y),Math.abs(rt.x),Math.abs(rt.y)),Gt=st*Qt*Qt;if(D<=Gt){j.splice(At,1),ot--;continue}rt=Tt}}z(R),P.forEach(z);const L=P.length,B=R;for(let j=0;j<L;j++){const it=P[j];R=R.concat(it)}function X(j,it,st){return it||le("ExtrudeGeometry: vec does not exist"),j.clone().addScaledVector(it,st)}const G=R.length;function et(j,it,st){let rt,ot,At;const Tt=j.x-it.x,Ft=j.y-it.y,Bt=st.x-j.x,D=st.y-j.y,Qt=Tt*Tt+Ft*Ft,Gt=Tt*D-Ft*Bt;if(Math.abs(Gt)>Number.EPSILON){const C=Math.sqrt(Qt),S=Math.sqrt(Bt*Bt+D*D),O=it.x-Ft/C,W=it.y+Tt/C,Z=st.x-D/S,ht=st.y+Bt/S,dt=((Z-O)*D-(ht-W)*Bt)/(Tt*D-Ft*Bt);rt=O+Tt*dt-j.x,ot=W+Ft*dt-j.y;const $=rt*rt+ot*ot;if($<=2)return new ft(rt,ot);At=Math.sqrt($/2)}else{let C=!1;Tt>Number.EPSILON?Bt>Number.EPSILON&&(C=!0):Tt<-Number.EPSILON?Bt<-Number.EPSILON&&(C=!0):Math.sign(Ft)===Math.sign(D)&&(C=!0),C?(rt=-Ft,ot=Tt,At=Math.sqrt(Qt)):(rt=Tt,ot=Ft,At=Math.sqrt(Qt/2))}return new ft(rt/At,ot/At)}const Y=[];for(let j=0,it=B.length,st=it-1,rt=j+1;j<it;j++,st++,rt++)st===it&&(st=0),rt===it&&(rt=0),Y[j]=et(B[j],B[st],B[rt]);const J=[];let Q,bt=Y.concat();for(let j=0,it=L;j<it;j++){const st=P[j];Q=[];for(let rt=0,ot=st.length,At=ot-1,Tt=rt+1;rt<ot;rt++,At++,Tt++)At===ot&&(At=0),Tt===ot&&(Tt=0),Q[rt]=et(st[rt],st[At],st[Tt]);J.push(Q),bt=bt.concat(Q)}let xt;if(m===0)xt=Fr.triangulateShape(B,P);else{const j=[],it=[];for(let st=0;st<m;st++){const rt=st/m,ot=d*Math.cos(rt*Math.PI/2),At=g*Math.sin(rt*Math.PI/2)+_;for(let Tt=0,Ft=B.length;Tt<Ft;Tt++){const Bt=X(B[Tt],Y[Tt],At);lt(Bt.x,Bt.y,-ot),rt===0&&j.push(Bt)}for(let Tt=0,Ft=L;Tt<Ft;Tt++){const Bt=P[Tt];Q=J[Tt];const D=[];for(let Qt=0,Gt=Bt.length;Qt<Gt;Qt++){const C=X(Bt[Qt],Q[Qt],At);lt(C.x,C.y,-ot),rt===0&&D.push(C)}rt===0&&it.push(D)}}xt=Fr.triangulateShape(j,it)}const Zt=xt.length,Ht=g+_;for(let j=0;j<G;j++){const it=h?X(R[j],bt[j],Ht):R[j];x?(A.copy(y.normals[0]).multiplyScalar(it.x),E.copy(y.binormals[0]).multiplyScalar(it.y),v.copy(T[0]).add(A).add(E),lt(v.x,v.y,v.z)):lt(it.x,it.y,0)}for(let j=1;j<=u;j++)for(let it=0;it<G;it++){const st=h?X(R[it],bt[it],Ht):R[it];x?(A.copy(y.normals[j]).multiplyScalar(st.x),E.copy(y.binormals[j]).multiplyScalar(st.y),v.copy(T[j]).add(A).add(E),lt(v.x,v.y,v.z)):lt(st.x,st.y,f/u*j)}for(let j=m-1;j>=0;j--){const it=j/m,st=d*Math.cos(it*Math.PI/2),rt=g*Math.sin(it*Math.PI/2)+_;for(let ot=0,At=B.length;ot<At;ot++){const Tt=X(B[ot],Y[ot],rt);lt(Tt.x,Tt.y,f+st)}for(let ot=0,At=P.length;ot<At;ot++){const Tt=P[ot];Q=J[ot];for(let Ft=0,Bt=Tt.length;Ft<Bt;Ft++){const D=X(Tt[Ft],Q[Ft],rt);x?lt(D.x,D.y+T[u-1].y,T[u-1].x+st):lt(D.x,D.y,f+st)}}}ie(),K();function ie(){const j=i.length/3;if(h){let it=0,st=G*it;for(let rt=0;rt<Zt;rt++){const ot=xt[rt];Lt(ot[2]+st,ot[1]+st,ot[0]+st)}it=u+m*2,st=G*it;for(let rt=0;rt<Zt;rt++){const ot=xt[rt];Lt(ot[0]+st,ot[1]+st,ot[2]+st)}}else{for(let it=0;it<Zt;it++){const st=xt[it];Lt(st[2],st[1],st[0])}for(let it=0;it<Zt;it++){const st=xt[it];Lt(st[0]+G*u,st[1]+G*u,st[2]+G*u)}}n.addGroup(j,i.length/3-j,0)}function K(){const j=i.length/3;let it=0;k(B,it),it+=B.length;for(let st=0,rt=P.length;st<rt;st++){const ot=P[st];k(ot,it),it+=ot.length}n.addGroup(j,i.length/3-j,1)}function k(j,it){let st=j.length;for(;--st>=0;){const rt=st;let ot=st-1;ot<0&&(ot=j.length-1);for(let At=0,Tt=u+m*2;At<Tt;At++){const Ft=G*At,Bt=G*(At+1),D=it+rt+Ft,Qt=it+ot+Ft,Gt=it+ot+Bt,C=it+rt+Bt;mt(D,Qt,Gt,C)}}}function lt(j,it,st){l.push(j),l.push(it),l.push(st)}function Lt(j,it,st){Ot(j),Ot(it),Ot(st);const rt=i.length/3,ot=M.generateTopUV(n,i,rt-3,rt-2,rt-1);Kt(ot[0]),Kt(ot[1]),Kt(ot[2])}function mt(j,it,st,rt){Ot(j),Ot(it),Ot(rt),Ot(it),Ot(st),Ot(rt);const ot=i.length/3,At=M.generateSideWallUV(n,i,ot-6,ot-3,ot-2,ot-1);Kt(At[0]),Kt(At[1]),Kt(At[3]),Kt(At[1]),Kt(At[2]),Kt(At[3])}function Ot(j){i.push(l[j*3+0]),i.push(l[j*3+1]),i.push(l[j*3+2])}function Kt(j){s.push(j.x),s.push(j.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return e_(e,n,t)}static fromJSON(t,e){const n=[];for(let s=0,a=t.shapes.length;s<a;s++){const o=e[t.shapes[s]];n.push(o)}const i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new Yl[i.type]().fromJSON(i)),new Hr(n,t.options)}}const t_={generateTopUV:function(r,t,e,n,i){const s=t[e*3],a=t[e*3+1],o=t[n*3],l=t[n*3+1],c=t[i*3],u=t[i*3+1];return[new ft(s,a),new ft(o,l),new ft(c,u)]},generateSideWallUV:function(r,t,e,n,i,s){const a=t[e*3],o=t[e*3+1],l=t[e*3+2],c=t[n*3],u=t[n*3+1],f=t[n*3+2],h=t[i*3],d=t[i*3+1],g=t[i*3+2],_=t[s*3],m=t[s*3+1],p=t[s*3+2];return Math.abs(o-u)<Math.abs(a-c)?[new ft(a,1-l),new ft(c,1-f),new ft(h,1-g),new ft(_,1-p)]:[new ft(o,1-l),new ft(u,1-f),new ft(d,1-g),new ft(m,1-p)]}};function e_(r,t,e){if(e.shapes=[],Array.isArray(r))for(let n=0,i=r.length;n<i;n++){const s=r[n];e.shapes.push(s.uuid)}else e.shapes.push(r.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class ka extends tn{constructor(t=[new ft(0,-.5),new ft(.5,0),new ft(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=ee(i,0,Math.PI*2);const s=[],a=[],o=[],l=[],c=[],u=1/e,f=new I,h=new ft,d=new I,g=new I,_=new I;let m=0,p=0;for(let M=0;M<=t.length-1;M++)switch(M){case 0:m=t[M+1].x-t[M].x,p=t[M+1].y-t[M].y,d.x=p*1,d.y=-m,d.z=p*0,_.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case t.length-1:l.push(_.x,_.y,_.z);break;default:m=t[M+1].x-t[M].x,p=t[M+1].y-t[M].y,d.x=p*1,d.y=-m,d.z=p*0,g.copy(d),d.x+=_.x,d.y+=_.y,d.z+=_.z,d.normalize(),l.push(d.x,d.y,d.z),_.copy(g)}for(let M=0;M<=e;M++){const T=n+M*u*i,x=Math.sin(T),y=Math.cos(T);for(let E=0;E<=t.length-1;E++){f.x=t[E].x*x,f.y=t[E].y,f.z=t[E].x*y,a.push(f.x,f.y,f.z),h.x=M/e,h.y=E/(t.length-1),o.push(h.x,h.y);const A=l[3*E+0]*x,v=l[3*E+1],b=l[3*E+0]*y;c.push(A,v,b)}}for(let M=0;M<e;M++)for(let T=0;T<t.length-1;T++){const x=T+M*t.length,y=x,E=x+t.length,A=x+t.length+1,v=x+1;s.push(y,E,v),s.push(A,v,E)}this.setIndex(s),this.setAttribute("position",new ve(a,3)),this.setAttribute("uv",new ve(o,2)),this.setAttribute("normal",new ve(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ka(t.points,t.segments,t.phiStart,t.phiLength)}}class Nc extends Lc{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Nc(t.radius,t.detail)}}class Vs extends tn{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const s=t/2,a=e/2,o=Math.floor(n),l=Math.floor(i),c=o+1,u=l+1,f=t/o,h=e/l,d=[],g=[],_=[],m=[];for(let p=0;p<u;p++){const M=p*h-a;for(let T=0;T<c;T++){const x=T*f-s;g.push(x,-M,0),_.push(0,0,1),m.push(T/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<o;M++){const T=M+c*p,x=M+c*(p+1),y=M+1+c*(p+1),E=M+1+c*p;d.push(T,x,E),d.push(x,y,E)}this.setIndex(d),this.setAttribute("position",new ve(g,3)),this.setAttribute("normal",new ve(_,3)),this.setAttribute("uv",new ve(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Vs(t.width,t.height,t.widthSegments,t.heightSegments)}}class ei extends tn{constructor(t=1,e=32,n=16,i=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:s,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const u=[],f=new I,h=new I,d=[],g=[],_=[],m=[];for(let p=0;p<=n;p++){const M=[],T=p/n,x=a+T*o,y=t*Math.cos(x),E=Math.sqrt(t*t-y*y);let A=0;p===0&&a===0?A=.5/e:p===n&&l===Math.PI&&(A=-.5/e);for(let v=0;v<=e;v++){const b=v/e,R=i+b*s;f.x=-E*Math.cos(R),f.y=y,f.z=E*Math.sin(R),g.push(f.x,f.y,f.z),h.copy(f).normalize(),_.push(h.x,h.y,h.z),m.push(b+A,1-T),M.push(c++)}u.push(M)}for(let p=0;p<n;p++)for(let M=0;M<e;M++){const T=u[p][M+1],x=u[p][M],y=u[p+1][M],E=u[p+1][M+1];(p!==0||a>0)&&d.push(T,x,E),(p!==n-1||l<Math.PI)&&d.push(x,y,E)}this.setIndex(d),this.setAttribute("position",new ve(g,3)),this.setAttribute("normal",new ve(_,3)),this.setAttribute("uv",new ve(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ei(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Bn extends tn{constructor(t=1,e=.4,n=12,i=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:s,thetaStart:a,thetaLength:o},n=Math.floor(n),i=Math.floor(i);const l=[],c=[],u=[],f=[],h=new I,d=new I,g=new I;for(let _=0;_<=n;_++){const m=a+_/n*o;for(let p=0;p<=i;p++){const M=p/i*s;d.x=(t+e*Math.cos(m))*Math.cos(M),d.y=(t+e*Math.cos(m))*Math.sin(M),d.z=e*Math.sin(m),c.push(d.x,d.y,d.z),h.x=t*Math.cos(M),h.y=t*Math.sin(M),g.subVectors(d,h).normalize(),u.push(g.x,g.y,g.z),f.push(p/i),f.push(_/n)}}for(let _=1;_<=n;_++)for(let m=1;m<=i;m++){const p=(i+1)*_+m-1,M=(i+1)*(_-1)+m-1,T=(i+1)*(_-1)+m,x=(i+1)*_+m;l.push(p,M,x),l.push(M,T,x)}this.setIndex(l),this.setAttribute("position",new ve(c,3)),this.setAttribute("normal",new ve(u,3)),this.setAttribute("uv",new ve(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Bn(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}}function Qr(r){const t={};for(const e in r){t[e]={};for(const n in r[e]){const i=r[e][n];if(Ku(i))i.isRenderTargetTexture?(Wt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(Ku(i[0])){const s=[];for(let a=0,o=i.length;a<o;a++)s[a]=i[a].clone();t[e][n]=s}else t[e][n]=i.slice();else t[e][n]=i}}return t}function Qe(r){const t={};for(let e=0;e<r.length;e++){const n=Qr(r[e]);for(const i in n)t[i]=n[i]}return t}function Ku(r){return r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)}function n_(r){const t=[];for(let e=0;e<r.length;e++)t.push(r[e].clone());return t}function ud(r){const t=r.getRenderTarget();return t===null?r.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:re.workingColorSpace}const i_={clone:Qr,merge:Qe};var r_=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,s_=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Gn extends es{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=r_,this.fragmentShader=s_,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Qr(t.uniforms),this.uniformsGroups=n_(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?e.uniforms[i]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[i]={type:"m4",value:a.toArray()}:e.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const n in t.uniforms){const i=t.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=e[i.value]||null;break;case"c":this.uniforms[n].value=new Jt().setHex(i.value);break;case"v2":this.uniforms[n].value=new ft().fromArray(i.value);break;case"v3":this.uniforms[n].value=new I().fromArray(i.value);break;case"v4":this.uniforms[n].value=new Ee().fromArray(i.value);break;case"m3":this.uniforms[n].value=new Yt().fromArray(i.value);break;case"m4":this.uniforms[n].value=new Ae().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class a_ extends Gn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class o_ extends es{constructor(t){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new Jt(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Jt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Fa,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.gradientMap=t.gradientMap,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}class l_ extends es{constructor(t){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Fa,this.normalScale=new ft(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(t)}copy(t){return super.copy(t),this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.flatShading=t.flatShading,this}}class c_ extends es{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=bm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class u_ extends es{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class hd extends He{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Jt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class h_ extends hd{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(He.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Jt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const Uo=new Ae,$u=new I,Ju=new I;class f_{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ft(512,512),this.mapType=pn,this.map=null,this.mapPass=null,this.matrix=new Ae,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Cc,this._frameExtents=new ft(1,1),this._viewportCount=1,this._viewports=[new Ee(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera;$u.setFromMatrixPosition(t.matrixWorld),e.position.copy($u),Ju.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Ju),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,i){Uo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(Uo,t.coordinateSystem,t.reversedDepth);const s=this._frameExtents,a=i?i.z/s.x:1,o=i?i.w/s.y:1,l=i?i.x/s.x:0,c=i?i.y/s.y:0;t.coordinateSystem===Fs||t.reversedDepth?e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),e.multiply(Uo)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const fa=new I,da=new jr,Wn=new I;class fd extends He{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ae,this.projectionMatrix=new Ae,this.projectionMatrixInverse=new Ae,this.coordinateSystem=ti,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(fa,da,Wn),Wn.x===1&&Wn.y===1&&Wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(fa,da,Wn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(fa,da,Wn),Wn.x===1&&Wn.y===1&&Wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(fa,da,Wn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Ai=new I,Qu=new ft,ju=new ft;class wn extends fd{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Os*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Ss*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Os*2*Math.atan(Math.tan(Ss*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Ai.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Ai.x,Ai.y).multiplyScalar(-t/Ai.z),Ai.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ai.x,Ai.y).multiplyScalar(-t/Ai.z)}getViewSize(t,e){return this.getViewBounds(t,Qu,ju),e.subVectors(ju,Qu)}setViewOffset(t,e,n,i,s,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Ss*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,s=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*i/l,e-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class Za extends fd{constructor(t=-1,e=1,n=1,i=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-t,a=n+t,o=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class d_ extends f_{constructor(){super(new Za(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class th extends hd{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(He.DEFAULT_UP),this.updateMatrix(),this.target=new He,this.shadow=new d_}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}const Ar=-90,Rr=1;class p_ extends He{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new wn(Ar,Rr,t,e);i.layers=this.layers,this.add(i);const s=new wn(Ar,Rr,t,e);s.layers=this.layers,this.add(s);const a=new wn(Ar,Rr,t,e);a.layers=this.layers,this.add(a);const o=new wn(Ar,Rr,t,e);o.layers=this.layers,this.add(o);const l=new wn(Ar,Rr,t,e);l.layers=this.layers,this.add(l);const c=new wn(Ar,Rr,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,s,a,o,l]=e;for(const c of e)this.remove(c);if(t===ti)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Fs)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,u]=this.children,f=t.getRenderTarget(),h=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(n,0,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,s),t.setRenderTarget(n,1,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=_,t.setRenderTarget(n,5,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(f,h,d),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class m_ extends wn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}const Hc=class Hc{constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){const s=this.elements;return s[0]=t,s[2]=e,s[1]=n,s[3]=i,this}};Hc.prototype.isMatrix2=!0;let eh=Hc;function nh(r,t,e,n){const i=__(n);switch(e){case Wf:return r*t;case qf:return r*t/i.components*i.byteLength;case Mc:return r*t/i.components*i.byteLength;case lr:return r*t*2/i.components*i.byteLength;case Sc:return r*t*2/i.components*i.byteLength;case Xf:return r*t*3/i.components*i.byteLength;case Cn:return r*t*4/i.components*i.byteLength;case yc:return r*t*4/i.components*i.byteLength;case Sa:case ya:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case ba:case Ta:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case xl:case Ml:return Math.max(r,16)*Math.max(t,8)/4;case gl:case vl:return Math.max(r,8)*Math.max(t,8)/2;case Sl:case yl:case Tl:case El:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case bl:case Na:case wl:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Al:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case Rl:return Math.floor((r+4)/5)*Math.floor((t+3)/4)*16;case Cl:return Math.floor((r+4)/5)*Math.floor((t+4)/5)*16;case Pl:return Math.floor((r+5)/6)*Math.floor((t+4)/5)*16;case Ll:return Math.floor((r+5)/6)*Math.floor((t+5)/6)*16;case Dl:return Math.floor((r+7)/8)*Math.floor((t+4)/5)*16;case Il:return Math.floor((r+7)/8)*Math.floor((t+5)/6)*16;case Nl:return Math.floor((r+7)/8)*Math.floor((t+7)/8)*16;case Ul:return Math.floor((r+9)/10)*Math.floor((t+4)/5)*16;case Fl:return Math.floor((r+9)/10)*Math.floor((t+5)/6)*16;case Ol:return Math.floor((r+9)/10)*Math.floor((t+7)/8)*16;case Bl:return Math.floor((r+9)/10)*Math.floor((t+9)/10)*16;case zl:return Math.floor((r+11)/12)*Math.floor((t+9)/10)*16;case kl:return Math.floor((r+11)/12)*Math.floor((t+11)/12)*16;case Gl:case Vl:case Hl:return Math.ceil(r/4)*Math.ceil(t/4)*16;case Wl:case Xl:return Math.ceil(r/4)*Math.ceil(t/4)*8;case Ua:case ql:return Math.ceil(r/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function __(r){switch(r){case pn:case kf:return{byteLength:1,components:1};case Ns:case Gf:case kn:return{byteLength:2,components:1};case xc:case vc:return{byteLength:2,components:4};case zn:case gc:case jn:return{byteLength:4,components:1};case Vf:case Hf:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${r}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:_c}}));typeof window<"u"&&(window.__THREE__?Wt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=_c);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function dd(){let r=null,t=!1,e=null,n=null;function i(s,a){n=r.requestAnimationFrame(i),e(s,a)}return{start:function(){t!==!0&&e!==null&&r!==null&&(n=r.requestAnimationFrame(i),t=!0)},stop:function(){r!==null&&r.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){r=s}}}function g_(r){const t=new WeakMap;function e(o,l){const c=o.array,u=o.usage,f=c.byteLength,h=r.createBuffer();r.bindBuffer(l,h),r.bufferData(l,c,u),o.onUploadCallback();let d;if(c instanceof Float32Array)d=r.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=r.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=r.HALF_FLOAT:d=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=r.SHORT;else if(c instanceof Uint32Array)d=r.UNSIGNED_INT;else if(c instanceof Int32Array)d=r.INT;else if(c instanceof Int8Array)d=r.BYTE;else if(c instanceof Uint8Array)d=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){const u=l.array,f=l.updateRanges;if(r.bindBuffer(c,o),f.length===0)r.bufferSubData(c,0,u);else{f.sort((d,g)=>d.start-g.start);let h=0;for(let d=1;d<f.length;d++){const g=f[h],_=f[d];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++h,f[h]=_)}f.length=h+1;for(let d=0,g=f.length;d<g;d++){const _=f[d];r.bufferSubData(c,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(r.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:s,update:a}}var x_=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,v_=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,M_=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,S_=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,y_=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,b_=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,T_=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,E_=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,w_=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,A_=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,R_=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,C_=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,P_=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,L_=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,D_=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,I_=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,N_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,U_=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,F_=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,O_=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,B_=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,z_=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,k_=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,G_=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,V_=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,H_=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,W_=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,X_=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,q_=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Y_=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Z_="gl_FragColor = linearToOutputTexel( gl_FragColor );",K_=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,$_=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,J_=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Q_=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,j_=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,tg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,eg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ng=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ig=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,rg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,sg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ag=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,og=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lg=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,cg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,ug=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,hg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,fg=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,dg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,pg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,mg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,_g=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,gg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,xg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,vg=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Mg=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Sg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,yg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,bg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Tg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Eg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,wg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ag=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Rg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Cg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Pg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Lg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Dg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ig=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ng=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Ug=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Fg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Og=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Bg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,zg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,kg=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Gg=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Vg=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Hg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Wg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Xg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,qg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Yg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Zg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Kg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,$g=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Jg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Qg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,jg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,tx=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,ex=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,nx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,ix=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,rx=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,sx=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,ax=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ox=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,lx=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,cx=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ux=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,hx=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,fx=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,dx=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,px=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,mx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,_x=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,gx=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const xx=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,vx=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Mx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Sx=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,yx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Ex=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,wx=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Ax=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Rx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Cx=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Px=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Lx=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Dx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Ix=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Nx=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ux=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Fx=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Ox=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bx=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,zx=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,kx=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Gx=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vx=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Hx=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wx=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Xx=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qx=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Yx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Zx=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Kx=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$x=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Jx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,te={alphahash_fragment:x_,alphahash_pars_fragment:v_,alphamap_fragment:M_,alphamap_pars_fragment:S_,alphatest_fragment:y_,alphatest_pars_fragment:b_,aomap_fragment:T_,aomap_pars_fragment:E_,batching_pars_vertex:w_,batching_vertex:A_,begin_vertex:R_,beginnormal_vertex:C_,bsdfs:P_,iridescence_fragment:L_,bumpmap_pars_fragment:D_,clipping_planes_fragment:I_,clipping_planes_pars_fragment:N_,clipping_planes_pars_vertex:U_,clipping_planes_vertex:F_,color_fragment:O_,color_pars_fragment:B_,color_pars_vertex:z_,color_vertex:k_,common:G_,cube_uv_reflection_fragment:V_,defaultnormal_vertex:H_,displacementmap_pars_vertex:W_,displacementmap_vertex:X_,emissivemap_fragment:q_,emissivemap_pars_fragment:Y_,colorspace_fragment:Z_,colorspace_pars_fragment:K_,envmap_fragment:$_,envmap_common_pars_fragment:J_,envmap_pars_fragment:Q_,envmap_pars_vertex:j_,envmap_physical_pars_fragment:ug,envmap_vertex:tg,fog_vertex:eg,fog_pars_vertex:ng,fog_fragment:ig,fog_pars_fragment:rg,gradientmap_pars_fragment:sg,lightmap_pars_fragment:ag,lights_lambert_fragment:og,lights_lambert_pars_fragment:lg,lights_pars_begin:cg,lights_toon_fragment:hg,lights_toon_pars_fragment:fg,lights_phong_fragment:dg,lights_phong_pars_fragment:pg,lights_physical_fragment:mg,lights_physical_pars_fragment:_g,lights_fragment_begin:gg,lights_fragment_maps:xg,lights_fragment_end:vg,lightprobes_pars_fragment:Mg,logdepthbuf_fragment:Sg,logdepthbuf_pars_fragment:yg,logdepthbuf_pars_vertex:bg,logdepthbuf_vertex:Tg,map_fragment:Eg,map_pars_fragment:wg,map_particle_fragment:Ag,map_particle_pars_fragment:Rg,metalnessmap_fragment:Cg,metalnessmap_pars_fragment:Pg,morphinstance_vertex:Lg,morphcolor_vertex:Dg,morphnormal_vertex:Ig,morphtarget_pars_vertex:Ng,morphtarget_vertex:Ug,normal_fragment_begin:Fg,normal_fragment_maps:Og,normal_pars_fragment:Bg,normal_pars_vertex:zg,normal_vertex:kg,normalmap_pars_fragment:Gg,clearcoat_normal_fragment_begin:Vg,clearcoat_normal_fragment_maps:Hg,clearcoat_pars_fragment:Wg,iridescence_pars_fragment:Xg,opaque_fragment:qg,packing:Yg,premultiplied_alpha_fragment:Zg,project_vertex:Kg,dithering_fragment:$g,dithering_pars_fragment:Jg,roughnessmap_fragment:Qg,roughnessmap_pars_fragment:jg,shadowmap_pars_fragment:tx,shadowmap_pars_vertex:ex,shadowmap_vertex:nx,shadowmask_pars_fragment:ix,skinbase_vertex:rx,skinning_pars_vertex:sx,skinning_vertex:ax,skinnormal_vertex:ox,specularmap_fragment:lx,specularmap_pars_fragment:cx,tonemapping_fragment:ux,tonemapping_pars_fragment:hx,transmission_fragment:fx,transmission_pars_fragment:dx,uv_pars_fragment:px,uv_pars_vertex:mx,uv_vertex:_x,worldpos_vertex:gx,background_vert:xx,background_frag:vx,backgroundCube_vert:Mx,backgroundCube_frag:Sx,cube_vert:yx,cube_frag:bx,depth_vert:Tx,depth_frag:Ex,distance_vert:wx,distance_frag:Ax,equirect_vert:Rx,equirect_frag:Cx,linedashed_vert:Px,linedashed_frag:Lx,meshbasic_vert:Dx,meshbasic_frag:Ix,meshlambert_vert:Nx,meshlambert_frag:Ux,meshmatcap_vert:Fx,meshmatcap_frag:Ox,meshnormal_vert:Bx,meshnormal_frag:zx,meshphong_vert:kx,meshphong_frag:Gx,meshphysical_vert:Vx,meshphysical_frag:Hx,meshtoon_vert:Wx,meshtoon_frag:Xx,points_vert:qx,points_frag:Yx,shadow_vert:Zx,shadow_frag:Kx,sprite_vert:$x,sprite_frag:Jx},vt={common:{diffuse:{value:new Jt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Yt}},envmap:{envMap:{value:null},envMapRotation:{value:new Yt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Yt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Yt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Yt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Yt},normalScale:{value:new ft(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Yt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Yt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Yt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Yt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Jt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new I},probesMax:{value:new I},probesResolution:{value:new I}},points:{diffuse:{value:new Jt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0},uvTransform:{value:new Yt}},sprite:{diffuse:{value:new Jt(16777215)},opacity:{value:1},center:{value:new ft(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Yt},alphaMap:{value:null},alphaMapTransform:{value:new Yt},alphaTest:{value:0}}},Kn={basic:{uniforms:Qe([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:Qe([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new Jt(0)},envMapIntensity:{value:1}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:Qe([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new Jt(0)},specular:{value:new Jt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:Qe([vt.common,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.roughnessmap,vt.metalnessmap,vt.fog,vt.lights,{emissive:{value:new Jt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:Qe([vt.common,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.gradientmap,vt.fog,vt.lights,{emissive:{value:new Jt(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:Qe([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:Qe([vt.points,vt.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:Qe([vt.common,vt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:Qe([vt.common,vt.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:Qe([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:Qe([vt.sprite,vt.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new Yt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Yt}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distance:{uniforms:Qe([vt.common,vt.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distance_vert,fragmentShader:te.distance_frag},shadow:{uniforms:Qe([vt.lights,vt.fog,{color:{value:new Jt(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};Kn.physical={uniforms:Qe([Kn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Yt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Yt},clearcoatNormalScale:{value:new ft(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Yt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Yt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Yt},sheen:{value:0},sheenColor:{value:new Jt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Yt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Yt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Yt},transmissionSamplerSize:{value:new ft},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Yt},attenuationDistance:{value:0},attenuationColor:{value:new Jt(0)},specularColor:{value:new Jt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Yt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Yt},anisotropyVector:{value:new ft},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Yt}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};const pa={r:0,b:0,g:0},Qx=new Ae,pd=new Yt;pd.set(-1,0,0,0,1,0,0,0,1);function jx(r,t,e,n,i,s){const a=new Jt(0);let o=i===!0?0:1,l,c,u=null,f=0,h=null;function d(M){let T=M.isScene===!0?M.background:null;if(T&&T.isTexture){const x=M.backgroundBlurriness>0;T=t.get(T,x)}return T}function g(M){let T=!1;const x=d(M);x===null?m(a,o):x&&x.isColor&&(m(x,1),T=!0);const y=r.xr.getEnvironmentBlendMode();y==="additive"?e.buffers.color.setClear(0,0,0,1,s):y==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,s),(r.autoClear||T)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function _(M,T){const x=d(T);x&&(x.isCubeTexture||x.mapping===qa)?(c===void 0&&(c=new Ln(new vi(1,1,1),new Gn({name:"BackgroundCubeMaterial",uniforms:Qr(Kn.backgroundCube.uniforms),vertexShader:Kn.backgroundCube.vertexShader,fragmentShader:Kn.backgroundCube.fragmentShader,side:on,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(y,E,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Qx.makeRotationFromEuler(T.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(pd),c.material.toneMapped=re.getTransfer(x.colorSpace)!==fe,(u!==x||f!==x.version||h!==r.toneMapping)&&(c.material.needsUpdate=!0,u=x,f=x.version,h=r.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new Ln(new Vs(2,2),new Gn({name:"BackgroundMaterial",uniforms:Qr(Kn.background.uniforms),vertexShader:Kn.background.vertexShader,fragmentShader:Kn.background.fragmentShader,side:ar,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.toneMapped=re.getTransfer(x.colorSpace)!==fe,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||f!==x.version||h!==r.toneMapping)&&(l.material.needsUpdate=!0,u=x,f=x.version,h=r.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function m(M,T){M.getRGB(pa,ud(r)),e.buffers.color.setClear(pa.r,pa.g,pa.b,T,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,T=1){a.set(M),o=T,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,m(a,o)},render:g,addToRenderList:_,dispose:p}}function tv(r,t){const e=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=h(null);let s=i,a=!1;function o(P,N,z,L,B){let X=!1;const G=f(P,L,z,N);s!==G&&(s=G,c(s.object)),X=d(P,L,z,B),X&&g(P,L,z,B),B!==null&&t.update(B,r.ELEMENT_ARRAY_BUFFER),(X||a)&&(a=!1,x(P,N,z,L),B!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(B).buffer))}function l(){return r.createVertexArray()}function c(P){return r.bindVertexArray(P)}function u(P){return r.deleteVertexArray(P)}function f(P,N,z,L){const B=L.wireframe===!0;let X=n[N.id];X===void 0&&(X={},n[N.id]=X);const G=P.isInstancedMesh===!0?P.id:0;let et=X[G];et===void 0&&(et={},X[G]=et);let Y=et[z.id];Y===void 0&&(Y={},et[z.id]=Y);let J=Y[B];return J===void 0&&(J=h(l()),Y[B]=J),J}function h(P){const N=[],z=[],L=[];for(let B=0;B<e;B++)N[B]=0,z[B]=0,L[B]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:z,attributeDivisors:L,object:P,attributes:{},index:null}}function d(P,N,z,L){const B=s.attributes,X=N.attributes;let G=0;const et=z.getAttributes();for(const Y in et)if(et[Y].location>=0){const Q=B[Y];let bt=X[Y];if(bt===void 0&&(Y==="instanceMatrix"&&P.instanceMatrix&&(bt=P.instanceMatrix),Y==="instanceColor"&&P.instanceColor&&(bt=P.instanceColor)),Q===void 0||Q.attribute!==bt||bt&&Q.data!==bt.data)return!0;G++}return s.attributesNum!==G||s.index!==L}function g(P,N,z,L){const B={},X=N.attributes;let G=0;const et=z.getAttributes();for(const Y in et)if(et[Y].location>=0){let Q=X[Y];Q===void 0&&(Y==="instanceMatrix"&&P.instanceMatrix&&(Q=P.instanceMatrix),Y==="instanceColor"&&P.instanceColor&&(Q=P.instanceColor));const bt={};bt.attribute=Q,Q&&Q.data&&(bt.data=Q.data),B[Y]=bt,G++}s.attributes=B,s.attributesNum=G,s.index=L}function _(){const P=s.newAttributes;for(let N=0,z=P.length;N<z;N++)P[N]=0}function m(P){p(P,0)}function p(P,N){const z=s.newAttributes,L=s.enabledAttributes,B=s.attributeDivisors;z[P]=1,L[P]===0&&(r.enableVertexAttribArray(P),L[P]=1),B[P]!==N&&(r.vertexAttribDivisor(P,N),B[P]=N)}function M(){const P=s.newAttributes,N=s.enabledAttributes;for(let z=0,L=N.length;z<L;z++)N[z]!==P[z]&&(r.disableVertexAttribArray(z),N[z]=0)}function T(P,N,z,L,B,X,G){G===!0?r.vertexAttribIPointer(P,N,z,B,X):r.vertexAttribPointer(P,N,z,L,B,X)}function x(P,N,z,L){_();const B=L.attributes,X=z.getAttributes(),G=N.defaultAttributeValues;for(const et in X){const Y=X[et];if(Y.location>=0){let J=B[et];if(J===void 0&&(et==="instanceMatrix"&&P.instanceMatrix&&(J=P.instanceMatrix),et==="instanceColor"&&P.instanceColor&&(J=P.instanceColor)),J!==void 0){const Q=J.normalized,bt=J.itemSize,xt=t.get(J);if(xt===void 0)continue;const Zt=xt.buffer,Ht=xt.type,ie=xt.bytesPerElement,K=Ht===r.INT||Ht===r.UNSIGNED_INT||J.gpuType===gc;if(J.isInterleavedBufferAttribute){const k=J.data,lt=k.stride,Lt=J.offset;if(k.isInstancedInterleavedBuffer){for(let mt=0;mt<Y.locationSize;mt++)p(Y.location+mt,k.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=k.meshPerAttribute*k.count)}else for(let mt=0;mt<Y.locationSize;mt++)m(Y.location+mt);r.bindBuffer(r.ARRAY_BUFFER,Zt);for(let mt=0;mt<Y.locationSize;mt++)T(Y.location+mt,bt/Y.locationSize,Ht,Q,lt*ie,(Lt+bt/Y.locationSize*mt)*ie,K)}else{if(J.isInstancedBufferAttribute){for(let k=0;k<Y.locationSize;k++)p(Y.location+k,J.meshPerAttribute);P.isInstancedMesh!==!0&&L._maxInstanceCount===void 0&&(L._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let k=0;k<Y.locationSize;k++)m(Y.location+k);r.bindBuffer(r.ARRAY_BUFFER,Zt);for(let k=0;k<Y.locationSize;k++)T(Y.location+k,bt/Y.locationSize,Ht,Q,bt*ie,bt/Y.locationSize*k*ie,K)}}else if(G!==void 0){const Q=G[et];if(Q!==void 0)switch(Q.length){case 2:r.vertexAttrib2fv(Y.location,Q);break;case 3:r.vertexAttrib3fv(Y.location,Q);break;case 4:r.vertexAttrib4fv(Y.location,Q);break;default:r.vertexAttrib1fv(Y.location,Q)}}}}M()}function y(){b();for(const P in n){const N=n[P];for(const z in N){const L=N[z];for(const B in L){const X=L[B];for(const G in X)u(X[G].object),delete X[G];delete L[B]}}delete n[P]}}function E(P){if(n[P.id]===void 0)return;const N=n[P.id];for(const z in N){const L=N[z];for(const B in L){const X=L[B];for(const G in X)u(X[G].object),delete X[G];delete L[B]}}delete n[P.id]}function A(P){for(const N in n){const z=n[N];for(const L in z){const B=z[L];if(B[P.id]===void 0)continue;const X=B[P.id];for(const G in X)u(X[G].object),delete X[G];delete B[P.id]}}}function v(P){for(const N in n){const z=n[N],L=P.isInstancedMesh===!0?P.id:0,B=z[L];if(B!==void 0){for(const X in B){const G=B[X];for(const et in G)u(G[et].object),delete G[et];delete B[X]}delete z[L],Object.keys(z).length===0&&delete n[N]}}}function b(){R(),a=!0,s!==i&&(s=i,c(s.object))}function R(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:b,resetDefaultState:R,dispose:y,releaseStatesOfGeometry:E,releaseStatesOfObject:v,releaseStatesOfProgram:A,initAttributes:_,enableAttribute:m,disableUnusedAttributes:M}}function ev(r,t,e){let n;function i(l){n=l}function s(l,c){r.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,u){u!==0&&(r.drawArraysInstanced(n,l,c,u),e.update(c,n,u))}function o(l,c,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,u);let h=0;for(let d=0;d<u;d++)h+=c[d];e.update(h,n,1)}this.setMode=i,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function nv(r,t,e,n){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const A=t.get("EXT_texture_filter_anisotropic");i=r.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(A){return!(A!==Cn&&n.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(A){const v=A===kn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==pn&&A!==jn&&!v&&n.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE))}function l(A){if(A==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(Wt("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const f=e.logarithmicDepthBuffer===!0,h=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&h===!1&&Wt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const d=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),g=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=r.getParameter(r.MAX_TEXTURE_SIZE),m=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),p=r.getParameter(r.MAX_VERTEX_ATTRIBS),M=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),T=r.getParameter(r.MAX_VARYING_VECTORS),x=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),y=r.getParameter(r.MAX_SAMPLES),E=r.getParameter(r.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:d,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:M,maxVaryings:T,maxFragmentUniforms:x,maxSamples:y,samples:E}}function iv(r){const t=this;let e=null,n=0,i=!1,s=!1;const a=new Ci,o=new Yt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){const d=f.length!==0||h||n!==0||i;return i=h,n=f.length,d},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,h){e=u(f,h,0)},this.setState=function(f,h,d){const g=f.clippingPlanes,_=f.clipIntersection,m=f.clipShadows,p=r.get(f);if(!i||g===null||g.length===0||s&&!m)s?u(null):c();else{const M=s?0:n,T=M*4;let x=p.clippingState||null;l.value=x,x=u(g,h,T,d);for(let y=0;y!==T;++y)x[y]=e[y];p.clippingState=x,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(f,h,d,g){const _=f!==null?f.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const p=d+_*4,M=h.matrixWorldInverse;o.getNormalMatrix(M),(m===null||m.length<p)&&(m=new Float32Array(p));for(let T=0,x=d;T!==_;++T,x+=4)a.copy(f[T]).applyMatrix4(M,o),a.normal.toArray(m,x),m[x+3]=a.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}const Or=4,rv=6,sv=20,av=256,cs=new Za,ih=new Jt;let Fo=null,Oo=0,Bo=0,zo=!1;const ov=new I,Zi=new I;class rh{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,i=100,s={}){const{size:a=256,position:o=ov}=s;Fo=this._renderer.getRenderTarget(),Oo=this._renderer.getActiveCubeFace(),Bo=this._renderer.getActiveMipmapLevel(),zo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,i,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=oh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ah(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Fo,Oo,Bo),this._renderer.xr.enabled=zo,t.scissorTest=!1,Cr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===or||t.mapping===Kr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Fo=this._renderer.getRenderTarget(),Oo=this._renderer.getActiveCubeFace(),Bo=this._renderer.getActiveMipmapLevel(),zo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ze,minFilter:Ze,generateMipmaps:!1,type:kn,format:Cn,colorSpace:Oa,depthBuffer:!1},i=sh(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=sh(t,e,n);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=lv(s)),this._blurMaterial=uv(s,t,e),this._ggxMaterial=cv(s,t,e)}return i}_compileMaterial(t){const e=new Ln(new tn,t);this._renderer.compile(e,cs)}_sceneToCubeUV(t,e,n,i,s){const l=new wn(90,1,e,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,d=f.toneMapping;f.getClearColor(ih),f.toneMapping=ni,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(i),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ln(new vi,new Rc({name:"PMREM.Background",side:on,depthWrite:!1,depthTest:!1})));const _=this._backgroundBox,m=_.material;let p=!1;const M=t.background;M?M.isColor&&(m.color.copy(M),t.background=null,p=!0):(m.color.copy(ih),p=!0);for(let T=0;T<6;T++){const x=T%3;x===0?(l.up.set(0,c[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+u[T],s.y,s.z)):x===1?(l.up.set(0,0,c[T]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+u[T],s.z)):(l.up.set(0,c[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+u[T]));const y=this._cubeSize;Cr(i,x*y,T>2?y:0,y,y),f.setRenderTarget(i),p&&f.render(_,l),f.render(t,l)}f.toneMapping=d,f.autoClear=h,t.background=M}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===or||t.mapping===Kr;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=oh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ah());const s=i?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=t;const l=this._cubeSize;Cr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,cs)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodMeshes.length;for(let s=1;s<i;s++)this._applyGGXFilter(t,s-1,s);e.autoClear=n}_applyGGXFilter(t,e,n){const i=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const l=a.uniforms,c=n/(this._lodMeshes.length-1),u=e/(this._lodMeshes.length-1),f=Math.sqrt(c*c-u*u),h=c*1.25,d=f*h,{_lodMax:g}=this,_=this._sizeLods[n],m=3*_*(n>g-Or?n-g+Or:0),p=4*(this._cubeSize-_);l.envMap.value=t.texture,l.roughness.value=d,l.mipInt.value=g-e,Cr(s,m,p,3*_,2*_),i.setRenderTarget(s),i.render(o,cs),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=g-n,Cr(t,m,p,3*_,2*_),i.setRenderTarget(t),i.render(o,cs)}_blur(t,e,n,i){const s=this._pingPongRenderTarget,a=Math.min(i,Math.PI)/Math.SQRT2;this._blurPass(t,s,e,n,a),this._blurPass(s,t,n,n,a)}_blurPass(t,e,n,i,s){const a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[i];l.material=o;const c=o.uniforms;c.envMap.value=t.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-n;const u=this._sizeLods[i],f=3*u*(i>this._lodMax-Or?i-this._lodMax+Or:0),h=4*(this._cubeSize-u);Cr(e,f,h,3*u,2*u),a.setRenderTarget(e),a.render(l,cs)}}function lv(r){const t=[],e=[];let n=r;const i=r-Or+1+rv;for(let s=0;s<i;s++){const a=Math.pow(2,n);t.push(a);const o=1/(a-2),l=-o,c=1+o,u=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,h=6,d=3,g=new Float32Array(d*h*f),_=new Float32Array(d*h*f);for(let p=0;p<f;p++){const M=p%3*2/3-1,T=p>2?0:-1,x=[M,T,0,M+2/3,T,0,M+2/3,T+1,0,M,T,0,M+2/3,T+1,0,M,T+1,0];g.set(x,d*h*p);for(let y=0;y<h;y++){const E=u[y*2]*2-1,A=u[y*2+1]*2-1;p===0?Zi.set(1,A,E):p===1?Zi.set(-E,1,-A):p===2?Zi.set(-E,A,1):p===3?Zi.set(-1,A,-E):p===4?Zi.set(-E,-1,A):Zi.set(E,A,-1),Zi.toArray(_,(p*h+y)*d)}}const m=new tn;m.setAttribute("position",new mi(g,d)),m.setAttribute("outputDirection",new mi(_,d)),e.push(new Ln(m,null)),n>Or&&n--}return{lodMeshes:e,sizeLods:t}}function sh(r,t,e){const n=new xn(r,t,e);return n.texture.mapping=qa,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Cr(r,t,e,n,i){r.viewport.set(t,e,n,i),r.scissor.set(t,e,n,i)}function cv(r,t,e){return new Gn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:av,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ka(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function uv(r,t,e){return new Gn({name:"SphericalGaussianBlur",defines:{SAMPLES:sv,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Ka(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function ah(){return new Gn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ka(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function oh(){return new Gn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ka(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:di,depthTest:!1,depthWrite:!1})}function Ka(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class md extends xn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new td(i),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new vi(5,5,5),s=new Gn({name:"CubemapFromEquirect",uniforms:Qr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:on,blending:di});s.uniforms.tEquirect.value=e;const a=new Ln(i,s),o=e.minFilter;return e.minFilter===ji&&(e.minFilter=Ze),new p_(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,i=!0){const s=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,i);t.setRenderTarget(s)}}function hv(r){let t=new WeakMap,e=new WeakMap,n=null;function i(h,d=!1){return h==null?null:d?a(h):s(h)}function s(h){if(h&&h.isTexture){const d=h.mapping;if(d===oo||d===lo)if(t.has(h)){const g=t.get(h).texture;return o(g,h.mapping)}else{const g=h.image;if(g&&g.height>0){const _=new md(g.height);return _.fromEquirectangularTexture(r,h),t.set(h,_),h.addEventListener("dispose",c),o(_.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){const d=h.mapping,g=d===oo||d===lo,_=d===or||d===Kr;if(g||_){let m=e.get(h);const p=m!==void 0?m.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==p)return n===null&&(n=new rh(r)),m=g?n.fromEquirectangular(h,m):n.fromCubemap(h,m),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),m.texture;if(m!==void 0)return m.texture;{const M=h.image;return g&&M&&M.height>0||_&&M&&l(M)?(n===null&&(n=new rh(r)),m=g?n.fromEquirectangular(h):n.fromCubemap(h),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),h.addEventListener("dispose",u),m.texture):null}}}return h}function o(h,d){return d===oo?h.mapping=or:d===lo&&(h.mapping=Kr),h}function l(h){let d=0;const g=6;for(let _=0;_<g;_++)h[_]!==void 0&&d++;return d===g}function c(h){const d=h.target;d.removeEventListener("dispose",c);const g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function u(h){const d=h.target;d.removeEventListener("dispose",u);const g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:f}}function fv(r){const t={};function e(n){if(t[n]!==void 0)return t[n];const i=r.getExtension(n);return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Gr("WebGLRenderer: "+n+" extension not supported."),i}}}function dv(r,t,e,n){const i={},s=new WeakMap;function a(f){const h=f.target;h.index!==null&&t.remove(h.index);for(const g in h.attributes)t.remove(h.attributes[g]);h.removeEventListener("dispose",a),delete i[h.id];const d=s.get(h);d&&(t.remove(d),s.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(f,h){return i[h.id]===!0||(h.addEventListener("dispose",a),i[h.id]=!0,e.memory.geometries++),h}function l(f){const h=f.attributes;for(const d in h)t.update(h[d],r.ARRAY_BUFFER)}function c(f){const h=[],d=f.index,g=f.attributes.position;let _=0;if(g===void 0)return;if(d!==null){const M=d.array;_=d.version;for(let T=0,x=M.length;T<x;T+=3){const y=M[T+0],E=M[T+1],A=M[T+2];h.push(y,E,E,A,A,y)}}else{const M=g.array;_=g.version;for(let T=0,x=M.length/3-1;T<x;T+=3){const y=T+0,E=T+1,A=T+2;h.push(y,E,E,A,A,y)}}const m=new(g.count>=65535?Qf:Jf)(h,1);m.version=_;const p=s.get(f);p&&t.remove(p),s.set(f,m)}function u(f){const h=s.get(f);if(h){const d=f.index;d!==null&&h.version<d.version&&c(f)}else c(f);return s.get(f)}return{get:o,update:l,getWireframeAttribute:u}}function pv(r,t,e){let n;function i(f){n=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function l(f,h){r.drawElements(n,h,s,f*a),e.update(h,n,1)}function c(f,h,d){d!==0&&(r.drawElementsInstanced(n,h,s,f*a,d),e.update(h,n,d))}function u(f,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,s,f,0,d);let _=0;for(let m=0;m<d;m++)_+=h[m];e.update(_,n,1)}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function mv(r){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(e.calls++,a){case r.TRIANGLES:e.triangles+=o*(s/3);break;case r.LINES:e.lines+=o*(s/2);break;case r.LINE_STRIP:e.lines+=o*(s-1);break;case r.LINE_LOOP:e.lines+=o*s;break;case r.POINTS:e.points+=o*s;break;default:le("WebGLInfo: Unknown draw mode:",a);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function _v(r,t,e){const n=new WeakMap,i=new Ee;function s(a,o,l){const c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0;let h=n.get(o);if(h===void 0||h.count!==f){let b=function(){A.dispose(),n.delete(o),o.removeEventListener("dispose",b)};h!==void 0&&h.texture.dispose();const d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let T=0;d===!0&&(T=1),g===!0&&(T=2),_===!0&&(T=3);let x=o.attributes.position.count*T,y=1;x>t.maxTextureSize&&(y=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);const E=new Float32Array(x*y*4*f),A=new Zf(E,x,y,f);A.type=jn,A.needsUpdate=!0;const v=T*4;for(let R=0;R<f;R++){const P=m[R],N=p[R],z=M[R],L=x*y*4*R;for(let B=0;B<P.count;B++){const X=B*v;d===!0&&(i.fromBufferAttribute(P,B),E[L+X+0]=i.x,E[L+X+1]=i.y,E[L+X+2]=i.z,E[L+X+3]=0),g===!0&&(i.fromBufferAttribute(N,B),E[L+X+4]=i.x,E[L+X+5]=i.y,E[L+X+6]=i.z,E[L+X+7]=0),_===!0&&(i.fromBufferAttribute(z,B),E[L+X+8]=i.x,E[L+X+9]=i.y,E[L+X+10]=i.z,E[L+X+11]=z.itemSize===4?i.w:1)}}h={count:f,texture:A,size:new ft(x,y)},n.set(o,h),o.addEventListener("dispose",b)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",a.morphTexture,e);else{let d=0;for(let _=0;_<c.length;_++)d+=c[_];const g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(r,"morphTargetBaseInfluence",g),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(r,"morphTargetsTextureSize",h.size)}return{update:s}}function gv(r,t,e,n,i){let s=new WeakMap;function a(c){const u=i.render.frame,f=c.geometry,h=t.get(c,f);if(s.get(h)!==u&&(t.update(h),s.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==u&&(e.update(c.instanceMatrix,r.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,r.ARRAY_BUFFER),s.set(c,u))),c.isSkinnedMesh){const d=c.skeleton;s.get(d)!==u&&(d.update(),s.set(d,u))}return h}function o(){s=new WeakMap}function l(c){const u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}const xv={[Df]:"LINEAR_TONE_MAPPING",[If]:"REINHARD_TONE_MAPPING",[Nf]:"CINEON_TONE_MAPPING",[Uf]:"ACES_FILMIC_TONE_MAPPING",[Of]:"AGX_TONE_MAPPING",[Bf]:"NEUTRAL_TONE_MAPPING",[Ff]:"CUSTOM_TONE_MAPPING"};function vv(r,t,e,n,i,s){const a=new xn(t,e,{type:r,depthBuffer:i,stencilBuffer:s,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null;const c=new tn;c.setAttribute("position",new ve([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new ve([0,2,0,0,2,0],2));const u=new a_({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new Ln(c,u),h=new Za(-1,1,1,-1,0,1);let d=null,g=null,_=!1,m,p=null,M=[],T=!1;this.setSize=function(x,y){a.setSize(x,y),o!==null&&o.setSize(x,y),l!==null&&l.setSize(x,y);for(let E=0;E<M.length;E++){const A=M[E];A.setSize&&A.setSize(x,y)}},this.setEffects=function(x){M=x,T=M.length>0&&M[0].isRenderPass===!0;const y=a.width,E=a.height;M.length>0&&o===null&&(o=new xn(y,E,{type:kn,depthBuffer:!1,stencilBuffer:!1}),l=new xn(y,E,{type:kn,depthBuffer:!1,stencilBuffer:!1}));for(let A=0;A<M.length;A++){const v=M[A];v.setSize&&v.setSize(y,E)}},this.begin=function(x,y){if(_||x.toneMapping===ni&&M.length===0)return!1;if(p=y,y!==null){const E=y.width,A=y.height;(a.width!==E||a.height!==A)&&this.setSize(E,A)}return T===!1&&x.setRenderTarget(a),m=x.toneMapping,x.toneMapping=ni,!0},this.hasRenderPass=function(){return T},this.end=function(x,y){x.toneMapping=m,_=!0;let E=a,A=o;for(let v=0;v<M.length;v++){const b=M[v];b.enabled!==!1&&(b.render(x,A,E,y),b.needsSwap!==!1&&(E=A,A=A===o?l:o))}if(d!==x.outputColorSpace||g!==x.toneMapping){d=x.outputColorSpace,g=x.toneMapping,u.defines={},re.getTransfer(d)===fe&&(u.defines.SRGB_TRANSFER="");const v=xv[g];v&&(u.defines[v]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=E.texture,x.setRenderTarget(p),x.render(f,h),p=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}const _d=new je,$l=new $r(1,1),gd=new Zf,xd=new s0,vd=new td,lh=[],ch=[],uh=new Float32Array(16),hh=new Float32Array(9),fh=new Float32Array(4);function ns(r,t,e){const n=r[0];if(n<=0||n>0)return r;const i=t*e;let s=lh[i];if(s===void 0&&(s=new Float32Array(i),lh[i]=s),t!==0){n.toArray(s,0);for(let a=1,o=0;a!==t;++a)o+=e,r[a].toArray(s,o)}return s}function Ue(r,t){if(r.length!==t.length)return!1;for(let e=0,n=r.length;e<n;e++)if(r[e]!==t[e])return!1;return!0}function Fe(r,t){for(let e=0,n=t.length;e<n;e++)r[e]=t[e]}function $a(r,t){let e=ch[t];e===void 0&&(e=new Int32Array(t),ch[t]=e);for(let n=0;n!==t;++n)e[n]=r.allocateTextureUnit();return e}function Mv(r,t){const e=this.cache;e[0]!==t&&(r.uniform1f(this.addr,t),e[0]=t)}function Sv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;r.uniform2fv(this.addr,t),Fe(e,t)}}function yv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(r.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ue(e,t))return;r.uniform3fv(this.addr,t),Fe(e,t)}}function bv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;r.uniform4fv(this.addr,t),Fe(e,t)}}function Tv(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ue(e,t))return;r.uniformMatrix2fv(this.addr,!1,t),Fe(e,t)}else{if(Ue(e,n))return;fh.set(n),r.uniformMatrix2fv(this.addr,!1,fh),Fe(e,n)}}function Ev(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ue(e,t))return;r.uniformMatrix3fv(this.addr,!1,t),Fe(e,t)}else{if(Ue(e,n))return;hh.set(n),r.uniformMatrix3fv(this.addr,!1,hh),Fe(e,n)}}function wv(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ue(e,t))return;r.uniformMatrix4fv(this.addr,!1,t),Fe(e,t)}else{if(Ue(e,n))return;uh.set(n),r.uniformMatrix4fv(this.addr,!1,uh),Fe(e,n)}}function Av(r,t){const e=this.cache;e[0]!==t&&(r.uniform1i(this.addr,t),e[0]=t)}function Rv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;r.uniform2iv(this.addr,t),Fe(e,t)}}function Cv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ue(e,t))return;r.uniform3iv(this.addr,t),Fe(e,t)}}function Pv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;r.uniform4iv(this.addr,t),Fe(e,t)}}function Lv(r,t){const e=this.cache;e[0]!==t&&(r.uniform1ui(this.addr,t),e[0]=t)}function Dv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ue(e,t))return;r.uniform2uiv(this.addr,t),Fe(e,t)}}function Iv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ue(e,t))return;r.uniform3uiv(this.addr,t),Fe(e,t)}}function Nv(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ue(e,t))return;r.uniform4uiv(this.addr,t),Fe(e,t)}}function Uv(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?($l.compareFunction=e.isReversedDepthBuffer()?Tc:bc,s=$l):s=_d,e.setTexture2D(t||s,i)}function Fv(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||xd,i)}function Ov(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||vd,i)}function Bv(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||gd,i)}function zv(r){switch(r){case 5126:return Mv;case 35664:return Sv;case 35665:return yv;case 35666:return bv;case 35674:return Tv;case 35675:return Ev;case 35676:return wv;case 5124:case 35670:return Av;case 35667:case 35671:return Rv;case 35668:case 35672:return Cv;case 35669:case 35673:return Pv;case 5125:return Lv;case 36294:return Dv;case 36295:return Iv;case 36296:return Nv;case 35678:case 36198:case 36298:case 36306:case 35682:return Uv;case 35679:case 36299:case 36307:return Fv;case 35680:case 36300:case 36308:case 36293:return Ov;case 36289:case 36303:case 36311:case 36292:return Bv}}function kv(r,t){r.uniform1fv(this.addr,t)}function Gv(r,t){const e=ns(t,this.size,2);r.uniform2fv(this.addr,e)}function Vv(r,t){const e=ns(t,this.size,3);r.uniform3fv(this.addr,e)}function Hv(r,t){const e=ns(t,this.size,4);r.uniform4fv(this.addr,e)}function Wv(r,t){const e=ns(t,this.size,4);r.uniformMatrix2fv(this.addr,!1,e)}function Xv(r,t){const e=ns(t,this.size,9);r.uniformMatrix3fv(this.addr,!1,e)}function qv(r,t){const e=ns(t,this.size,16);r.uniformMatrix4fv(this.addr,!1,e)}function Yv(r,t){r.uniform1iv(this.addr,t)}function Zv(r,t){r.uniform2iv(this.addr,t)}function Kv(r,t){r.uniform3iv(this.addr,t)}function $v(r,t){r.uniform4iv(this.addr,t)}function Jv(r,t){r.uniform1uiv(this.addr,t)}function Qv(r,t){r.uniform2uiv(this.addr,t)}function jv(r,t){r.uniform3uiv(this.addr,t)}function tM(r,t){r.uniform4uiv(this.addr,t)}function eM(r,t,e){const n=this.cache,i=t.length,s=$a(e,i);Ue(n,s)||(r.uniform1iv(this.addr,s),Fe(n,s));let a;this.type===r.SAMPLER_2D_SHADOW?a=$l:a=_d;for(let o=0;o!==i;++o)e.setTexture2D(t[o]||a,s[o])}function nM(r,t,e){const n=this.cache,i=t.length,s=$a(e,i);Ue(n,s)||(r.uniform1iv(this.addr,s),Fe(n,s));for(let a=0;a!==i;++a)e.setTexture3D(t[a]||xd,s[a])}function iM(r,t,e){const n=this.cache,i=t.length,s=$a(e,i);Ue(n,s)||(r.uniform1iv(this.addr,s),Fe(n,s));for(let a=0;a!==i;++a)e.setTextureCube(t[a]||vd,s[a])}function rM(r,t,e){const n=this.cache,i=t.length,s=$a(e,i);Ue(n,s)||(r.uniform1iv(this.addr,s),Fe(n,s));for(let a=0;a!==i;++a)e.setTexture2DArray(t[a]||gd,s[a])}function sM(r){switch(r){case 5126:return kv;case 35664:return Gv;case 35665:return Vv;case 35666:return Hv;case 35674:return Wv;case 35675:return Xv;case 35676:return qv;case 5124:case 35670:return Yv;case 35667:case 35671:return Zv;case 35668:case 35672:return Kv;case 35669:case 35673:return $v;case 5125:return Jv;case 36294:return Qv;case 36295:return jv;case 36296:return tM;case 35678:case 36198:case 36298:case 36306:case 35682:return eM;case 35679:case 36299:case 36307:return nM;case 35680:case 36300:case 36308:case 36293:return iM;case 36289:case 36303:case 36311:case 36292:return rM}}class aM{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=zv(e.type)}}class oM{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=sM(e.type)}}class lM{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let s=0,a=i.length;s!==a;++s){const o=i[s];o.setValue(t,e[o.id],n)}}}const ko=/(\w+)(\])?(\[|\.)?/g;function dh(r,t){r.seq.push(t),r.map[t.id]=t}function cM(r,t,e){const n=r.name,i=n.length;for(ko.lastIndex=0;;){const s=ko.exec(n),a=ko.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){dh(e,c===void 0?new aM(o,r,t):new oM(o,r,t));break}else{let f=e.map[o];f===void 0&&(f=new lM(o),dh(e,f)),e=f}}}class Ea{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);cM(o,l,this)}const i=[],s=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?i.push(a):s.push(a);i.length>0&&(this.seq=i.concat(s))}setValue(t,e,n,i){const s=this.map[e];s!==void 0&&s.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let s=0,a=e.length;s!==a;++s){const o=e[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,s=t.length;i!==s;++i){const a=t[i];a.id in e&&n.push(a)}return n}}function ph(r,t,e){const n=r.createShader(t);return r.shaderSource(n,e),r.compileShader(n),n}const uM=37297;let hM=0;function fM(r,t){const e=r.split(`
`),n=[],i=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let a=i;a<s;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const mh=new Yt;function dM(r){re._getMatrix(mh,re.workingColorSpace,r);const t=`mat3( ${mh.elements.map(e=>e.toFixed(4))} )`;switch(re.getTransfer(r)){case Ba:return[t,"LinearTransferOETF"];case fe:return[t,"sRGBTransferOETF"];default:return Wt("WebGLProgram: Unsupported color space: ",r),[t,"LinearTransferOETF"]}}function _h(r,t,e){const n=r.getShaderParameter(t,r.COMPILE_STATUS),s=(r.getShaderInfoLog(t)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+s+`

`+fM(r.getShaderSource(t),o)}else return s}function pM(r,t){const e=dM(t);return[`vec4 ${r}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const mM={[Df]:"Linear",[If]:"Reinhard",[Nf]:"Cineon",[Uf]:"ACESFilmic",[Of]:"AgX",[Bf]:"Neutral",[Ff]:"Custom"};function _M(r,t){const e=mM[t];return e===void 0?(Wt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+r+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+r+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const ma=new I;function gM(){re.getLuminanceCoefficients(ma);const r=ma.x.toFixed(4),t=ma.y.toFixed(4),e=ma.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function xM(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(_s).join(`
`)}function vM(r){const t=[];for(const e in r){const n=r[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function MM(r,t){const e={},n=r.getProgramParameter(t,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=r.getActiveAttrib(t,i),a=s.name;let o=1;s.type===r.FLOAT_MAT2&&(o=2),s.type===r.FLOAT_MAT3&&(o=3),s.type===r.FLOAT_MAT4&&(o=4),e[a]={type:s.type,location:r.getAttribLocation(t,a),locationSize:o}}return e}function _s(r){return r!==""}function gh(r,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return r.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function xh(r,t){return r.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const SM=/^[ \t]*#include +<([\w\d./]+)>/gm;function Jl(r){return r.replace(SM,bM)}const yM=new Map;function bM(r,t){let e=te[t];if(e===void 0){const n=yM.get(t);if(n!==void 0)e=te[n],Wt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Jl(e)}const TM=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function vh(r){return r.replace(TM,EM)}function EM(r,t,e,n){let i="";for(let s=parseInt(t);s<parseInt(e);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function Mh(r){let t=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?t+=`
#define HIGH_PRECISION`:r.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const wM={[Ma]:"SHADOWMAP_TYPE_PCF",[ps]:"SHADOWMAP_TYPE_VSM"};function AM(r){return wM[r.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const RM={[or]:"ENVMAP_TYPE_CUBE",[Kr]:"ENVMAP_TYPE_CUBE",[qa]:"ENVMAP_TYPE_CUBE_UV"};function CM(r){return r.envMap===!1?"ENVMAP_TYPE_CUBE":RM[r.envMapMode]||"ENVMAP_TYPE_CUBE"}const PM={[Kr]:"ENVMAP_MODE_REFRACTION"};function LM(r){return r.envMap===!1?"ENVMAP_MODE_REFLECTION":PM[r.envMapMode]||"ENVMAP_MODE_REFLECTION"}const DM={[Lf]:"ENVMAP_BLENDING_MULTIPLY",[Mm]:"ENVMAP_BLENDING_MIX",[Sm]:"ENVMAP_BLENDING_ADD"};function IM(r){return r.envMap===!1?"ENVMAP_BLENDING_NONE":DM[r.combine]||"ENVMAP_BLENDING_NONE"}function NM(r){const t=r.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function UM(r,t,e,n){const i=r.getContext(),s=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=AM(e),c=CM(e),u=LM(e),f=IM(e),h=NM(e),d=xM(e),g=vM(s),_=i.createProgram();let m,p,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(_s).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(_s).join(`
`),p.length>0&&(p+=`
`)):(m=[Mh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(_s).join(`
`),p=[Mh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ni?"#define TONE_MAPPING":"",e.toneMapping!==ni?te.tonemapping_pars_fragment:"",e.toneMapping!==ni?_M("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,pM("linearToOutputTexel",e.outputColorSpace),gM(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(_s).join(`
`)),a=Jl(a),a=gh(a,e),a=xh(a,e),o=Jl(o),o=gh(o,e),o=xh(o,e),a=vh(a),o=vh(o),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===bu?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===bu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const T=M+m+a,x=M+p+o,y=ph(i,i.VERTEX_SHADER,T),E=ph(i,i.FRAGMENT_SHADER,x);i.attachShader(_,y),i.attachShader(_,E),e.index0AttributeName!==void 0?i.bindAttribLocation(_,0,e.index0AttributeName):e.hasPositionAttribute===!0&&i.bindAttribLocation(_,0,"position"),i.linkProgram(_);function A(P){if(r.debug.checkShaderErrors){const N=i.getProgramInfoLog(_)||"",z=i.getShaderInfoLog(y)||"",L=i.getShaderInfoLog(E)||"",B=N.trim(),X=z.trim(),G=L.trim();let et=!0,Y=!0;if(i.getProgramParameter(_,i.LINK_STATUS)===!1)if(et=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,_,y,E);else{const J=_h(i,y,"vertex"),Q=_h(i,E,"fragment");le("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(_,i.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+B+`
`+J+`
`+Q)}else B!==""?Wt("WebGLProgram: Program Info Log:",B):(X===""||G==="")&&(Y=!1);Y&&(P.diagnostics={runnable:et,programLog:B,vertexShader:{log:X,prefix:m},fragmentShader:{log:G,prefix:p}})}i.deleteShader(y),i.deleteShader(E),v=new Ea(i,_),b=MM(i,_)}let v;this.getUniforms=function(){return v===void 0&&A(this),v};let b;this.getAttributes=function(){return b===void 0&&A(this),b};let R=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return R===!1&&(R=i.getProgramParameter(_,uM)),R},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=hM++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=y,this.fragmentShader=E,this}let FM=0;class OM{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){const i=this._getShaderCacheForMaterial(t);return i.has(e)===!1&&(i.add(e),e.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new BM(t),e.set(t,n)),n}}class BM{constructor(t){this.id=FM++,this.code=t,this.usedTimes=0}}function zM(r){return r===lr||r===Na||r===Ua}function kM(r,t,e,n,i,s){const a=new Kf,o=new OM,l=new Set,c=[],u=new Map,f=n.logarithmicDepthBuffer;let h=n.precision;const d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(v){return l.add(v),v===0?"uv":`uv${v}`}function _(v,b,R,P,N,z){const L=P.fog,B=N.geometry,X=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?P.environment:null,G=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,et=t.get(v.envMap||X,G),Y=et&&et.mapping===qa?et.image.height:null,J=d[v.type];v.precision!==null&&(h=n.getMaxPrecision(v.precision),h!==v.precision&&Wt("WebGLProgram.getParameters:",v.precision,"not supported, using",h,"instead."));const Q=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,bt=Q!==void 0?Q.length:0;let xt=0;B.morphAttributes.position!==void 0&&(xt=1),B.morphAttributes.normal!==void 0&&(xt=2),B.morphAttributes.color!==void 0&&(xt=3);let Zt,Ht,ie,K;if(J){const ge=Kn[J];Zt=ge.vertexShader,Ht=ge.fragmentShader}else{Zt=v.vertexShader,Ht=v.fragmentShader;const ge=o.getVertexShaderStage(v),ue=o.getFragmentShaderStage(v);o.update(v,ge,ue),ie=ge.id,K=ue.id}const k=r.getRenderTarget(),lt=r.state.buffers.depth.getReversed(),Lt=N.isInstancedMesh===!0,mt=N.isBatchedMesh===!0,Ot=!!v.map,Kt=!!v.matcap,j=!!et,it=!!v.aoMap,st=!!v.lightMap,rt=!!v.bumpMap&&v.wireframe===!1,ot=!!v.normalMap,At=!!v.displacementMap,Tt=!!v.emissiveMap,Ft=!!v.metalnessMap,Bt=!!v.roughnessMap,D=v.anisotropy>0,Qt=v.clearcoat>0,Gt=v.dispersion>0,C=v.retroreflectivity>0,S=v.iridescence>0,O=v.sheen>0,W=v.transmission>0,Z=D&&!!v.anisotropyMap,ht=Qt&&!!v.clearcoatMap,dt=Qt&&!!v.clearcoatNormalMap,$=Qt&&!!v.clearcoatRoughnessMap,nt=S&&!!v.iridescenceMap,pt=S&&!!v.iridescenceThicknessMap,It=O&&!!v.sheenColorMap,ct=O&&!!v.sheenRoughnessMap,ut=!!v.specularMap,Nt=!!v.specularColorMap,kt=!!v.specularIntensityMap,$t=W&&!!v.transmissionMap,F=W&&!!v.thicknessMap,_t=!!v.gradientMap,tt=!!v.alphaMap,gt=v.alphaTest>0,yt=!!v.alphaHash,at=!!v.extensions;let zt=ni;v.toneMapped&&(k===null||k.isXRRenderTarget===!0)&&(zt=r.toneMapping);const Dt={shaderID:J,shaderType:v.type,shaderName:v.name,vertexShader:Zt,fragmentShader:Ht,defines:v.defines,customVertexShaderID:ie,customFragmentShaderID:K,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:h,batching:mt,batchingColor:mt&&N._colorsTexture!==null,instancing:Lt,instancingColor:Lt&&N.instanceColor!==null,instancingMorph:Lt&&N.morphTexture!==null,outputColorSpace:k===null?r.outputColorSpace:k.isXRRenderTarget===!0?k.texture.colorSpace:re.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:Ot,matcap:Kt,envMap:j,envMapMode:j&&et.mapping,envMapCubeUVHeight:Y,aoMap:it,lightMap:st,bumpMap:rt,normalMap:ot,displacementMap:At,emissiveMap:Tt,normalMapObjectSpace:ot&&v.normalMapType===Tm,normalMapTangentSpace:ot&&v.normalMapType===Fa,packedNormalMap:ot&&v.normalMapType===Fa&&zM(v.normalMap.format),metalnessMap:Ft,roughnessMap:Bt,anisotropy:D,anisotropyMap:Z,clearcoat:Qt,clearcoatMap:ht,clearcoatNormalMap:dt,clearcoatRoughnessMap:$,dispersion:Gt,retroreflection:C,iridescence:S,iridescenceMap:nt,iridescenceThicknessMap:pt,sheen:O,sheenColorMap:It,sheenRoughnessMap:ct,specularMap:ut,specularColorMap:Nt,specularIntensityMap:kt,transmission:W,transmissionMap:$t,thicknessMap:F,gradientMap:_t,opaque:v.transparent===!1&&v.blending===Ms&&v.alphaToCoverage===!1,alphaMap:tt,alphaTest:gt,alphaHash:yt,combine:v.combine,mapUv:Ot&&g(v.map.channel),aoMapUv:it&&g(v.aoMap.channel),lightMapUv:st&&g(v.lightMap.channel),bumpMapUv:rt&&g(v.bumpMap.channel),normalMapUv:ot&&g(v.normalMap.channel),displacementMapUv:At&&g(v.displacementMap.channel),emissiveMapUv:Tt&&g(v.emissiveMap.channel),metalnessMapUv:Ft&&g(v.metalnessMap.channel),roughnessMapUv:Bt&&g(v.roughnessMap.channel),anisotropyMapUv:Z&&g(v.anisotropyMap.channel),clearcoatMapUv:ht&&g(v.clearcoatMap.channel),clearcoatNormalMapUv:dt&&g(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:$&&g(v.clearcoatRoughnessMap.channel),iridescenceMapUv:nt&&g(v.iridescenceMap.channel),iridescenceThicknessMapUv:pt&&g(v.iridescenceThicknessMap.channel),sheenColorMapUv:It&&g(v.sheenColorMap.channel),sheenRoughnessMapUv:ct&&g(v.sheenRoughnessMap.channel),specularMapUv:ut&&g(v.specularMap.channel),specularColorMapUv:Nt&&g(v.specularColorMap.channel),specularIntensityMapUv:kt&&g(v.specularIntensityMap.channel),transmissionMapUv:$t&&g(v.transmissionMap.channel),thicknessMapUv:F&&g(v.thicknessMap.channel),alphaMapUv:tt&&g(v.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(ot||D),vertexNormals:!!B.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!B.attributes.uv&&(Ot||tt),fog:!!L,useFog:v.fog===!0,fogExp2:!!L&&L.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||B.attributes.normal===void 0&&ot===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:lt,skinning:N.isSkinnedMesh===!0,hasPositionAttribute:B.attributes.position!==void 0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:bt,morphTextureStride:xt,numSunLights:b.sun.length,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numSunLightShadows:b.sunShadowMap.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numLightProbeGrids:z.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:v.dithering,shadowMapEnabled:r.shadowMap.enabled&&R.length>0,shadowMapType:r.shadowMap.type,toneMapping:zt,decodeVideoTexture:Ot&&v.map.isVideoTexture===!0&&re.getTransfer(v.map.colorSpace)===fe,decodeVideoTextureEmissive:Tt&&v.emissiveMap.isVideoTexture===!0&&re.getTransfer(v.emissiveMap.colorSpace)===fe,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Jn,flipSided:v.side===on,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:at&&v.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(at&&v.extensions.multiDraw===!0||mt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Dt.vertexUv1s=l.has(1),Dt.vertexUv2s=l.has(2),Dt.vertexUv3s=l.has(3),l.clear(),Dt}function m(v){const b=[];if(v.shaderID?b.push(v.shaderID):(b.push(v.customVertexShaderID),b.push(v.customFragmentShaderID)),v.defines!==void 0)for(const R in v.defines)b.push(R),b.push(v.defines[R]);return v.isRawShaderMaterial===!1&&(p(b,v),M(b,v),b.push(r.outputColorSpace)),b.push(v.customProgramCacheKey),b.join()}function p(v,b){v.push(b.precision),v.push(b.outputColorSpace),v.push(b.envMapMode),v.push(b.envMapCubeUVHeight),v.push(b.mapUv),v.push(b.alphaMapUv),v.push(b.lightMapUv),v.push(b.aoMapUv),v.push(b.bumpMapUv),v.push(b.normalMapUv),v.push(b.displacementMapUv),v.push(b.emissiveMapUv),v.push(b.metalnessMapUv),v.push(b.roughnessMapUv),v.push(b.anisotropyMapUv),v.push(b.clearcoatMapUv),v.push(b.clearcoatNormalMapUv),v.push(b.clearcoatRoughnessMapUv),v.push(b.iridescenceMapUv),v.push(b.iridescenceThicknessMapUv),v.push(b.sheenColorMapUv),v.push(b.sheenRoughnessMapUv),v.push(b.specularMapUv),v.push(b.specularColorMapUv),v.push(b.specularIntensityMapUv),v.push(b.transmissionMapUv),v.push(b.thicknessMapUv),v.push(b.combine),v.push(b.fogExp2),v.push(b.sizeAttenuation),v.push(b.morphTargetsCount),v.push(b.morphAttributeCount),v.push(b.numSunLights),v.push(b.numDirLights),v.push(b.numPointLights),v.push(b.numSpotLights),v.push(b.numSpotLightMaps),v.push(b.numHemiLights),v.push(b.numRectAreaLights),v.push(b.numSunLightShadows),v.push(b.numDirLightShadows),v.push(b.numPointLightShadows),v.push(b.numSpotLightShadows),v.push(b.numSpotLightShadowsWithMaps),v.push(b.numLightProbes),v.push(b.shadowMapType),v.push(b.toneMapping),v.push(b.numClippingPlanes),v.push(b.numClipIntersection),v.push(b.depthPacking)}function M(v,b){a.disableAll(),b.instancing&&a.enable(0),b.instancingColor&&a.enable(1),b.instancingMorph&&a.enable(2),b.matcap&&a.enable(3),b.envMap&&a.enable(4),b.normalMapObjectSpace&&a.enable(5),b.normalMapTangentSpace&&a.enable(6),b.clearcoat&&a.enable(7),b.iridescence&&a.enable(8),b.alphaTest&&a.enable(9),b.vertexColors&&a.enable(10),b.vertexAlphas&&a.enable(11),b.vertexUv1s&&a.enable(12),b.vertexUv2s&&a.enable(13),b.vertexUv3s&&a.enable(14),b.vertexTangents&&a.enable(15),b.anisotropy&&a.enable(16),b.alphaHash&&a.enable(17),b.batching&&a.enable(18),b.dispersion&&a.enable(19),b.retroreflection&&a.enable(24),b.batchingColor&&a.enable(20),b.gradientMap&&a.enable(21),b.packedNormalMap&&a.enable(22),b.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),b.fog&&a.enable(0),b.useFog&&a.enable(1),b.flatShading&&a.enable(2),b.logarithmicDepthBuffer&&a.enable(3),b.reversedDepthBuffer&&a.enable(4),b.skinning&&a.enable(5),b.morphTargets&&a.enable(6),b.morphNormals&&a.enable(7),b.morphColors&&a.enable(8),b.premultipliedAlpha&&a.enable(9),b.shadowMapEnabled&&a.enable(10),b.doubleSided&&a.enable(11),b.flipSided&&a.enable(12),b.useDepthPacking&&a.enable(13),b.dithering&&a.enable(14),b.transmission&&a.enable(15),b.sheen&&a.enable(16),b.opaque&&a.enable(17),b.pointsUvs&&a.enable(18),b.decodeVideoTexture&&a.enable(19),b.decodeVideoTextureEmissive&&a.enable(20),b.alphaToCoverage&&a.enable(21),b.numLightProbeGrids>0&&a.enable(22),b.hasPositionAttribute&&a.enable(23),v.push(a.mask)}function T(v){const b=d[v.type];let R;if(b){const P=Kn[b];R=i_.clone(P.uniforms)}else R=v.uniforms;return R}function x(v,b){let R=u.get(b);return R!==void 0?++R.usedTimes:(R=new UM(r,b,v,i),c.push(R),u.set(b,R)),R}function y(v){if(--v.usedTimes===0){const b=c.indexOf(v);c[b]=c[c.length-1],c.pop(),u.delete(v.cacheKey),v.destroy()}}function E(v){o.remove(v)}function A(){o.dispose()}return{getParameters:_,getProgramCacheKey:m,getUniforms:T,acquireProgram:x,releaseProgram:y,releaseShaderCache:E,programs:c,dispose:A}}function GM(){let r=new WeakMap;function t(a){return r.has(a)}function e(a){let o=r.get(a);return o===void 0&&(o={},r.set(a,o)),o}function n(a){r.delete(a)}function i(a,o,l){r.get(a)[o]=l}function s(){r=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:s}}function VM(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.material.id!==t.material.id?r.material.id-t.material.id:r.materialVariant!==t.materialVariant?r.materialVariant-t.materialVariant:r.z!==t.z?r.z-t.z:r.id-t.id}function Sh(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.z!==t.z?t.z-r.z:r.id-t.id}function yh(){const r=[];let t=0;const e=[],n=[],i=[];function s(){t=0,e.length=0,n.length=0,i.length=0}function a(h){let d=0;return h.isInstancedMesh&&(d+=2),h.isSkinnedMesh&&(d+=1),d}function o(h,d,g,_,m,p){let M=r[t];return M===void 0?(M={id:h.id,object:h,geometry:d,material:g,materialVariant:a(h),groupOrder:_,renderOrder:h.renderOrder,z:m,group:p},r[t]=M):(M.id=h.id,M.object=h,M.geometry=d,M.material=g,M.materialVariant=a(h),M.groupOrder=_,M.renderOrder=h.renderOrder,M.z=m,M.group=p),t++,M}function l(h,d,g,_,m,p,M){M.reversedDepth===!0&&(m=-m);const T=o(h,d,g,_,m,p);g.transmission>0?n.push(T):g.transparent===!0?i.push(T):e.push(T)}function c(h,d,g,_,m,p){const M=o(h,d,g,_,m,p);g.transmission>0?n.unshift(M):g.transparent===!0?i.unshift(M):e.unshift(M)}function u(h,d){e.length>1&&e.sort(h||VM),n.length>1&&n.sort(d||Sh),i.length>1&&i.sort(d||Sh)}function f(){for(let h=t,d=r.length;h<d;h++){const g=r[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:i,init:s,push:l,unshift:c,finish:f,sort:u}}function HM(){let r=new WeakMap;function t(n,i){const s=r.get(n);let a;return s===void 0?(a=new yh,r.set(n,[a])):i>=s.length?(a=new yh,s.push(a)):a=s[i],a}function e(){r=new WeakMap}return{get:t,dispose:e}}function WM(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new I,color:new Jt};break;case"SpotLight":e={position:new I,direction:new I,color:new Jt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new I,color:new Jt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new I,skyColor:new Jt,groundColor:new Jt};break;case"RectAreaLight":e={color:new Jt,position:new I,halfWidth:new I,halfHeight:new I};break}return r[t.id]=e,e}}}function XM(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ft,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[t.id]=e,e}}}let qM=0;function YM(r,t){return(t.castShadow?2:0)-(r.castShadow?2:0)+(t.map?1:0)-(r.map?1:0)}function ZM(r){const t=new WM,e=XM(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new I);const i=new I,s=new Ae,a=new Ae;function o(c){let u=0,f=0,h=0;for(let N=0;N<9;N++)n.probe[N].set(0,0,0);let d=0,g=0,_=0,m=0,p=0,M=0,T=0,x=0,y=0,E=0,A=0,v=0,b=0,R=0;c.sort(YM);for(let N=0,z=c.length;N<z;N++){const L=c[N],B=L.color,X=L.intensity,G=L.distance;let et=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===lr?et=L.shadow.map.texture:et=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)u+=B.r*X,f+=B.g*X,h+=B.b*X;else if(L.isLightProbe){for(let Y=0;Y<9;Y++)n.probe[Y].addScaledVector(L.sh.coefficients[Y],X);R++}else if(L.isSunLight){const Y=t.get(L);if(Y.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const J=L.shadow,Q=e.get(L);Q.shadowIntensity=J.intensity,Q.shadowBias=J.bias,Q.shadowNormalBias=J.normalBias,Q.shadowRadius=J.radius,Q.shadowMapSize.copy(J.mapSize).multiply(J.getFrameExtents()),n.sunShadow[g]=Q,n.sunShadowMap[g]=et;const bt=J.getViewportCount();for(let xt=0;xt<bt;xt++)n.sunShadowMatrix[_+xt]=J.getMatrix(xt),n.sunShadowCascade[_+xt]=J._cascadeData[xt];_+=bt,g++}n.sun[d]=Y,d++}else if(L.isDirectionalLight){const Y=t.get(L);if(Y.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const J=L.shadow,Q=e.get(L);Q.shadowIntensity=J.intensity,Q.shadowBias=J.bias,Q.shadowNormalBias=J.normalBias,Q.shadowRadius=J.radius,Q.shadowMapSize=J.mapSize,n.directionalShadow[m]=Q,n.directionalShadowMap[m]=et,n.directionalShadowMatrix[m]=L.shadow.matrix,y++}n.directional[m]=Y,m++}else if(L.isSpotLight){const Y=t.get(L);Y.position.setFromMatrixPosition(L.matrixWorld),Y.color.copy(B).multiplyScalar(X),Y.distance=G,Y.coneCos=Math.cos(L.angle),Y.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),Y.decay=L.decay,n.spot[M]=Y;const J=L.shadow;if(L.map&&(n.spotLightMap[v]=L.map,v++,J.updateMatrices(L),L.castShadow&&b++),n.spotLightMatrix[M]=J.matrix,L.castShadow){const Q=e.get(L);Q.shadowIntensity=J.intensity,Q.shadowBias=J.bias,Q.shadowNormalBias=J.normalBias,Q.shadowRadius=J.radius,Q.shadowMapSize=J.mapSize,n.spotShadow[M]=Q,n.spotShadowMap[M]=et,A++}M++}else if(L.isRectAreaLight){const Y=t.get(L);Y.color.copy(B).multiplyScalar(X),Y.halfWidth.set(L.width*.5,0,0),Y.halfHeight.set(0,L.height*.5,0),n.rectArea[T]=Y,T++}else if(L.isPointLight){const Y=t.get(L);if(Y.color.copy(L.color).multiplyScalar(L.intensity),Y.distance=L.distance,Y.decay=L.decay,L.castShadow){const J=L.shadow,Q=e.get(L);Q.shadowIntensity=J.intensity,Q.shadowBias=J.bias,Q.shadowNormalBias=J.normalBias,Q.shadowRadius=J.radius,Q.shadowMapSize=J.mapSize,Q.shadowCameraNear=J.camera.near,Q.shadowCameraFar=J.camera.far,n.pointShadow[p]=Q,n.pointShadowMap[p]=et,n.pointShadowMatrix[p]=L.shadow.matrix,E++}n.point[p]=Y,p++}else if(L.isHemisphereLight){const Y=t.get(L);Y.skyColor.copy(L.color).multiplyScalar(X),Y.groundColor.copy(L.groundColor).multiplyScalar(X),n.hemi[x]=Y,x++}}T>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=vt.LTC_FLOAT_1,n.rectAreaLTC2=vt.LTC_FLOAT_2):(n.rectAreaLTC1=vt.LTC_HALF_1,n.rectAreaLTC2=vt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=h;const P=n.hash;(P.sunLength!==d||P.directionalLength!==m||P.pointLength!==p||P.spotLength!==M||P.rectAreaLength!==T||P.hemiLength!==x||P.numSunShadows!==g||P.numDirectionalShadows!==y||P.numPointShadows!==E||P.numSpotShadows!==A||P.numSpotMaps!==v||P.numLightProbes!==R)&&(n.sun.length=d,n.directional.length=m,n.spot.length=M,n.rectArea.length=T,n.point.length=p,n.hemi.length=x,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=_,n.sunShadowCascade.length=_,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.directionalShadowMatrix.length=y,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=A,n.spotShadowMap.length=A,n.spotLightMatrix.length=A+v-b,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=b,n.numLightProbes=R,P.sunLength=d,P.directionalLength=m,P.pointLength=p,P.spotLength=M,P.rectAreaLength=T,P.hemiLength=x,P.numSunShadows=g,P.numDirectionalShadows=y,P.numPointShadows=E,P.numSpotShadows=A,P.numSpotMaps=v,P.numLightProbes=R,n.version=qM++)}function l(c,u){let f=0,h=0,d=0,g=0,_=0,m=0;const p=u.matrixWorldInverse;for(let M=0,T=c.length;M<T;M++){const x=c[M];if(x.isSunLight){const y=n.sun[f];y.direction.setFromMatrixPosition(x.matrixWorld),y.direction.transformDirection(p),f++}else if(x.isDirectionalLight){const y=n.directional[h];y.direction.setFromMatrixPosition(x.matrixWorld),i.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),h++}else if(x.isSpotLight){const y=n.spot[g];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(x.matrixWorld),i.setFromMatrixPosition(x.target.matrixWorld),y.direction.sub(i),y.direction.transformDirection(p),g++}else if(x.isRectAreaLight){const y=n.rectArea[_];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),a.identity(),s.copy(x.matrixWorld),s.premultiply(p),a.extractRotation(s),y.halfWidth.set(x.width*.5,0,0),y.halfHeight.set(0,x.height*.5,0),y.halfWidth.applyMatrix4(a),y.halfHeight.applyMatrix4(a),_++}else if(x.isPointLight){const y=n.point[d];y.position.setFromMatrixPosition(x.matrixWorld),y.position.applyMatrix4(p),d++}else if(x.isHemisphereLight){const y=n.hemi[m];y.direction.setFromMatrixPosition(x.matrixWorld),y.direction.transformDirection(p),m++}}}return{setup:o,setupView:l,state:n}}function bh(r){const t=new ZM(r),e=[],n=[],i=[];function s(h){f.camera=h,e.length=0,n.length=0,i.length=0}function a(h){e.push(h)}function o(h){n.push(h)}function l(h){i.push(h)}function c(){t.setup(e)}function u(h){t.setupView(e,h)}const f={lightsArray:e,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:c,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function KM(r){let t=new WeakMap;function e(i,s=0){const a=t.get(i);let o;return a===void 0?(o=new bh(r),t.set(i,[o])):s>=a.length?(o=new bh(r),a.push(o)):o=a[s],o}function n(){t=new WeakMap}return{get:e,dispose:n}}const $M=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,JM=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,QM=[new I(1,0,0),new I(-1,0,0),new I(0,1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1)],jM=[new I(0,-1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1),new I(0,-1,0),new I(0,-1,0)],Th=new Ae,us=new I,Go=new I;function tS(r,t,e){let n=new Cc;const i=new ft,s=new ft,a=new Ee,o=new c_,l=new u_,c={},u=e.maxTextureSize,f={[ar]:on,[on]:ar,[Jn]:Jn},h=new Gn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ft},radius:{value:4}},vertexShader:$M,fragmentShader:JM}),d=h.clone();d.defines.HORIZONTAL_PASS=1;const g=new tn;g.setAttribute("position",new mi(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new Ln(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ma;let p=this.type;this.render=function(E,A,v){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||E.length===0)return;this.type===em&&(Wt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ma);const b=r.getRenderTarget(),R=r.getActiveCubeFace(),P=r.getActiveMipmapLevel(),N=r.state;N.setBlending(di),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const z=p!==this.type;z&&A.traverse(function(L){L.material&&(Array.isArray(L.material)?L.material.forEach(B=>B.needsUpdate=!0):L.material.needsUpdate=!0)});for(let L=0,B=E.length;L<B;L++){const X=E[L],G=X.shadow;if(G===void 0){Wt("WebGLShadowMap:",X,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;i.copy(G.mapSize);const et=G.getFrameExtents();i.multiply(et),s.copy(G.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(s.x=Math.floor(u/et.x),i.x=s.x*et.x,G.mapSize.x=s.x),i.y>u&&(s.y=Math.floor(u/et.y),i.y=s.y*et.y,G.mapSize.y=s.y));const Y=r.state.buffers.depth.getReversed();if(G.camera._reversedDepth=Y,G.map===null||z===!0){if(G.map!==null&&(G.map.depthTexture!==null&&(G.map.depthTexture.dispose(),G.map.depthTexture=null),G.map.dispose()),this.type===ps){if(X.isPointLight){Wt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}G.map=new xn(i.x,i.y,{format:lr,type:kn,minFilter:Ze,magFilter:Ze,generateMipmaps:!1}),G.map.texture.name=X.name+".shadowMap",G.map.depthTexture=new $r(i.x,i.y,jn),G.map.depthTexture.name=X.name+".shadowMapDepth",G.map.depthTexture.format=xi,G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=Ne,G.map.depthTexture.magFilter=Ne}else X.isPointLight?(G.map=new md(i.x),G.map.depthTexture=new y0(i.x,zn)):(G.map=new xn(i.x,i.y),G.map.depthTexture=new $r(i.x,i.y,zn)),G.map.depthTexture.name=X.name+".shadowMap",G.map.depthTexture.format=xi,this.type===Ma?(G.map.depthTexture.compareFunction=Y?Tc:bc,G.map.depthTexture.minFilter=Ze,G.map.depthTexture.magFilter=Ze):(G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=Ne,G.map.depthTexture.magFilter=Ne);G.camera.updateProjectionMatrix()}G.map.isWebGLCubeRenderTarget!==!0&&(G.map.width!==i.x||G.map.height!==i.y)&&G.map.setSize(i.x,i.y);const J=G.map.isWebGLCubeRenderTarget?6:G.getViewportCount();X.isPointLight!==!0&&G.updateMatrices(X,v);for(let Q=0;Q<J;Q++){const bt=G.getCamera(Q);if(X.isPointLight){const xt=G.camera,Zt=G.matrix,Ht=X.distance||xt.far;Ht!==xt.far&&(xt.far=Ht,xt.updateProjectionMatrix()),us.setFromMatrixPosition(X.matrixWorld),xt.position.copy(us),Go.copy(xt.position),Go.add(QM[Q]),xt.up.copy(jM[Q]),xt.lookAt(Go),xt.updateMatrixWorld(),Zt.makeTranslation(-us.x,-us.y,-us.z),Th.multiplyMatrices(xt.projectionMatrix,xt.matrixWorldInverse),G._frustum.setFromProjectionMatrix(Th,xt.coordinateSystem,xt.reversedDepth)}if(G.map.isWebGLCubeRenderTarget)r.setRenderTarget(G.map,Q),r.clear();else{Q===0&&(r.setRenderTarget(G.map),r.clear());const xt=G.getViewport(Q);a.set(s.x*xt.x,s.y*xt.y,s.x*xt.z,s.y*xt.w),N.viewport(a)}n=G.getFrustum(Q),x(A,v,bt,X,this.type)}G.isPointLightShadow!==!0&&this.type===ps&&M(G,v),G.needsUpdate=!1}p=this.type,m.needsUpdate=!1,r.setRenderTarget(b,R,P)};function M(E,A){const v=t.update(_);h.defines.VSM_SAMPLES!==E.blurSamples&&(h.defines.VSM_SAMPLES=E.blurSamples,d.defines.VSM_SAMPLES=E.blurSamples,h.needsUpdate=!0,d.needsUpdate=!0),E.mapPass===null?E.mapPass=new xn(i.x,i.y,{format:lr,type:kn}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),h.uniforms.shadow_pass.value=E.map.depthTexture,h.uniforms.resolution.value.set(E.map.width,E.map.height),h.uniforms.radius.value=E.radius,r.setRenderTarget(E.mapPass),r.clear(),r.renderBufferDirect(A,null,v,h,_,null),d.uniforms.shadow_pass.value=E.mapPass.texture,d.uniforms.resolution.value.set(E.map.width,E.map.height),d.uniforms.radius.value=E.radius,r.setRenderTarget(E.map),r.clear(),r.renderBufferDirect(A,null,v,d,_,null)}function T(E,A,v,b){let R=null;const P=v.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(P!==void 0)R=P;else if(R=v.isPointLight===!0?l:o,r.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){const N=R.uuid,z=A.uuid;let L=c[N];L===void 0&&(L={},c[N]=L);let B=L[z];B===void 0&&(B=R.clone(),L[z]=B,A.addEventListener("dispose",y)),R=B}if(R.visible=A.visible,R.wireframe=A.wireframe,b===ps?R.side=A.shadowSide!==null?A.shadowSide:A.side:R.side=A.shadowSide!==null?A.shadowSide:f[A.side],R.alphaMap=A.alphaMap,R.alphaTest=A.alphaToCoverage===!0?.5:A.alphaTest,R.map=A.map,R.clipShadows=A.clipShadows,R.clippingPlanes=A.clippingPlanes,R.clipIntersection=A.clipIntersection,R.displacementMap=A.displacementMap,R.displacementScale=A.displacementScale,R.displacementBias=A.displacementBias,R.wireframeLinewidth=A.wireframeLinewidth,R.linewidth=A.linewidth,v.isPointLight===!0&&R.isMeshDistanceMaterial===!0){const N=r.properties.get(R);N.light=v}return R}function x(E,A,v,b,R){if(E.visible===!1)return;if(E.layers.test(A.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&R===ps)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,E.matrixWorld);const z=t.update(E),L=E.material;if(Array.isArray(L)){const B=z.groups;for(let X=0,G=B.length;X<G;X++){const et=B[X],Y=L[et.materialIndex];if(Y&&Y.visible){const J=T(E,Y,b,R);E.onBeforeShadow(r,E,A,v,z,J,et),r.renderBufferDirect(v,null,z,J,E,et),E.onAfterShadow(r,E,A,v,z,J,et)}}}else if(L.visible){const B=T(E,L,b,R);E.onBeforeShadow(r,E,A,v,z,B,null),r.renderBufferDirect(v,null,z,B,E,null),E.onAfterShadow(r,E,A,v,z,B,null)}}const N=E.children;for(let z=0,L=N.length;z<L;z++)x(N[z],A,v,b,R)}function y(E){E.target.removeEventListener("dispose",y);for(const v in c){const b=c[v],R=E.target.uuid;R in b&&(b[R].dispose(),delete b[R])}}}function eS(r,t){function e(){let F=!1;const _t=new Ee;let tt=null;const gt=new Ee(0,0,0,0);return{setMask:function(yt){tt!==yt&&!F&&(r.colorMask(yt,yt,yt,yt),tt=yt)},setLocked:function(yt){F=yt},setClear:function(yt,at,zt,Dt,ge){ge===!0&&(yt*=Dt,at*=Dt,zt*=Dt),_t.set(yt,at,zt,Dt),gt.equals(_t)===!1&&(r.clearColor(yt,at,zt,Dt),gt.copy(_t))},reset:function(){F=!1,tt=null,gt.set(-1,0,0,0)}}}function n(){let F=!1,_t=!1,tt=null,gt=null,yt=null;return{setReversed:function(at){if(_t!==at){const zt=t.get("EXT_clip_control");at?zt.clipControlEXT(zt.LOWER_LEFT_EXT,zt.ZERO_TO_ONE_EXT):zt.clipControlEXT(zt.LOWER_LEFT_EXT,zt.NEGATIVE_ONE_TO_ONE_EXT),_t=at;const Dt=yt;yt=null,this.setClear(Dt)}},getReversed:function(){return _t},setTest:function(at){at?k(r.DEPTH_TEST):lt(r.DEPTH_TEST)},setMask:function(at){tt!==at&&!F&&(r.depthMask(at),tt=at)},setFunc:function(at){if(_t&&(at=Fm[at]),gt!==at){switch(at){case ll:r.depthFunc(r.NEVER);break;case cl:r.depthFunc(r.ALWAYS);break;case ul:r.depthFunc(r.LESS);break;case Is:r.depthFunc(r.LEQUAL);break;case hl:r.depthFunc(r.EQUAL);break;case fl:r.depthFunc(r.GEQUAL);break;case dl:r.depthFunc(r.GREATER);break;case pl:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}gt=at}},setLocked:function(at){F=at},setClear:function(at){yt!==at&&(yt=at,_t&&(at=1-at),r.clearDepth(at))},reset:function(){F=!1,tt=null,gt=null,yt=null,_t=!1}}}function i(){let F=!1,_t=null,tt=null,gt=null,yt=null,at=null,zt=null,Dt=null,ge=null;return{setTest:function(ue){F||(ue?k(r.STENCIL_TEST):lt(r.STENCIL_TEST))},setMask:function(ue){_t!==ue&&!F&&(r.stencilMask(ue),_t=ue)},setFunc:function(ue,Dn,Vn){(tt!==ue||gt!==Dn||yt!==Vn)&&(r.stencilFunc(ue,Dn,Vn),tt=ue,gt=Dn,yt=Vn)},setOp:function(ue,Dn,Vn){(at!==ue||zt!==Dn||Dt!==Vn)&&(r.stencilOp(ue,Dn,Vn),at=ue,zt=Dn,Dt=Vn)},setLocked:function(ue){F=ue},setClear:function(ue){ge!==ue&&(r.clearStencil(ue),ge=ue)},reset:function(){F=!1,_t=null,tt=null,gt=null,yt=null,at=null,zt=null,Dt=null,ge=null}}}const s=new e,a=new n,o=new i,l=new WeakMap,c=new WeakMap;let u={},f={},h={},d=new WeakMap,g=[],_=null,m=!1,p=null,M=null,T=null,x=null,y=null,E=null,A=null,v=new Jt(0,0,0),b=0,R=!1,P=null,N=null,z=null,L=null,B=null;const X=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let G=!1,et=0;const Y=r.getParameter(r.VERSION);Y.indexOf("WebGL")!==-1?(et=parseFloat(/^WebGL (\d)/.exec(Y)[1]),G=et>=1):Y.indexOf("OpenGL ES")!==-1&&(et=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),G=et>=2);let J=null,Q={};const bt=r.getParameter(r.SCISSOR_BOX),xt=r.getParameter(r.VIEWPORT),Zt=new Ee().fromArray(bt),Ht=new Ee().fromArray(xt);function ie(F,_t,tt,gt){const yt=new Uint8Array(4),at=r.createTexture();r.bindTexture(F,at),r.texParameteri(F,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(F,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let zt=0;zt<tt;zt++)F===r.TEXTURE_3D||F===r.TEXTURE_2D_ARRAY?r.texImage3D(_t,0,r.RGBA,1,1,gt,0,r.RGBA,r.UNSIGNED_BYTE,yt):r.texImage2D(_t+zt,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,yt);return at}const K={};K[r.TEXTURE_2D]=ie(r.TEXTURE_2D,r.TEXTURE_2D,1),K[r.TEXTURE_CUBE_MAP]=ie(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[r.TEXTURE_2D_ARRAY]=ie(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),K[r.TEXTURE_3D]=ie(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),k(r.DEPTH_TEST),a.setFunc(Is),rt(!1),ot(vu),k(r.CULL_FACE),it(di);function k(F){u[F]!==!0&&(r.enable(F),u[F]=!0)}function lt(F){u[F]!==!1&&(r.disable(F),u[F]=!1)}function Lt(F,_t){return h[F]!==_t?(r.bindFramebuffer(F,_t),h[F]=_t,F===r.DRAW_FRAMEBUFFER&&(h[r.FRAMEBUFFER]=_t),F===r.FRAMEBUFFER&&(h[r.DRAW_FRAMEBUFFER]=_t),!0):!1}function mt(F,_t){let tt=g,gt=!1;if(F){tt=d.get(_t),tt===void 0&&(tt=[],d.set(_t,tt));const yt=F.textures;if(tt.length!==yt.length||tt[0]!==r.COLOR_ATTACHMENT0){for(let at=0,zt=yt.length;at<zt;at++)tt[at]=r.COLOR_ATTACHMENT0+at;tt.length=yt.length,gt=!0}}else tt[0]!==r.BACK&&(tt[0]=r.BACK,gt=!0);gt&&r.drawBuffers(tt)}function Ot(F){return _!==F?(r.useProgram(F),_=F,!0):!1}const Kt={[Dr]:r.FUNC_ADD,[im]:r.FUNC_SUBTRACT,[rm]:r.FUNC_REVERSE_SUBTRACT};Kt[sm]=r.MIN,Kt[am]=r.MAX;const j={[om]:r.ZERO,[lm]:r.ONE,[cm]:r.SRC_COLOR,[Cf]:r.SRC_ALPHA,[mm]:r.SRC_ALPHA_SATURATE,[dm]:r.DST_COLOR,[hm]:r.DST_ALPHA,[um]:r.ONE_MINUS_SRC_COLOR,[Pf]:r.ONE_MINUS_SRC_ALPHA,[pm]:r.ONE_MINUS_DST_COLOR,[fm]:r.ONE_MINUS_DST_ALPHA,[_m]:r.CONSTANT_COLOR,[gm]:r.ONE_MINUS_CONSTANT_COLOR,[xm]:r.CONSTANT_ALPHA,[vm]:r.ONE_MINUS_CONSTANT_ALPHA};function it(F,_t,tt,gt,yt,at,zt,Dt,ge,ue){if(F===di){m===!0&&(lt(r.BLEND),m=!1);return}if(m===!1&&(k(r.BLEND),m=!0),F!==nm){if(F!==p||ue!==R){if((M!==Dr||y!==Dr)&&(r.blendEquation(r.FUNC_ADD),M=Dr,y=Dr),ue)switch(F){case Ms:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Mu:r.blendFunc(r.ONE,r.ONE);break;case Su:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case yu:r.blendFuncSeparate(r.DST_COLOR,r.ONE_MINUS_SRC_ALPHA,r.ZERO,r.ONE);break;default:le("WebGLState: Invalid blending: ",F);break}else switch(F){case Ms:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Mu:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE,r.ONE,r.ONE);break;case Su:le("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case yu:le("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:le("WebGLState: Invalid blending: ",F);break}T=null,x=null,E=null,A=null,v.set(0,0,0),b=0,p=F,R=ue}return}yt=yt||_t,at=at||tt,zt=zt||gt,(_t!==M||yt!==y)&&(r.blendEquationSeparate(Kt[_t],Kt[yt]),M=_t,y=yt),(tt!==T||gt!==x||at!==E||zt!==A)&&(r.blendFuncSeparate(j[tt],j[gt],j[at],j[zt]),T=tt,x=gt,E=at,A=zt),(Dt.equals(v)===!1||ge!==b)&&(r.blendColor(Dt.r,Dt.g,Dt.b,ge),v.copy(Dt),b=ge),p=F,R=!1}function st(F,_t){F.side===Jn?lt(r.CULL_FACE):k(r.CULL_FACE);let tt=F.side===on;_t&&(tt=!tt),rt(tt),F.blending===Ms&&F.transparent===!1?it(di):it(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),a.setFunc(F.depthFunc),a.setTest(F.depthTest),a.setMask(F.depthWrite),s.setMask(F.colorWrite);const gt=F.stencilWrite;o.setTest(gt),gt&&(o.setMask(F.stencilWriteMask),o.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),o.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),Tt(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?k(r.SAMPLE_ALPHA_TO_COVERAGE):lt(r.SAMPLE_ALPHA_TO_COVERAGE)}function rt(F){P!==F&&(F?r.frontFace(r.CW):r.frontFace(r.CCW),P=F)}function ot(F){F!==jp?(k(r.CULL_FACE),F!==N&&(F===vu?r.cullFace(r.BACK):F===tm?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):lt(r.CULL_FACE),N=F}function At(F){F!==z&&(G&&r.lineWidth(F),z=F)}function Tt(F,_t,tt){F?(k(r.POLYGON_OFFSET_FILL),(L!==_t||B!==tt)&&(L=_t,B=tt,a.getReversed()&&(_t=-_t),r.polygonOffset(_t,tt))):lt(r.POLYGON_OFFSET_FILL)}function Ft(F){F?k(r.SCISSOR_TEST):lt(r.SCISSOR_TEST)}function Bt(F){F===void 0&&(F=r.TEXTURE0+X-1),J!==F&&(r.activeTexture(F),J=F)}function D(F,_t,tt){tt===void 0&&(J===null?tt=r.TEXTURE0+X-1:tt=J);let gt=Q[tt];gt===void 0&&(gt={type:void 0,texture:void 0},Q[tt]=gt),(gt.type!==F||gt.texture!==_t)&&(J!==tt&&(r.activeTexture(tt),J=tt),r.bindTexture(F,_t||K[F]),gt.type=F,gt.texture=_t)}function Qt(){const F=Q[J];F!==void 0&&F.type!==void 0&&(r.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function Gt(){try{r.compressedTexImage2D(...arguments)}catch(F){le("WebGLState:",F)}}function C(){try{r.compressedTexImage3D(...arguments)}catch(F){le("WebGLState:",F)}}function S(){try{r.texSubImage2D(...arguments)}catch(F){le("WebGLState:",F)}}function O(){try{r.texSubImage3D(...arguments)}catch(F){le("WebGLState:",F)}}function W(){try{r.compressedTexSubImage2D(...arguments)}catch(F){le("WebGLState:",F)}}function Z(){try{r.compressedTexSubImage3D(...arguments)}catch(F){le("WebGLState:",F)}}function ht(){try{r.texStorage2D(...arguments)}catch(F){le("WebGLState:",F)}}function dt(){try{r.texStorage3D(...arguments)}catch(F){le("WebGLState:",F)}}function $(){try{r.texImage2D(...arguments)}catch(F){le("WebGLState:",F)}}function nt(){try{r.texImage3D(...arguments)}catch(F){le("WebGLState:",F)}}function pt(F){return f[F]!==void 0?f[F]:r.getParameter(F)}function It(F,_t){f[F]!==_t&&(r.pixelStorei(F,_t),f[F]=_t)}function ct(F){Zt.equals(F)===!1&&(r.scissor(F.x,F.y,F.z,F.w),Zt.copy(F))}function ut(F){Ht.equals(F)===!1&&(r.viewport(F.x,F.y,F.z,F.w),Ht.copy(F))}function Nt(F,_t){let tt=c.get(_t);tt===void 0&&(tt=new WeakMap,c.set(_t,tt));let gt=tt.get(F);gt===void 0&&(gt=r.getUniformBlockIndex(_t,F.name),tt.set(F,gt))}function kt(F,_t){const gt=c.get(_t).get(F);l.get(_t)!==gt&&(r.uniformBlockBinding(_t,gt,F.__bindingPointIndex),l.set(_t,gt))}function $t(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),a.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),r.pixelStorei(r.PACK_ALIGNMENT,4),r.pixelStorei(r.UNPACK_ALIGNMENT,4),r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!1),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,r.BROWSER_DEFAULT_WEBGL),r.pixelStorei(r.PACK_ROW_LENGTH,0),r.pixelStorei(r.PACK_SKIP_PIXELS,0),r.pixelStorei(r.PACK_SKIP_ROWS,0),r.pixelStorei(r.UNPACK_ROW_LENGTH,0),r.pixelStorei(r.UNPACK_IMAGE_HEIGHT,0),r.pixelStorei(r.UNPACK_SKIP_PIXELS,0),r.pixelStorei(r.UNPACK_SKIP_ROWS,0),r.pixelStorei(r.UNPACK_SKIP_IMAGES,0),u={},f={},J=null,Q={},h={},d=new WeakMap,g=[],_=null,m=!1,p=null,M=null,T=null,x=null,y=null,E=null,A=null,v=new Jt(0,0,0),b=0,R=!1,P=null,N=null,z=null,L=null,B=null,Zt.set(0,0,r.canvas.width,r.canvas.height),Ht.set(0,0,r.canvas.width,r.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:k,disable:lt,bindFramebuffer:Lt,drawBuffers:mt,useProgram:Ot,setBlending:it,setMaterial:st,setFlipSided:rt,setCullFace:ot,setLineWidth:At,setPolygonOffset:Tt,setScissorTest:Ft,activeTexture:Bt,bindTexture:D,unbindTexture:Qt,compressedTexImage2D:Gt,compressedTexImage3D:C,texImage2D:$,texImage3D:nt,pixelStorei:It,getParameter:pt,updateUBOMapping:Nt,uniformBlockBinding:kt,texStorage2D:ht,texStorage3D:dt,texSubImage2D:S,texSubImage3D:O,compressedTexSubImage2D:W,compressedTexSubImage3D:Z,scissor:ct,viewport:ut,reset:$t}}function nS(r,t,e,n,i,s,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ft,u=new WeakMap,f=new Set;let h;const d=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(C,S){return g?new OffscreenCanvas(C,S):za("canvas")}function m(C,S,O){let W=1;const Z=Gt(C);if((Z.width>O||Z.height>O)&&(W=O/Math.max(Z.width,Z.height)),W<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const ht=Math.floor(W*Z.width),dt=Math.floor(W*Z.height);h===void 0&&(h=_(ht,dt));const $=S?_(ht,dt):h;return $.width=ht,$.height=dt,$.getContext("2d").drawImage(C,0,0,ht,dt),Wt("WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+ht+"x"+dt+")."),$}else return"data"in C&&Wt("WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),C;return C}function p(C){return C.generateMipmaps}function M(C){r.generateMipmap(C)}function T(C){return C.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?r.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function x(C,S,O,W,Z,ht=!1){if(C!==null){if(r[C]!==void 0)return r[C];Wt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let dt;W&&(dt=t.get("EXT_texture_norm16"),dt||Wt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=S;if(S===r.RED&&(O===r.FLOAT&&($=r.R32F),O===r.HALF_FLOAT&&($=r.R16F),O===r.UNSIGNED_BYTE&&($=r.R8),O===r.UNSIGNED_SHORT&&dt&&($=dt.R16_EXT),O===r.SHORT&&dt&&($=dt.R16_SNORM_EXT)),S===r.RED_INTEGER&&(O===r.UNSIGNED_BYTE&&($=r.R8UI),O===r.UNSIGNED_SHORT&&($=r.R16UI),O===r.UNSIGNED_INT&&($=r.R32UI),O===r.BYTE&&($=r.R8I),O===r.SHORT&&($=r.R16I),O===r.INT&&($=r.R32I)),S===r.RG&&(O===r.FLOAT&&($=r.RG32F),O===r.HALF_FLOAT&&($=r.RG16F),O===r.UNSIGNED_BYTE&&($=r.RG8),O===r.UNSIGNED_SHORT&&dt&&($=dt.RG16_EXT),O===r.SHORT&&dt&&($=dt.RG16_SNORM_EXT)),S===r.RG_INTEGER&&(O===r.UNSIGNED_BYTE&&($=r.RG8UI),O===r.UNSIGNED_SHORT&&($=r.RG16UI),O===r.UNSIGNED_INT&&($=r.RG32UI),O===r.BYTE&&($=r.RG8I),O===r.SHORT&&($=r.RG16I),O===r.INT&&($=r.RG32I)),S===r.RGB_INTEGER&&(O===r.UNSIGNED_BYTE&&($=r.RGB8UI),O===r.UNSIGNED_SHORT&&($=r.RGB16UI),O===r.UNSIGNED_INT&&($=r.RGB32UI),O===r.BYTE&&($=r.RGB8I),O===r.SHORT&&($=r.RGB16I),O===r.INT&&($=r.RGB32I)),S===r.RGBA_INTEGER&&(O===r.UNSIGNED_BYTE&&($=r.RGBA8UI),O===r.UNSIGNED_SHORT&&($=r.RGBA16UI),O===r.UNSIGNED_INT&&($=r.RGBA32UI),O===r.BYTE&&($=r.RGBA8I),O===r.SHORT&&($=r.RGBA16I),O===r.INT&&($=r.RGBA32I)),S===r.RGB&&(O===r.UNSIGNED_SHORT&&dt&&($=dt.RGB16_EXT),O===r.SHORT&&dt&&($=dt.RGB16_SNORM_EXT),O===r.UNSIGNED_INT_5_9_9_9_REV&&($=r.RGB9_E5),O===r.UNSIGNED_INT_10F_11F_11F_REV&&($=r.R11F_G11F_B10F)),S===r.RGBA){const nt=ht?Ba:re.getTransfer(Z);O===r.FLOAT&&($=r.RGBA32F),O===r.HALF_FLOAT&&($=r.RGBA16F),O===r.UNSIGNED_BYTE&&($=nt===fe?r.SRGB8_ALPHA8:r.RGBA8),O===r.UNSIGNED_SHORT&&dt&&($=dt.RGBA16_EXT),O===r.SHORT&&dt&&($=dt.RGBA16_SNORM_EXT),O===r.UNSIGNED_SHORT_4_4_4_4&&($=r.RGBA4),O===r.UNSIGNED_SHORT_5_5_5_1&&($=r.RGB5_A1)}return($===r.R16F||$===r.R32F||$===r.RG16F||$===r.RG32F||$===r.RGBA16F||$===r.RGBA32F)&&t.get("EXT_color_buffer_float"),$}function y(C,S){let O;return C?S===null||S===zn||S===Us?O=r.DEPTH24_STENCIL8:S===jn?O=r.DEPTH32F_STENCIL8:S===Ns&&(O=r.DEPTH24_STENCIL8,Wt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===zn||S===Us?O=r.DEPTH_COMPONENT24:S===jn?O=r.DEPTH_COMPONENT32F:S===Ns&&(O=r.DEPTH_COMPONENT16),O}function E(C,S){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==Ne&&C.minFilter!==Ze?Math.log2(Math.max(S.width,S.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?S.mipmaps.length:1}function A(C){const S=C.target;S.removeEventListener("dispose",A),b(S),S.isVideoTexture&&u.delete(S),S.isHTMLTexture&&f.delete(S)}function v(C){const S=C.target;S.removeEventListener("dispose",v),P(S)}function b(C){const S=n.get(C);if(S.__webglInit===void 0)return;const O=C.source,W=d.get(O);if(W){const Z=W[S.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&R(C),Object.keys(W).length===0&&d.delete(O)}n.remove(C)}function R(C){const S=n.get(C);r.deleteTexture(S.__webglTexture);const O=C.source,W=d.get(O);delete W[S.__cacheKey],a.memory.textures--}function P(C){const S=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(S.__webglFramebuffer[W]))for(let Z=0;Z<S.__webglFramebuffer[W].length;Z++)r.deleteFramebuffer(S.__webglFramebuffer[W][Z]);else r.deleteFramebuffer(S.__webglFramebuffer[W]);S.__webglDepthbuffer&&r.deleteRenderbuffer(S.__webglDepthbuffer[W])}else{if(Array.isArray(S.__webglFramebuffer))for(let W=0;W<S.__webglFramebuffer.length;W++)r.deleteFramebuffer(S.__webglFramebuffer[W]);else r.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&r.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&r.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let W=0;W<S.__webglColorRenderbuffer.length;W++)S.__webglColorRenderbuffer[W]&&r.deleteRenderbuffer(S.__webglColorRenderbuffer[W]);S.__webglDepthRenderbuffer&&r.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const O=C.textures;for(let W=0,Z=O.length;W<Z;W++){const ht=n.get(O[W]);ht.__webglTexture&&(r.deleteTexture(ht.__webglTexture),a.memory.textures--),n.remove(O[W])}n.remove(C)}let N=0;function z(){N=0}function L(){return N}function B(C){N=C}function X(){const C=N;return C>=i.maxTextures&&Wt("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+i.maxTextures),N+=1,C}function G(C){const S=[];return S.push(C.wrapS),S.push(C.wrapT),S.push(C.wrapR||0),S.push(C.magFilter),S.push(C.minFilter),S.push(C.anisotropy),S.push(C.internalFormat),S.push(C.format),S.push(C.type),S.push(C.generateMipmaps),S.push(C.premultiplyAlpha),S.push(C.flipY),S.push(C.unpackAlignment),S.push(C.colorSpace),S.join()}function et(C,S){const O=n.get(C);if(C.isVideoTexture&&D(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&O.__version!==C.version){const W=C.image;if(W===null)Wt("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Wt("WebGLRenderer: Texture marked for update but image is incomplete");else{lt(O,C,S);return}}else C.isExternalTexture&&(O.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(r.TEXTURE_2D,O.__webglTexture,r.TEXTURE0+S)}function Y(C,S){const O=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&O.__version!==C.version){lt(O,C,S);return}else C.isExternalTexture&&(O.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(r.TEXTURE_2D_ARRAY,O.__webglTexture,r.TEXTURE0+S)}function J(C,S){const O=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&O.__version!==C.version){lt(O,C,S);return}e.bindTexture(r.TEXTURE_3D,O.__webglTexture,r.TEXTURE0+S)}function Q(C,S){const O=n.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&O.__version!==C.version){Lt(O,C,S);return}e.bindTexture(r.TEXTURE_CUBE_MAP,O.__webglTexture,r.TEXTURE0+S)}const bt={[ml]:r.REPEAT,[fi]:r.CLAMP_TO_EDGE,[_l]:r.MIRRORED_REPEAT},xt={[Ne]:r.NEAREST,[ym]:r.NEAREST_MIPMAP_NEAREST,[qs]:r.NEAREST_MIPMAP_LINEAR,[Ze]:r.LINEAR,[co]:r.LINEAR_MIPMAP_NEAREST,[ji]:r.LINEAR_MIPMAP_LINEAR},Zt={[wm]:r.NEVER,[Lm]:r.ALWAYS,[Am]:r.LESS,[bc]:r.LEQUAL,[Rm]:r.EQUAL,[Tc]:r.GEQUAL,[Cm]:r.GREATER,[Pm]:r.NOTEQUAL};function Ht(C,S){if(S.type===jn&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===Ze||S.magFilter===co||S.magFilter===qs||S.magFilter===ji||S.minFilter===Ze||S.minFilter===co||S.minFilter===qs||S.minFilter===ji)&&Wt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(C,r.TEXTURE_WRAP_S,bt[S.wrapS]),r.texParameteri(C,r.TEXTURE_WRAP_T,bt[S.wrapT]),(C===r.TEXTURE_3D||C===r.TEXTURE_2D_ARRAY)&&r.texParameteri(C,r.TEXTURE_WRAP_R,bt[S.wrapR]),r.texParameteri(C,r.TEXTURE_MAG_FILTER,xt[S.magFilter]),r.texParameteri(C,r.TEXTURE_MIN_FILTER,xt[S.minFilter]),S.compareFunction&&(r.texParameteri(C,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(C,r.TEXTURE_COMPARE_FUNC,Zt[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===Ne||S.minFilter!==qs&&S.minFilter!==ji||S.type===jn&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");r.texParameterf(C,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function ie(C,S){let O=!1;C.__webglInit===void 0&&(C.__webglInit=!0,S.addEventListener("dispose",A));const W=S.source;let Z=d.get(W);Z===void 0&&(Z={},d.set(W,Z));const ht=G(S);if(ht!==C.__cacheKey){Z[ht]===void 0&&(Z[ht]={texture:r.createTexture(),usedTimes:0},a.memory.textures++,O=!0),Z[ht].usedTimes++;const dt=Z[C.__cacheKey];dt!==void 0&&(Z[C.__cacheKey].usedTimes--,dt.usedTimes===0&&R(S)),C.__cacheKey=ht,C.__webglTexture=Z[ht].texture}return O}function K(C,S,O){return Math.floor(Math.floor(C/O)/S)}function k(C,S,O,W){const ht=C.updateRanges;if(ht.length===0)e.texSubImage2D(r.TEXTURE_2D,0,0,0,S.width,S.height,O,W,S.data);else{ht.sort((It,ct)=>It.start-ct.start);let dt=0;for(let It=1;It<ht.length;It++){const ct=ht[dt],ut=ht[It],Nt=ct.start+ct.count,kt=K(ut.start,S.width,4),$t=K(ct.start,S.width,4);ut.start<=Nt+1&&kt===$t&&K(ut.start+ut.count-1,S.width,4)===kt?ct.count=Math.max(ct.count,ut.start+ut.count-ct.start):(++dt,ht[dt]=ut)}ht.length=dt+1;const $=e.getParameter(r.UNPACK_ROW_LENGTH),nt=e.getParameter(r.UNPACK_SKIP_PIXELS),pt=e.getParameter(r.UNPACK_SKIP_ROWS);e.pixelStorei(r.UNPACK_ROW_LENGTH,S.width);for(let It=0,ct=ht.length;It<ct;It++){const ut=ht[It],Nt=Math.floor(ut.start/4),kt=Math.ceil(ut.count/4),$t=Nt%S.width,F=Math.floor(Nt/S.width),_t=kt,tt=1;e.pixelStorei(r.UNPACK_SKIP_PIXELS,$t),e.pixelStorei(r.UNPACK_SKIP_ROWS,F),e.texSubImage2D(r.TEXTURE_2D,0,$t,F,_t,tt,O,W,S.data)}C.clearUpdateRanges(),e.pixelStorei(r.UNPACK_ROW_LENGTH,$),e.pixelStorei(r.UNPACK_SKIP_PIXELS,nt),e.pixelStorei(r.UNPACK_SKIP_ROWS,pt)}}function lt(C,S,O){let W=r.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(W=r.TEXTURE_2D_ARRAY),S.isData3DTexture&&(W=r.TEXTURE_3D);const Z=ie(C,S),ht=S.source;e.bindTexture(W,C.__webglTexture,r.TEXTURE0+O);const dt=n.get(ht);if(ht.version!==dt.__version||Z===!0){if(e.activeTexture(r.TEXTURE0+O),(typeof ImageBitmap<"u"&&S.image instanceof ImageBitmap)===!1){const tt=re.getPrimaries(re.workingColorSpace),gt=S.colorSpace===Pi?null:re.getPrimaries(S.colorSpace),yt=S.colorSpace===Pi||tt===gt?r.NONE:r.BROWSER_DEFAULT_WEBGL;e.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,S.flipY),e.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),e.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,yt)}e.pixelStorei(r.UNPACK_ALIGNMENT,S.unpackAlignment);let nt=m(S.image,!1,i.maxTextureSize);nt=Qt(S,nt);const pt=s.convert(S.format,S.colorSpace),It=s.convert(S.type);let ct=x(S.internalFormat,pt,It,S.normalized,S.colorSpace,S.isVideoTexture);Ht(W,S);let ut;const Nt=S.mipmaps,kt=S.isVideoTexture!==!0,$t=dt.__version===void 0||Z===!0,F=ht.dataReady,_t=E(S,nt);if(S.isDepthTexture)ct=y(S.format===tr,S.type),$t&&(kt?e.texStorage2D(r.TEXTURE_2D,1,ct,nt.width,nt.height):e.texImage2D(r.TEXTURE_2D,0,ct,nt.width,nt.height,0,pt,It,null));else if(S.isDataTexture)if(Nt.length>0){kt&&$t&&e.texStorage2D(r.TEXTURE_2D,_t,ct,Nt[0].width,Nt[0].height);for(let tt=0,gt=Nt.length;tt<gt;tt++)ut=Nt[tt],kt?F&&e.texSubImage2D(r.TEXTURE_2D,tt,0,0,ut.width,ut.height,pt,It,ut.data):e.texImage2D(r.TEXTURE_2D,tt,ct,ut.width,ut.height,0,pt,It,ut.data);S.generateMipmaps=!1}else kt?($t&&e.texStorage2D(r.TEXTURE_2D,_t,ct,nt.width,nt.height),F&&k(S,nt,pt,It)):e.texImage2D(r.TEXTURE_2D,0,ct,nt.width,nt.height,0,pt,It,nt.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){kt&&$t&&e.texStorage3D(r.TEXTURE_2D_ARRAY,_t,ct,Nt[0].width,Nt[0].height,nt.depth);for(let tt=0,gt=Nt.length;tt<gt;tt++)if(ut=Nt[tt],S.format!==Cn)if(pt!==null)if(kt){if(F)if(S.layerUpdates.size>0){const yt=nh(ut.width,ut.height,S.format,S.type);for(const at of S.layerUpdates){const zt=ut.data.subarray(at*yt/ut.data.BYTES_PER_ELEMENT,(at+1)*yt/ut.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,tt,0,0,at,ut.width,ut.height,1,pt,zt)}}else e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,tt,0,0,0,ut.width,ut.height,nt.depth,pt,ut.data)}else e.compressedTexImage3D(r.TEXTURE_2D_ARRAY,tt,ct,ut.width,ut.height,nt.depth,0,ut.data,0,0);else Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else kt?F&&e.texSubImage3D(r.TEXTURE_2D_ARRAY,tt,0,0,0,ut.width,ut.height,nt.depth,pt,It,ut.data):e.texImage3D(r.TEXTURE_2D_ARRAY,tt,ct,ut.width,ut.height,nt.depth,0,pt,It,ut.data);S.layerUpdates.size>0&&S.clearLayerUpdates()}else{kt&&$t&&e.texStorage2D(r.TEXTURE_2D,_t,ct,Nt[0].width,Nt[0].height);for(let tt=0,gt=Nt.length;tt<gt;tt++)ut=Nt[tt],S.format!==Cn?pt!==null?kt?F&&e.compressedTexSubImage2D(r.TEXTURE_2D,tt,0,0,ut.width,ut.height,pt,ut.data):e.compressedTexImage2D(r.TEXTURE_2D,tt,ct,ut.width,ut.height,0,ut.data):Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):kt?F&&e.texSubImage2D(r.TEXTURE_2D,tt,0,0,ut.width,ut.height,pt,It,ut.data):e.texImage2D(r.TEXTURE_2D,tt,ct,ut.width,ut.height,0,pt,It,ut.data)}else if(S.isDataArrayTexture)if(kt){if($t&&e.texStorage3D(r.TEXTURE_2D_ARRAY,_t,ct,nt.width,nt.height,nt.depth),F)if(S.layerUpdates.size>0){const tt=nh(nt.width,nt.height,S.format,S.type);for(const gt of S.layerUpdates){const yt=nt.data.subarray(gt*tt/nt.data.BYTES_PER_ELEMENT,(gt+1)*tt/nt.data.BYTES_PER_ELEMENT);e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,gt,nt.width,nt.height,1,pt,It,yt)}S.clearLayerUpdates()}else e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,pt,It,nt.data)}else e.texImage3D(r.TEXTURE_2D_ARRAY,0,ct,nt.width,nt.height,nt.depth,0,pt,It,nt.data);else if(S.isData3DTexture)kt?($t&&e.texStorage3D(r.TEXTURE_3D,_t,ct,nt.width,nt.height,nt.depth),F&&e.texSubImage3D(r.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,pt,It,nt.data)):e.texImage3D(r.TEXTURE_3D,0,ct,nt.width,nt.height,nt.depth,0,pt,It,nt.data);else if(S.isFramebufferTexture){if($t)if(kt)e.texStorage2D(r.TEXTURE_2D,_t,ct,nt.width,nt.height);else{let tt=nt.width,gt=nt.height;for(let yt=0;yt<_t;yt++)e.texImage2D(r.TEXTURE_2D,yt,ct,tt,gt,0,pt,It,null),tt>>=1,gt>>=1}}else if(S.isHTMLTexture){if("texElementImage2D"in r){const tt=r.canvas;if(tt.hasAttribute("layoutsubtree")||tt.setAttribute("layoutsubtree","true"),nt.parentNode!==tt){tt.appendChild(nt),f.add(S),tt.onpaint=gt=>{const yt=gt.changedElements;for(const at of f)yt.includes(at.image)&&(at.needsUpdate=!0)},tt.requestPaint();return}if(r.texElementImage2D.length===3)r.texElementImage2D(r.TEXTURE_2D,r.RGBA8,nt);else{const yt=r.RGBA,at=r.RGBA,zt=r.UNSIGNED_BYTE;r.texElementImage2D(r.TEXTURE_2D,0,yt,at,zt,nt)}r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE)}}else if(Nt.length>0){if(kt&&$t){const tt=Gt(Nt[0]);e.texStorage2D(r.TEXTURE_2D,_t,ct,tt.width,tt.height)}for(let tt=0,gt=Nt.length;tt<gt;tt++)ut=Nt[tt],kt?F&&e.texSubImage2D(r.TEXTURE_2D,tt,0,0,pt,It,ut):e.texImage2D(r.TEXTURE_2D,tt,ct,pt,It,ut);S.generateMipmaps=!1}else if(kt){if($t){const tt=Gt(nt);e.texStorage2D(r.TEXTURE_2D,_t,ct,tt.width,tt.height)}F&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,pt,It,nt)}else e.texImage2D(r.TEXTURE_2D,0,ct,pt,It,nt);p(S)&&M(W),dt.__version=ht.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function Lt(C,S,O){if(S.image.length!==6)return;const W=ie(C,S),Z=S.source;e.bindTexture(r.TEXTURE_CUBE_MAP,C.__webglTexture,r.TEXTURE0+O);const ht=n.get(Z);if(Z.version!==ht.__version||W===!0){e.activeTexture(r.TEXTURE0+O);const dt=re.getPrimaries(re.workingColorSpace),$=S.colorSpace===Pi?null:re.getPrimaries(S.colorSpace),nt=S.colorSpace===Pi||dt===$?r.NONE:r.BROWSER_DEFAULT_WEBGL;e.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,S.flipY),e.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),e.pixelStorei(r.UNPACK_ALIGNMENT,S.unpackAlignment),e.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,nt);const pt=S.isCompressedTexture||S.image[0].isCompressedTexture,It=S.image[0]&&S.image[0].isDataTexture,ct=[];for(let at=0;at<6;at++)!pt&&!It?ct[at]=m(S.image[at],!0,i.maxCubemapSize):ct[at]=It?S.image[at].image:S.image[at],ct[at]=Qt(S,ct[at]);const ut=ct[0],Nt=s.convert(S.format,S.colorSpace),kt=s.convert(S.type),$t=x(S.internalFormat,Nt,kt,S.normalized,S.colorSpace),F=S.isVideoTexture!==!0,_t=ht.__version===void 0||W===!0,tt=Z.dataReady;let gt=E(S,ut);Ht(r.TEXTURE_CUBE_MAP,S);let yt;if(pt){F&&_t&&e.texStorage2D(r.TEXTURE_CUBE_MAP,gt,$t,ut.width,ut.height);for(let at=0;at<6;at++){yt=ct[at].mipmaps;for(let zt=0;zt<yt.length;zt++){const Dt=yt[zt];S.format!==Cn?Nt!==null?F?tt&&e.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt,0,0,Dt.width,Dt.height,Nt,Dt.data):e.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt,$t,Dt.width,Dt.height,0,Dt.data):Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):F?tt&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt,0,0,Dt.width,Dt.height,Nt,kt,Dt.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt,$t,Dt.width,Dt.height,0,Nt,kt,Dt.data)}}}else{if(yt=S.mipmaps,F&&_t){yt.length>0&&gt++;const at=Gt(ct[0]);e.texStorage2D(r.TEXTURE_CUBE_MAP,gt,$t,at.width,at.height)}for(let at=0;at<6;at++)if(It){F?tt&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,ct[at].width,ct[at].height,Nt,kt,ct[at].data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,$t,ct[at].width,ct[at].height,0,Nt,kt,ct[at].data);for(let zt=0;zt<yt.length;zt++){const ge=yt[zt].image[at].image;F?tt&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt+1,0,0,ge.width,ge.height,Nt,kt,ge.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt+1,$t,ge.width,ge.height,0,Nt,kt,ge.data)}}else{F?tt&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,Nt,kt,ct[at]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,$t,Nt,kt,ct[at]);for(let zt=0;zt<yt.length;zt++){const Dt=yt[zt];F?tt&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt+1,0,0,Nt,kt,Dt.image[at]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+at,zt+1,$t,Nt,kt,Dt.image[at])}}}p(S)&&M(r.TEXTURE_CUBE_MAP),ht.__version=Z.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function mt(C,S,O,W,Z,ht){const dt=s.convert(O.format,O.colorSpace),$=s.convert(O.type),nt=x(O.internalFormat,dt,$,O.normalized,O.colorSpace),pt=n.get(S),It=n.get(O);if(It.__renderTarget=S,!pt.__hasExternalTextures){const ct=Math.max(1,S.width>>ht),ut=Math.max(1,S.height>>ht);Z===r.TEXTURE_3D||Z===r.TEXTURE_2D_ARRAY?e.texImage3D(Z,ht,nt,ct,ut,S.depth,0,dt,$,null):e.texImage2D(Z,ht,nt,ct,ut,0,dt,$,null)}e.bindFramebuffer(r.FRAMEBUFFER,C),Bt(S)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,W,Z,It.__webglTexture,0,Ft(S)):(Z===r.TEXTURE_2D||Z>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,W,Z,It.__webglTexture,ht),e.bindFramebuffer(r.FRAMEBUFFER,null)}function Ot(C,S,O){if(r.bindRenderbuffer(r.RENDERBUFFER,C),S.depthBuffer){const W=S.depthTexture,Z=W&&W.isDepthTexture?W.type:null,ht=y(S.stencilBuffer,Z),dt=S.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;Bt(S)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Ft(S),ht,S.width,S.height):O?r.renderbufferStorageMultisample(r.RENDERBUFFER,Ft(S),ht,S.width,S.height):r.renderbufferStorage(r.RENDERBUFFER,ht,S.width,S.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,dt,r.RENDERBUFFER,C)}else{const W=S.textures;for(let Z=0;Z<W.length;Z++){const ht=W[Z],dt=s.convert(ht.format,ht.colorSpace),$=s.convert(ht.type),nt=x(ht.internalFormat,dt,$,ht.normalized,ht.colorSpace);Bt(S)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Ft(S),nt,S.width,S.height):O?r.renderbufferStorageMultisample(r.RENDERBUFFER,Ft(S),nt,S.width,S.height):r.renderbufferStorage(r.RENDERBUFFER,nt,S.width,S.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Kt(C,S,O){const W=S.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(r.FRAMEBUFFER,C),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const Z=n.get(S.depthTexture);if(Z.__renderTarget=S,(!Z.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),W){if(Z.__webglInit===void 0&&(Z.__webglInit=!0,S.depthTexture.addEventListener("dispose",A)),Z.__webglTexture===void 0){Z.__webglTexture=r.createTexture(),e.bindTexture(r.TEXTURE_CUBE_MAP,Z.__webglTexture),Ht(r.TEXTURE_CUBE_MAP,S.depthTexture);const pt=s.convert(S.depthTexture.format),It=s.convert(S.depthTexture.type);let ct;S.depthTexture.format===xi?ct=r.DEPTH_COMPONENT24:S.depthTexture.format===tr&&(ct=r.DEPTH24_STENCIL8);for(let ut=0;ut<6;ut++)r.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,ct,S.width,S.height,0,pt,It,null)}}else et(S.depthTexture,0);const ht=Z.__webglTexture,dt=Ft(S),$=W?r.TEXTURE_CUBE_MAP_POSITIVE_X+O:r.TEXTURE_2D,nt=S.depthTexture.format===tr?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;if(S.depthTexture.format===xi)Bt(S)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,nt,$,ht,0,dt):r.framebufferTexture2D(r.FRAMEBUFFER,nt,$,ht,0);else if(S.depthTexture.format===tr)Bt(S)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,nt,$,ht,0,dt):r.framebufferTexture2D(r.FRAMEBUFFER,nt,$,ht,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function j(C){const S=n.get(C),O=C.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==C.depthTexture){const W=C.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),W){const Z=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,W.removeEventListener("dispose",Z)};W.addEventListener("dispose",Z),S.__depthDisposeCallback=Z}S.__boundDepthTexture=W}if(C.depthTexture&&!S.__autoAllocateDepthBuffer)if(O)for(let W=0;W<6;W++)Kt(S.__webglFramebuffer[W],C,W);else{const W=C.texture.mipmaps;W&&W.length>0?Kt(S.__webglFramebuffer[0],C,0):Kt(S.__webglFramebuffer,C,0)}else if(O){S.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(e.bindFramebuffer(r.FRAMEBUFFER,S.__webglFramebuffer[W]),S.__webglDepthbuffer[W]===void 0)S.__webglDepthbuffer[W]=r.createRenderbuffer(),Ot(S.__webglDepthbuffer[W],C,!1);else{const Z=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ht=S.__webglDepthbuffer[W];r.bindRenderbuffer(r.RENDERBUFFER,ht),r.framebufferRenderbuffer(r.FRAMEBUFFER,Z,r.RENDERBUFFER,ht)}}else{const W=C.texture.mipmaps;if(W&&W.length>0?e.bindFramebuffer(r.FRAMEBUFFER,S.__webglFramebuffer[0]):e.bindFramebuffer(r.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=r.createRenderbuffer(),Ot(S.__webglDepthbuffer,C,!1);else{const Z=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ht=S.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,ht),r.framebufferRenderbuffer(r.FRAMEBUFFER,Z,r.RENDERBUFFER,ht)}}e.bindFramebuffer(r.FRAMEBUFFER,null)}function it(C,S,O){const W=n.get(C);S!==void 0&&mt(W.__webglFramebuffer,C,C.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),O!==void 0&&j(C)}function st(C){const S=C.texture,O=n.get(C),W=n.get(S);C.addEventListener("dispose",v);const Z=C.textures,ht=C.isWebGLCubeRenderTarget===!0,dt=Z.length>1;if(dt||(W.__webglTexture===void 0&&(W.__webglTexture=r.createTexture()),W.__version=S.version,a.memory.textures++),ht){O.__webglFramebuffer=[];for(let $=0;$<6;$++)if(S.mipmaps&&S.mipmaps.length>0){O.__webglFramebuffer[$]=[];for(let nt=0;nt<S.mipmaps.length;nt++)O.__webglFramebuffer[$][nt]=r.createFramebuffer()}else O.__webglFramebuffer[$]=r.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){O.__webglFramebuffer=[];for(let $=0;$<S.mipmaps.length;$++)O.__webglFramebuffer[$]=r.createFramebuffer()}else O.__webglFramebuffer=r.createFramebuffer();if(dt)for(let $=0,nt=Z.length;$<nt;$++){const pt=n.get(Z[$]);pt.__webglTexture===void 0&&(pt.__webglTexture=r.createTexture(),a.memory.textures++)}if(C.samples>0&&Bt(C)===!1){O.__webglMultisampledFramebuffer=r.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(r.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let $=0;$<Z.length;$++){const nt=Z[$];O.__webglColorRenderbuffer[$]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,O.__webglColorRenderbuffer[$]);const pt=s.convert(nt.format,nt.colorSpace),It=s.convert(nt.type),ct=x(nt.internalFormat,pt,It,nt.normalized,nt.colorSpace,C.isXRRenderTarget===!0),ut=Ft(C);r.renderbufferStorageMultisample(r.RENDERBUFFER,ut,ct,C.width,C.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+$,r.RENDERBUFFER,O.__webglColorRenderbuffer[$])}r.bindRenderbuffer(r.RENDERBUFFER,null),C.depthBuffer&&(O.__webglDepthRenderbuffer=r.createRenderbuffer(),Ot(O.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(r.FRAMEBUFFER,null)}}if(ht){e.bindTexture(r.TEXTURE_CUBE_MAP,W.__webglTexture),Ht(r.TEXTURE_CUBE_MAP,S);for(let $=0;$<6;$++)if(S.mipmaps&&S.mipmaps.length>0)for(let nt=0;nt<S.mipmaps.length;nt++)mt(O.__webglFramebuffer[$][nt],C,S,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+$,nt);else mt(O.__webglFramebuffer[$],C,S,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);p(S)&&M(r.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(dt){for(let $=0,nt=Z.length;$<nt;$++){const pt=Z[$],It=n.get(pt);let ct=r.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ct=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture(ct,It.__webglTexture),Ht(ct,pt),mt(O.__webglFramebuffer,C,pt,r.COLOR_ATTACHMENT0+$,ct,0),p(pt)&&M(ct)}e.unbindTexture()}else{let $=r.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&($=C.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture($,W.__webglTexture),Ht($,S),S.mipmaps&&S.mipmaps.length>0)for(let nt=0;nt<S.mipmaps.length;nt++)mt(O.__webglFramebuffer[nt],C,S,r.COLOR_ATTACHMENT0,$,nt);else mt(O.__webglFramebuffer,C,S,r.COLOR_ATTACHMENT0,$,0);p(S)&&M($),e.unbindTexture()}C.depthBuffer&&j(C)}function rt(C){const S=C.textures;for(let O=0,W=S.length;O<W;O++){const Z=S[O];if(p(Z)){const ht=T(C),dt=n.get(Z).__webglTexture;e.bindTexture(ht,dt),M(ht),e.unbindTexture()}}}const ot=[],At=[];function Tt(C){if(C.samples>0){if(Bt(C)===!1){const S=C.textures,O=C.width,W=C.height;let Z=r.COLOR_BUFFER_BIT;const ht=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,dt=n.get(C),$=S.length>1;if($)for(let pt=0;pt<S.length;pt++)e.bindFramebuffer(r.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+pt,r.RENDERBUFFER,null),e.bindFramebuffer(r.FRAMEBUFFER,dt.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+pt,r.TEXTURE_2D,null,0);e.bindFramebuffer(r.READ_FRAMEBUFFER,dt.__webglMultisampledFramebuffer);const nt=C.texture.mipmaps;nt&&nt.length>0?e.bindFramebuffer(r.DRAW_FRAMEBUFFER,dt.__webglFramebuffer[0]):e.bindFramebuffer(r.DRAW_FRAMEBUFFER,dt.__webglFramebuffer);for(let pt=0;pt<S.length;pt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(Z|=r.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(Z|=r.STENCIL_BUFFER_BIT)),$){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,dt.__webglColorRenderbuffer[pt]);const It=n.get(S[pt]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,It,0)}r.blitFramebuffer(0,0,O,W,0,0,O,W,Z,r.NEAREST),l===!0&&(ot.length=0,At.length=0,ot.push(r.COLOR_ATTACHMENT0+pt),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(ot.push(ht),At.push(ht),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,At)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,ot))}if(e.bindFramebuffer(r.READ_FRAMEBUFFER,null),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),$)for(let pt=0;pt<S.length;pt++){e.bindFramebuffer(r.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+pt,r.RENDERBUFFER,dt.__webglColorRenderbuffer[pt]);const It=n.get(S[pt]).__webglTexture;e.bindFramebuffer(r.FRAMEBUFFER,dt.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+pt,r.TEXTURE_2D,It,0)}e.bindFramebuffer(r.DRAW_FRAMEBUFFER,dt.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){const S=C.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[S])}}}function Ft(C){return Math.min(i.maxSamples,C.samples)}function Bt(C){const S=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function D(C){const S=a.render.frame;u.get(C)!==S&&(u.set(C,S),C.update())}function Qt(C,S){const O=C.colorSpace,W=C.format,Z=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||O!==Oa&&O!==Pi&&(re.getTransfer(O)===fe?(W!==Cn||Z!==pn)&&Wt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):le("WebGLTextures: Unsupported texture color space:",O)),S}function Gt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=X,this.resetTextureUnits=z,this.getTextureUnits=L,this.setTextureUnits=B,this.setTexture2D=et,this.setTexture2DArray=Y,this.setTexture3D=J,this.setTextureCube=Q,this.rebindTextures=it,this.setupRenderTarget=st,this.updateRenderTargetMipmap=rt,this.updateMultisampleRenderTarget=Tt,this.setupDepthRenderbuffer=j,this.setupFrameBufferTexture=mt,this.useMultisampledRTT=Bt,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function iS(r,t){function e(n,i=Pi){let s;const a=re.getTransfer(i);if(n===pn)return r.UNSIGNED_BYTE;if(n===xc)return r.UNSIGNED_SHORT_4_4_4_4;if(n===vc)return r.UNSIGNED_SHORT_5_5_5_1;if(n===Vf)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===Hf)return r.UNSIGNED_INT_10F_11F_11F_REV;if(n===kf)return r.BYTE;if(n===Gf)return r.SHORT;if(n===Ns)return r.UNSIGNED_SHORT;if(n===gc)return r.INT;if(n===zn)return r.UNSIGNED_INT;if(n===jn)return r.FLOAT;if(n===kn)return r.HALF_FLOAT;if(n===Wf)return r.ALPHA;if(n===Xf)return r.RGB;if(n===Cn)return r.RGBA;if(n===xi)return r.DEPTH_COMPONENT;if(n===tr)return r.DEPTH_STENCIL;if(n===qf)return r.RED;if(n===Mc)return r.RED_INTEGER;if(n===lr)return r.RG;if(n===Sc)return r.RG_INTEGER;if(n===yc)return r.RGBA_INTEGER;if(n===Sa||n===ya||n===ba||n===Ta)if(a===fe)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===Sa)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ya)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ba)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ta)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===Sa)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ya)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ba)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ta)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===gl||n===xl||n===vl||n===Ml)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===gl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===xl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===vl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ml)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Sl||n===yl||n===bl||n===Tl||n===El||n===Na||n===wl)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Sl||n===yl)return a===fe?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===bl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===Tl)return s.COMPRESSED_R11_EAC;if(n===El)return s.COMPRESSED_SIGNED_R11_EAC;if(n===Na)return s.COMPRESSED_RG11_EAC;if(n===wl)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Al||n===Rl||n===Cl||n===Pl||n===Ll||n===Dl||n===Il||n===Nl||n===Ul||n===Fl||n===Ol||n===Bl||n===zl||n===kl)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Al)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Rl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Cl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Pl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ll)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Dl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Il)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Nl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ul)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Fl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ol)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Bl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===zl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===kl)return a===fe?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Gl||n===Vl||n===Hl)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===Gl)return a===fe?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Vl)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Hl)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Wl||n===Xl||n===Ua||n===ql)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===Wl)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Xl)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ua)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ql)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Us?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:e}}const rS=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,sS=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class aS{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new ed(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Gn({vertexShader:rS,fragmentShader:sS,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ln(new Vs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class oS extends fr{constructor(t,e){super();const n=this;let i=null,s=1,a=null,o="local-floor",l=1,c=null,u=null,f=null,h=null,d=null,g=null;const _=typeof XRWebGLBinding<"u",m=new aS,p={},M=e.getContextAttributes();let T=null,x=null;const y=[],E=[],A=new ft;let v=null,b=null;const R=new wn;R.viewport=new Ee;const P=new wn;P.viewport=new Ee;const N=[R,P],z=new m_;let L=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let k=y[K];return k===void 0&&(k=new go,y[K]=k),k.getTargetRaySpace()},this.getControllerGrip=function(K){let k=y[K];return k===void 0&&(k=new go,y[K]=k),k.getGripSpace()},this.getHand=function(K){let k=y[K];return k===void 0&&(k=new go,y[K]=k),k.getHandSpace()};function X(K){const k=E.indexOf(K.inputSource);if(k===-1)return;const lt=y[k];lt!==void 0&&(lt.update(K.inputSource,K.frame,c||a),lt.dispatchEvent({type:K.type,data:K.inputSource}))}function G(){i.removeEventListener("select",X),i.removeEventListener("selectstart",X),i.removeEventListener("selectend",X),i.removeEventListener("squeeze",X),i.removeEventListener("squeezestart",X),i.removeEventListener("squeezeend",X),i.removeEventListener("end",G),i.removeEventListener("inputsourceschange",et);for(let K=0;K<y.length;K++){const k=E[K];k!==null&&(E[K]=null,y[K].disconnect(k))}L=null,B=null,m.reset();for(const K in p)delete p[K];if(t.setRenderTarget(T),d=null,h=null,f=null,i=null,x=null,ie.stop(),n.isPresenting=!1,t.setPixelRatio(v),t.setSize(A.width,A.height,!1),b!==null){const K=b.camera;K.fov=b.fov,K.zoom=b.zoom,K.updateProjectionMatrix(),b=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){s=K,n.isPresenting===!0&&Wt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,n.isPresenting===!0&&Wt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return h!==null?h:d},this.getBinding=function(){return f===null&&_&&(f=new XRWebGLBinding(i,e)),f},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(K){if(i=K,i!==null){if(T=t.getRenderTarget(),i.addEventListener("select",X),i.addEventListener("selectstart",X),i.addEventListener("selectend",X),i.addEventListener("squeeze",X),i.addEventListener("squeezestart",X),i.addEventListener("squeezeend",X),i.addEventListener("end",G),i.addEventListener("inputsourceschange",et),M.xrCompatible!==!0&&await e.makeXRCompatible(),v=t.getPixelRatio(),t.getSize(A),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let lt=null,Lt=null,mt=null;M.depth&&(mt=M.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,lt=M.stencil?tr:xi,Lt=M.stencil?Us:zn);const Ot={colorFormat:e.RGBA8,depthFormat:mt,scaleFactor:s};f=this.getBinding(),h=f.createProjectionLayer(Ot),i.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),x=new xn(h.textureWidth,h.textureHeight,{format:Cn,type:pn,depthTexture:new $r(h.textureWidth,h.textureHeight,Lt,void 0,void 0,void 0,void 0,void 0,void 0,lt),stencilBuffer:M.stencil,colorSpace:t.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{const lt={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:s};d=new XRWebGLLayer(i,e,lt),i.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),x=new xn(d.framebufferWidth,d.framebufferHeight,{format:Cn,type:pn,colorSpace:t.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),ie.setContext(i),ie.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function et(K){for(let k=0;k<K.removed.length;k++){const lt=K.removed[k],Lt=E.indexOf(lt);Lt>=0&&(E[Lt]=null,y[Lt].disconnect(lt))}for(let k=0;k<K.added.length;k++){const lt=K.added[k];let Lt=E.indexOf(lt);if(Lt===-1){for(let Ot=0;Ot<y.length;Ot++)if(Ot>=E.length){E.push(lt),Lt=Ot;break}else if(E[Ot]===null){E[Ot]=lt,Lt=Ot;break}if(Lt===-1)break}const mt=y[Lt];mt&&mt.connect(lt)}}const Y=new I,J=new I;function Q(K,k,lt){Y.setFromMatrixPosition(k.matrixWorld),J.setFromMatrixPosition(lt.matrixWorld);const Lt=Y.distanceTo(J),mt=k.projectionMatrix.elements,Ot=lt.projectionMatrix.elements,Kt=mt[14]/(mt[10]-1),j=mt[14]/(mt[10]+1),it=(mt[9]+1)/mt[5],st=(mt[9]-1)/mt[5],rt=(mt[8]-1)/mt[0],ot=(Ot[8]+1)/Ot[0],At=Kt*rt,Tt=Kt*ot,Ft=Lt/(-rt+ot),Bt=Ft*-rt;if(k.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Bt),K.translateZ(Ft),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),mt[10]===-1)K.projectionMatrix.copy(k.projectionMatrix),K.projectionMatrixInverse.copy(k.projectionMatrixInverse);else{const D=Kt+Ft,Qt=j+Ft,Gt=At-Bt,C=Tt+(Lt-Bt),S=it*j/Qt*D,O=st*j/Qt*D;K.projectionMatrix.makePerspective(Gt,C,S,O,D,Qt),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function bt(K,k){k===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(k.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(i===null)return;let k=K.near,lt=K.far;m.texture!==null&&(m.depthNear>0&&(k=m.depthNear),m.depthFar>0&&(lt=m.depthFar)),z.near=P.near=R.near=k,z.far=P.far=R.far=lt,(L!==z.near||B!==z.far)&&(i.updateRenderState({depthNear:z.near,depthFar:z.far}),L=z.near,B=z.far),z.layers.mask=K.layers.mask|6,R.layers.mask=z.layers.mask&-5,P.layers.mask=z.layers.mask&-3;const Lt=K.parent,mt=z.cameras;bt(z,Lt);for(let Ot=0;Ot<mt.length;Ot++)bt(mt[Ot],Lt);mt.length===2?Q(z,R,P):z.projectionMatrix.copy(R.projectionMatrix),b===null&&K.isPerspectiveCamera&&(b={camera:K,fov:K.fov,zoom:K.zoom}),xt(K,z,Lt)};function xt(K,k,lt){lt===null?K.matrix.copy(k.matrixWorld):(K.matrix.copy(lt.matrixWorld),K.matrix.invert(),K.matrix.multiply(k.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(k.projectionMatrix),K.projectionMatrixInverse.copy(k.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Os*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return z},this.getFoveation=function(){if(!(h===null&&d===null))return l},this.setFoveation=function(K){l=K,h!==null&&(h.fixedFoveation=K),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=K)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(z)},this.getCameraTexture=function(K){return p[K]};let Zt=null;function Ht(K,k){if(u=k.getViewerPose(c||a),g=k,u!==null){const lt=u.views;d!==null&&(t.setRenderTargetFramebuffer(x,d.framebuffer),t.setRenderTarget(x));let Lt=!1;lt.length!==z.cameras.length&&(z.cameras.length=0,Lt=!0);for(let j=0;j<lt.length;j++){const it=lt[j];let st=null;if(d!==null)st=d.getViewport(it);else{const ot=f.getViewSubImage(h,it);st=ot.viewport,j===0&&(t.setRenderTargetTextures(x,ot.colorTexture,ot.depthStencilTexture),t.setRenderTarget(x))}let rt=N[j];rt===void 0&&(rt=new wn,rt.layers.enable(j),rt.viewport=new Ee,N[j]=rt),rt.matrix.fromArray(it.transform.matrix),rt.matrix.decompose(rt.position,rt.quaternion,rt.scale),rt.projectionMatrix.fromArray(it.projectionMatrix),rt.projectionMatrixInverse.copy(rt.projectionMatrix).invert(),rt.viewport.set(st.x,st.y,st.width,st.height),j===0&&(z.matrix.copy(rt.matrix),z.matrix.decompose(z.position,z.quaternion,z.scale)),Lt===!0&&z.cameras.push(rt)}const mt=i.enabledFeatures;if(mt&&mt.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&_){f=n.getBinding();const j=f.getDepthInformation(lt[0]);j&&j.isValid&&j.texture&&m.init(j,i.renderState)}if(mt&&mt.includes("camera-access")&&_){t.state.unbindTexture(),f=n.getBinding();for(let j=0;j<lt.length;j++){const it=lt[j].camera;if(it){let st=p[it];st||(st=new ed,p[it]=st);const rt=f.getCameraImage(it);st.sourceTexture=rt}}}}for(let lt=0;lt<y.length;lt++){const Lt=E[lt],mt=y[lt];Lt!==null&&mt!==void 0&&mt.update(Lt,k,c||a)}Zt&&Zt(K,k),k.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:k}),g=null}const ie=new dd;ie.setAnimationLoop(Ht),this.setAnimationLoop=function(K){Zt=K},this.dispose=function(){}}}const lS=new Ae,Md=new Yt;Md.set(-1,0,0,0,1,0,0,0,1);function cS(r,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,ud(r)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function i(m,p,M,T,x){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),f(m,p)):p.isMeshPhongMaterial?(s(m,p),u(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),h(m,p),p.isMeshPhysicalMaterial&&d(m,p,x)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),_(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,M,T):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===on&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===on&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const M=t.get(p),T=M.envMap,x=M.envMapRotation;T&&(m.envMap.value=T,m.envMapRotation.value.setFromMatrix4(lS.makeRotationFromEuler(x)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Md),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,M,T){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*M,m.scale.value=T*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function h(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,M){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===on&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){const M=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function uS(r,t,e,n){let i={},s={},a=[];const o=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,y){const E=y.program;n.uniformBlockBinding(x,E)}function c(x,y){let E=i[x.id];E===void 0&&(m(x),E=u(x),i[x.id]=E,x.addEventListener("dispose",M));const A=y.program;n.updateUBOMapping(x,A);const v=t.render.frame;s[x.id]!==v&&(h(x),s[x.id]=v)}function u(x){const y=f();x.__bindingPointIndex=y;const E=r.createBuffer(),A=x.__size,v=x.usage;return r.bindBuffer(r.UNIFORM_BUFFER,E),r.bufferData(r.UNIFORM_BUFFER,A,v),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,y,E),E}function f(){for(let x=0;x<o;x++)if(a.indexOf(x)===-1)return a.push(x),x;return le("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(x){const y=i[x.id],E=x.uniforms,A=x.__cache;r.bindBuffer(r.UNIFORM_BUFFER,y);for(let v=0,b=E.length;v<b;v++){const R=E[v];if(Array.isArray(R))for(let P=0,N=R.length;P<N;P++)d(R[P],v,P,A);else d(R,v,0,A)}r.bindBuffer(r.UNIFORM_BUFFER,null)}function d(x,y,E,A){if(_(x,y,E,A)===!0){const v=x.__offset,b=x.value;if(Array.isArray(b)){let R=0;for(let P=0;P<b.length;P++){const N=b[P],z=p(N);g(N,x.__data,R),typeof N!="number"&&typeof N!="boolean"&&!N.isMatrix3&&!ArrayBuffer.isView(N)&&(R+=z.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(b,x.__data,0);r.bufferSubData(r.UNIFORM_BUFFER,v,x.__data)}}function g(x,y,E){typeof x=="number"||typeof x=="boolean"?y[0]=x:x.isMatrix3?(y[0]=x.elements[0],y[1]=x.elements[1],y[2]=x.elements[2],y[3]=0,y[4]=x.elements[3],y[5]=x.elements[4],y[6]=x.elements[5],y[7]=0,y[8]=x.elements[6],y[9]=x.elements[7],y[10]=x.elements[8],y[11]=0):ArrayBuffer.isView(x)?y.set(new x.constructor(x.buffer,x.byteOffset,y.length)):x.toArray(y,E)}function _(x,y,E,A){const v=x.value,b=y+"_"+E;if(A[b]===void 0)return typeof v=="number"||typeof v=="boolean"?A[b]=v:ArrayBuffer.isView(v)?A[b]=v.slice():A[b]=v.clone(),!0;{const R=A[b];if(typeof v=="number"||typeof v=="boolean"){if(R!==v)return A[b]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(R.equals(v)===!1)return R.copy(v),!0}}return!1}function m(x){const y=x.uniforms;let E=0;const A=16;for(let b=0,R=y.length;b<R;b++){const P=Array.isArray(y[b])?y[b]:[y[b]];for(let N=0,z=P.length;N<z;N++){const L=P[N],B=Array.isArray(L.value)?L.value:[L.value];for(let X=0,G=B.length;X<G;X++){const et=B[X],Y=p(et),J=E%A,Q=J%Y.boundary,bt=J+Q;E+=Q,bt!==0&&A-bt<Y.storage&&(E+=A-bt),L.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=E,E+=Y.storage}}}const v=E%A;return v>0&&(E+=A-v),x.__size=E,x.__cache={},this}function p(x){const y={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(y.boundary=4,y.storage=4):x.isVector2?(y.boundary=8,y.storage=8):x.isVector3||x.isColor?(y.boundary=16,y.storage=12):x.isVector4?(y.boundary=16,y.storage=16):x.isMatrix3?(y.boundary=48,y.storage=48):x.isMatrix4?(y.boundary=64,y.storage=64):x.isTexture?Wt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(y.boundary=16,y.storage=x.byteLength):Wt("WebGLRenderer: Unsupported uniform value type.",x),y}function M(x){const y=x.target;y.removeEventListener("dispose",M);const E=a.indexOf(y.__bindingPointIndex);a.splice(E,1),r.deleteBuffer(i[y.id]),delete i[y.id],delete s[y.id]}function T(){for(const x in i)r.deleteBuffer(i[x]);a=[],i={},s={}}return{bind:l,update:c,dispose:T}}const hS=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Xn=null;function fS(){return Xn===null&&(Xn=new jf(hS,16,16,lr,kn),Xn.name="DFG_LUT",Xn.minFilter=Ze,Xn.magFilter=Ze,Xn.wrapS=fi,Xn.wrapT=fi,Xn.generateMipmaps=!1,Xn.needsUpdate=!0),Xn}class dS{constructor(t={}){const{canvas:e=Nm(),context:n=null,depth:i=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:h=!1,outputBufferType:d=pn}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;const _=d,m=new Set([yc,Sc,Mc]),p=new Set([pn,zn,Ns,Us,xc,vc]),M=new Uint32Array(4),T=new Int32Array(4),x=new I;let y=null,E=null;const A=[],v=[];let b=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ni,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const R=this;let P=!1,N=null,z=null,L=null,B=null;this._outputColorSpace=fn;let X=0,G=0,et=null,Y=-1,J=null;const Q=new Ee,bt=new Ee;let xt=null;const Zt=new Jt(0);let Ht=0,ie=e.width,K=e.height,k=1,lt=null,Lt=null;const mt=new Ee(0,0,ie,K),Ot=new Ee(0,0,ie,K);let Kt=!1;const j=new Cc;let it=!1,st=!1;const rt=new Ae,ot=new I,At=new Ee,Tt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ft=!1;function Bt(){return et===null?k:1}let D=n;function Qt(w,U){return e.getContext(w,U)}let Gt,C,S,O,W,Z,ht,dt,$,nt,pt,It,ct,ut,Nt,kt,$t,F,_t,tt,gt,yt,at;try{const w={alpha:!0,depth:i,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${_c}`),e.addEventListener("webglcontextlost",ge,!1),e.addEventListener("webglcontextrestored",ue,!1),e.addEventListener("webglcontextcreationerror",Dn,!1),D===null){const U="webgl2";if(D=Qt(U,w),D===null)throw Qt(U)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}zt()}catch(w){throw e.removeEventListener("webglcontextlost",ge,!1),e.removeEventListener("webglcontextrestored",ue,!1),e.removeEventListener("webglcontextcreationerror",Dn,!1),le("WebGLRenderer: "+w.message),w}function zt(){Gt=new fv(D),Gt.init(),gt=new iS(D,Gt),C=new nv(D,Gt,t,gt),S=new eS(D,Gt),C.reversedDepthBuffer&&h&&S.buffers.depth.setReversed(!0),z=D.createFramebuffer(),L=D.createFramebuffer(),B=D.createFramebuffer(),O=new mv(D),W=new GM,Z=new nS(D,Gt,S,W,C,gt,O),ht=new hv(R),dt=new g_(D),yt=new tv(D,dt),$=new dv(D,dt,O,yt),nt=new gv(D,$,dt,yt,O),F=new _v(D,C,Z),Nt=new iv(W),pt=new kM(R,ht,Gt,C,yt,Nt),It=new cS(R,W),ct=new HM,ut=new KM(Gt),$t=new jx(R,ht,S,nt,g,l),kt=new tS(R,nt,C),at=new uS(D,O,C,S),_t=new ev(D,Gt,O),tt=new pv(D,Gt,O),O.programs=pt.programs,R.capabilities=C,R.extensions=Gt,R.properties=W,R.renderLists=ct,R.shadowMap=kt,R.state=S,R.info=O}_!==pn&&(b=new vv(_,e.width,e.height,o,i,s));const Dt=new oS(R,D);this.xr=Dt,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const w=Gt.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){const w=Gt.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return k},this.setPixelRatio=function(w){w!==void 0&&(k=w,this.setSize(ie,K,!1))},this.getSize=function(w){return w.set(ie,K)},this.setSize=function(w,U,q=!0){if(Dt.isPresenting){Wt("WebGLRenderer: Can't change size while VR device is presenting.");return}ie=w,K=U,e.width=Math.floor(w*k),e.height=Math.floor(U*k),q===!0&&(e.style.width=w+"px",e.style.height=U+"px"),b!==null&&b.setSize(e.width,e.height),this.setViewport(0,0,w,U)},this.getDrawingBufferSize=function(w){return w.set(ie*k,K*k).floor()},this.setDrawingBufferSize=function(w,U,q){ie=w,K=U,k=q,e.width=Math.floor(w*q),e.height=Math.floor(U*q),this.setViewport(0,0,w,U)},this.setEffects=function(w){if(_===pn){le("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(w){for(let U=0;U<w.length;U++)if(w[U].isOutputPass===!0){Wt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}b.setEffects(w||[])},this.getCurrentViewport=function(w){return w.copy(Q)},this.getViewport=function(w){return w.copy(mt)},this.setViewport=function(w,U,q,V){w.isVector4?mt.set(w.x,w.y,w.z,w.w):mt.set(w,U,q,V),S.viewport(Q.copy(mt).multiplyScalar(k).round())},this.getScissor=function(w){return w.copy(Ot)},this.setScissor=function(w,U,q,V){w.isVector4?Ot.set(w.x,w.y,w.z,w.w):Ot.set(w,U,q,V),S.scissor(bt.copy(Ot).multiplyScalar(k).round())},this.getScissorTest=function(){return Kt},this.setScissorTest=function(w){S.setScissorTest(Kt=w)},this.setOpaqueSort=function(w){lt=w},this.setTransparentSort=function(w){Lt=w},this.getClearColor=function(w){return w.copy($t.getClearColor())},this.setClearColor=function(){$t.setClearColor(...arguments)},this.getClearAlpha=function(){return $t.getClearAlpha()},this.setClearAlpha=function(){$t.setClearAlpha(...arguments)},this.clear=function(w=!0,U=!0,q=!0){let V=0;if(w){let H=!1;if(et!==null){const St=et.texture.format;H=m.has(St)}if(H){const St=et.texture.type,wt=p.has(St),Mt=$t.getClearColor(),Ct=$t.getClearAlpha(),Ut=Mt.r,jt=Mt.g,ne=Mt.b;wt?(M[0]=Ut,M[1]=jt,M[2]=ne,M[3]=Ct,D.clearBufferuiv(D.COLOR,0,M)):(T[0]=Ut,T[1]=jt,T[2]=ne,T[3]=Ct,D.clearBufferiv(D.COLOR,0,T))}else V|=D.COLOR_BUFFER_BIT}U&&(V|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),q&&(V|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),V!==0&&D.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(w){w.setRenderer(this),N=w},this.dispose=function(){e.removeEventListener("webglcontextlost",ge,!1),e.removeEventListener("webglcontextrestored",ue,!1),e.removeEventListener("webglcontextcreationerror",Dn,!1),$t.dispose(),ct.dispose(),ut.dispose(),W.dispose(),ht.dispose(),nt.dispose(),yt.dispose(),at.dispose(),pt.dispose(),Dt.dispose(),Dt.removeEventListener("sessionstart",Xc),Dt.removeEventListener("sessionend",qc),Gi.stop()};function ge(w){w.preventDefault(),Eu("WebGLRenderer: Context Lost."),P=!0}function ue(){Eu("WebGLRenderer: Context Restored."),P=!1;const w=O.autoReset,U=kt.enabled,q=kt.autoUpdate,V=kt.needsUpdate,H=kt.type;zt(),O.autoReset=w,kt.enabled=U,kt.autoUpdate=q,kt.needsUpdate=V,kt.type=H}function Dn(w){le("WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function Vn(w){const U=w.target;U.removeEventListener("dispose",Vn),yd(U)}function yd(w){bd(w),W.remove(w)}function bd(w){const U=W.get(w).programs;U!==void 0&&(U.forEach(function(q){pt.releaseProgram(q)}),w.isShaderMaterial&&pt.releaseShaderCache(w))}this.renderBufferDirect=function(w,U,q,V,H,St){U===null&&(U=Tt);const wt=H.isMesh&&H.matrixWorld.determinantAffine()<0,Mt=wd(w,U,q,V,H);S.setMaterial(V,wt);let Ct=q.index,Ut=1;if(V.wireframe===!0){if(Ct=$.getWireframeAttribute(q),Ct===void 0)return;Ut=2}const jt=q.drawRange,ne=q.attributes.position;let Pt=jt.start*Ut,he=(jt.start+jt.count)*Ut;St!==null&&(Pt=Math.max(Pt,St.start*Ut),he=Math.min(he,(St.start+St.count)*Ut)),Ct!==null?(Pt=Math.max(Pt,0),he=Math.min(he,Ct.count)):ne!=null&&(Pt=Math.max(Pt,0),he=Math.min(he,ne.count));const Le=he-Pt;if(Le<0||Le===1/0)return;yt.setup(H,V,Mt,q,Ct);let Me,pe=_t;if(Ct!==null&&(Me=dt.get(Ct),pe=tt,pe.setIndex(Me)),H.isMesh)V.wireframe===!0?(S.setLineWidth(V.wireframeLinewidth*Bt()),pe.setMode(D.LINES)):pe.setMode(D.TRIANGLES);else if(H.isLine){let We=V.linewidth;We===void 0&&(We=1),S.setLineWidth(We*Bt()),H.isLineSegments?pe.setMode(D.LINES):H.isLineLoop?pe.setMode(D.LINE_LOOP):pe.setMode(D.LINE_STRIP)}else H.isPoints?pe.setMode(D.POINTS):H.isSprite&&pe.setMode(D.TRIANGLES);if(H.isBatchedMesh)if(Gt.get("WEBGL_multi_draw"))pe.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{const We=H._multiDrawStarts,Et=H._multiDrawCounts,$e=H._multiDrawCount,ae=Ct?dt.get(Ct).bytesPerElement:1,Sn=W.get(V).currentProgram.getUniforms();for(let Hn=0;Hn<$e;Hn++)Sn.setValue(D,"_gl_DrawID",Hn),pe.render(We[Hn]/ae,Et[Hn])}else if(H.isInstancedMesh)pe.renderInstances(Pt,Le,H.count);else if(q.isInstancedBufferGeometry){const We=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,Et=Math.min(q.instanceCount,We);pe.renderInstances(Pt,Le,Et)}else pe.render(Pt,Le)};function Wc(w,U,q,V){N!==null&&w.isNodeMaterial&&N.setObject(V,w),it===!0&&Nt.setState(w,q,!1),w.transparent===!0&&w.side===Jn&&w.forceSinglePass===!1?(w.side=on,w.needsUpdate=!0,Ws(w,U,V),w.side=ar,w.needsUpdate=!0,Ws(w,U,V),w.side=Jn):Ws(w,U,V)}this.compile=function(w,U,q=null){q===null&&(q=w),N!==null&&N.renderStart(w,U,q),E=ut.get(q),E.init(U),v.push(E),q.traverseVisible(function(H){H.isLight&&H.layers.test(U.layers)&&(E.pushLight(H),H.castShadow&&E.pushShadow(H))}),w!==q&&w.traverseVisible(function(H){H.isLight&&H.layers.test(U.layers)&&(E.pushLight(H),H.castShadow&&E.pushShadow(H))}),E.setupLights(),N!==null&&N.updateLights(E.state.lightsArray),st=this.localClippingEnabled,it=Nt.init(this.clippingPlanes,st),it===!0&&Nt.setGlobalState(this.clippingPlanes,U),N!==null&&kt.render(E.state.shadowsArray,q,U);const V=new Set;return w.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;const St=H.material;if(St)if(Array.isArray(St))for(let wt=0;wt<St.length;wt++){const Mt=St[wt];Wc(Mt,q,U,H),V.add(Mt)}else Wc(St,q,U,H),V.add(St)}),E=v.pop(),N!==null&&N.renderEnd(),V},this.compileAsync=function(w,U,q=null){const V=this.compile(w,U,q);return new Promise(H=>{function St(){if(V.forEach(function(wt){const Ct=W.get(wt).currentProgram;(Ct===void 0||Ct.isReady())&&V.delete(wt)}),V.size===0){H(w);return}setTimeout(St,10)}Gt.get("KHR_parallel_shader_compile")!==null?St():setTimeout(St,10)})};let Ja=null;function Td(w){Ja&&Ja(w)}function Xc(){Gi.stop()}function qc(){Gi.start()}const Gi=new dd;Gi.setAnimationLoop(Td),typeof self<"u"&&Gi.setContext(self),this.setAnimationLoop=function(w){Ja=w,Dt.setAnimationLoop(w),w===null?Gi.stop():Gi.start()},Dt.addEventListener("sessionstart",Xc),Dt.addEventListener("sessionend",qc),this.render=function(w,U){if(U!==void 0&&U.isCamera!==!0){le("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;N!==null&&N.renderStart(w,U);const q=Dt.enabled===!0&&Dt.isPresenting===!0,V=b!==null&&(et===null||q)&&b.begin(R,et);if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Dt.enabled===!0&&Dt.isPresenting===!0&&(b===null||b.isCompositing()===!1)&&(Dt.cameraAutoUpdate===!0&&Dt.updateCamera(U),U=Dt.getCamera()),w.isScene===!0&&w.onBeforeRender(R,w,U,et),E=ut.get(w,v.length),E.init(U),E.state.textureUnits=Z.getTextureUnits(),v.push(E),rt.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),j.setFromProjectionMatrix(rt,ti,U.reversedDepth),st=this.localClippingEnabled,it=Nt.init(this.clippingPlanes,st),y=ct.get(w,A.length),y.init(),A.push(y),Dt.enabled===!0&&Dt.isPresenting===!0){const wt=R.xr.getDepthSensingMesh();wt!==null&&Qa(wt,U,-1/0,R.sortObjects)}Qa(w,U,0,R.sortObjects),y.finish(),N!==null&&N.updateLights(E.state.lightsArray),R.sortObjects===!0&&y.sort(lt,Lt),Ft=Dt.enabled===!1||Dt.isPresenting===!1||Dt.hasDepthSensing()===!1,Ft&&$t.addToRenderList(y,w),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),it===!0&&Nt.beginShadows();const H=E.state.shadowsArray;if(kt.render(H,w,U),it===!0&&Nt.endShadows(),(V&&b.hasRenderPass())===!1){const wt=y.opaque,Mt=y.transmissive;if(E.setupLights(),U.isArrayCamera){const Ct=U.cameras;if(Mt.length>0)for(let Ut=0,jt=Ct.length;Ut<jt;Ut++){const ne=Ct[Ut];Zc(wt,Mt,w,ne)}Ft&&$t.render(w);for(let Ut=0,jt=Ct.length;Ut<jt;Ut++){const ne=Ct[Ut];Yc(y,w,ne,ne.viewport)}}else Mt.length>0&&Zc(wt,Mt,w,U),Ft&&$t.render(w),Yc(y,w,U)}et!==null&&G===0&&(Z.updateMultisampleRenderTarget(et),Z.updateRenderTargetMipmap(et)),V&&b.end(R),w.isScene===!0&&w.onAfterRender(R,w,U),yt.resetDefaultState(),Y=-1,J=null,v.pop(),v.length>0?(E=v[v.length-1],Z.setTextureUnits(E.state.textureUnits),it===!0&&Nt.setGlobalState(R.clippingPlanes,E.state.camera)):E=null,A.pop(),A.length>0?y=A[A.length-1]:y=null,N!==null&&N.renderEnd()};function Qa(w,U,q,V){if(w.visible===!1)return;if(w.layers.test(U.layers)){if(w.isGroup)q=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(U);else if(w.isLightProbeGrid)E.pushLightProbeGrid(w);else if(w.isLight)E.pushLight(w),w.castShadow&&E.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||w.intersectsFrustum(j)){V&&At.setFromMatrixPosition(w.matrixWorld).applyMatrix4(rt);const wt=nt.update(w),Mt=w.material;Mt.visible&&y.push(w,wt,Mt,q,At.z,null,U)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||w.intersectsFrustum(j))){const wt=nt.update(w),Mt=w.material;if(V&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),At.copy(w.boundingSphere.center)):(wt.boundingSphere===null&&wt.computeBoundingSphere(),At.copy(wt.boundingSphere.center)),At.applyMatrix4(w.matrixWorld).applyMatrix4(rt)),Array.isArray(Mt)){const Ct=wt.groups;for(let Ut=0,jt=Ct.length;Ut<jt;Ut++){const ne=Ct[Ut],Pt=Mt[ne.materialIndex];Pt&&Pt.visible&&y.push(w,wt,Pt,q,At.z,ne,U)}}else Mt.visible&&y.push(w,wt,Mt,q,At.z,null,U)}}const St=w.children;for(let wt=0,Mt=St.length;wt<Mt;wt++)Qa(St[wt],U,q,V)}function Yc(w,U,q,V){const{opaque:H,transmissive:St,transparent:wt}=w;E.setupLightsView(q),it===!0&&Nt.setGlobalState(R.clippingPlanes,q),V&&S.viewport(Q.copy(V)),H.length>0&&Hs(H,U,q),St.length>0&&Hs(St,U,q),wt.length>0&&Hs(wt,U,q),S.buffers.depth.setTest(!0),S.buffers.depth.setMask(!0),S.buffers.color.setMask(!0),S.setPolygonOffset(!1)}function Zc(w,U,q,V){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[V.id]===void 0){const Pt=Gt.has("EXT_color_buffer_half_float")||Gt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[V.id]=new xn(1,1,{generateMipmaps:!0,type:Pt?kn:pn,minFilter:ji,samples:Math.max(4,C.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:re.workingColorSpace})}const St=E.state.transmissionRenderTarget[V.id],wt=V.viewport||Q;St.setSize(wt.z*R.transmissionResolutionScale,wt.w*R.transmissionResolutionScale);const Mt=R.getRenderTarget(),Ct=R.getActiveCubeFace(),Ut=R.getActiveMipmapLevel();R.setRenderTarget(St),R.getClearColor(Zt),Ht=R.getClearAlpha(),Ht<1&&R.setClearColor(16777215,.5),R.clear(),Ft&&$t.render(q);const jt=R.toneMapping;R.toneMapping=ni;const ne=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),E.setupLightsView(V),it===!0&&Nt.setGlobalState(R.clippingPlanes,V),Hs(w,q,V),Z.updateMultisampleRenderTarget(St),Z.updateRenderTargetMipmap(St),Gt.has("WEBGL_multisampled_render_to_texture")===!1){let Pt=!1;for(let he=0,Le=U.length;he<Le;he++){const Me=U[he],{object:pe,geometry:We,material:Et,group:$e}=Me;if(Et.side===Jn&&pe.layers.test(V.layers)){const ae=Et.side;Et.side=on,Et.needsUpdate=!0,Kc(pe,q,V,We,Et,$e),Et.side=ae,Et.needsUpdate=!0,Pt=!0}}Pt===!0&&(Z.updateMultisampleRenderTarget(St),Z.updateRenderTargetMipmap(St))}R.setRenderTarget(Mt,Ct,Ut),R.setClearColor(Zt,Ht),ne!==void 0&&(V.viewport=ne),R.toneMapping=jt}function Hs(w,U,q){const V=U.isScene===!0?U.overrideMaterial:null;for(let H=0,St=w.length;H<St;H++){const wt=w[H],{object:Mt,geometry:Ct,group:Ut}=wt;let jt=wt.material;jt.allowOverride===!0&&V!==null&&(jt=V),Mt.layers.test(q.layers)&&Kc(Mt,U,q,Ct,jt,Ut)}}function Kc(w,U,q,V,H,St){N!==null&&H.isNodeMaterial&&N.setObject(w,H),w.onBeforeRender(R,U,q,V,H,St),w.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),H.onBeforeRender(R,U,q,V,w,St),H.transparent===!0&&H.side===Jn&&H.forceSinglePass===!1?(H.side=on,H.needsUpdate=!0,R.renderBufferDirect(q,U,V,H,w,St),H.side=ar,H.needsUpdate=!0,R.renderBufferDirect(q,U,V,H,w,St),H.side=Jn):R.renderBufferDirect(q,U,V,H,w,St),w.onAfterRender(R,U,q,V,H,St)}function Ws(w,U,q){U.isScene!==!0&&(U=Tt);const V=W.get(w),H=E.state.lights,St=E.state.shadowsArray,wt=H.state.version,Mt=pt.getParameters(w,H.state,St,U,q,E.state.lightProbeGridArray),Ct=pt.getProgramCacheKey(Mt);let Ut=V.programs;V.environment=w.isMeshStandardMaterial||w.isMeshLambertMaterial||w.isMeshPhongMaterial?U.environment:null,V.fog=U.fog;const jt=w.isMeshStandardMaterial||w.isMeshLambertMaterial&&!w.envMap||w.isMeshPhongMaterial&&!w.envMap;V.envMap=ht.get(w.envMap||V.environment,jt),V.envMapRotation=V.environment!==null&&w.envMap===null?U.environmentRotation:w.envMapRotation,Ut===void 0&&(w.addEventListener("dispose",Vn),Ut=new Map,V.programs=Ut);let ne=Ut.get(Ct);if(ne!==void 0){if(V.currentProgram===ne&&V.lightsStateVersion===wt)return Jc(w,Mt),ne}else Mt.uniforms=pt.getUniforms(w),N!==null&&w.isNodeMaterial&&N.build(w,q,Mt),w.onBeforeCompile(Mt,R),ne=pt.acquireProgram(Mt,Ct),Ut.set(Ct,ne),V.uniforms=Mt.uniforms;const Pt=V.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Pt.clippingPlanes=Nt.uniform),Jc(w,Mt),V.needsLights=Rd(w),V.lightsStateVersion=wt,V.needsLights&&(Pt.ambientLightColor.value=H.state.ambient,Pt.lightProbe.value=H.state.probe,Pt.sunLights.value=H.state.sun,Pt.sunLightShadows.value=H.state.sunShadow,Pt.directionalLights.value=H.state.directional,Pt.directionalLightShadows.value=H.state.directionalShadow,Pt.spotLights.value=H.state.spot,Pt.spotLightShadows.value=H.state.spotShadow,Pt.rectAreaLights.value=H.state.rectArea,Pt.ltc_1.value=H.state.rectAreaLTC1,Pt.ltc_2.value=H.state.rectAreaLTC2,Pt.pointLights.value=H.state.point,Pt.pointLightShadows.value=H.state.pointShadow,Pt.hemisphereLights.value=H.state.hemi,Pt.sunShadowMatrix.value=H.state.sunShadowMatrix,Pt.sunShadowCascade.value=H.state.sunShadowCascade,Pt.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Pt.spotLightMatrix.value=H.state.spotLightMatrix,Pt.spotLightMap.value=H.state.spotLightMap,Pt.pointShadowMatrix.value=H.state.pointShadowMatrix),V.lightProbeGrid=E.state.lightProbeGridArray.length>0,V.currentProgram=ne,V.uniformsList=null,ne}function $c(w){if(w.uniformsList===null){const U=w.currentProgram.getUniforms();w.uniformsList=Ea.seqWithValue(U.seq,w.uniforms)}return w.uniformsList}function Jc(w,U){const q=W.get(w);q.outputColorSpace=U.outputColorSpace,q.batching=U.batching,q.batchingColor=U.batchingColor,q.instancing=U.instancing,q.instancingColor=U.instancingColor,q.instancingMorph=U.instancingMorph,q.skinning=U.skinning,q.morphTargets=U.morphTargets,q.morphNormals=U.morphNormals,q.morphColors=U.morphColors,q.morphTargetsCount=U.morphTargetsCount,q.numClippingPlanes=U.numClippingPlanes,q.numIntersection=U.numClipIntersection,q.vertexAlphas=U.vertexAlphas,q.vertexTangents=U.vertexTangents,q.toneMapping=U.toneMapping}function Ed(w,U){if(w.length===0)return null;if(w.length===1)return w[0].texture!==null?w[0]:null;x.setFromMatrixPosition(U.matrixWorld);for(let q=0,V=w.length;q<V;q++){const H=w[q];if(H.texture!==null&&H.boundingBox.containsPoint(x))return H}return null}function wd(w,U,q,V,H){U.isScene!==!0&&(U=Tt),Z.resetTextureUnits();const St=U.fog,wt=V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial?U.environment:null,Mt=et===null?R.outputColorSpace:et.isXRRenderTarget===!0?et.texture.colorSpace:re.workingColorSpace,Ct=V.isMeshStandardMaterial||V.isMeshLambertMaterial&&!V.envMap||V.isMeshPhongMaterial&&!V.envMap,Ut=ht.get(V.envMap||wt,Ct),jt=V.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,ne=!!q.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Pt=!!q.morphAttributes.position,he=!!q.morphAttributes.normal,Le=!!q.morphAttributes.color;let Me=ni;V.toneMapped&&(et===null||et.isXRRenderTarget===!0)&&(Me=R.toneMapping);const pe=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,We=pe!==void 0?pe.length:0,Et=W.get(V),$e=E.state.lights;if(it===!0&&(st===!0||w!==J)){const xe=w===J&&V.id===Y;Nt.setState(V,w,xe)}let ae=!1;V.version===Et.__version?(Et.needsLights&&Et.lightsStateVersion!==$e.state.version||Et.outputColorSpace!==Mt||H.isBatchedMesh&&Et.batching===!1||!H.isBatchedMesh&&Et.batching===!0||H.isBatchedMesh&&Et.batchingColor===!0&&H._colorsTexture===null||H.isBatchedMesh&&Et.batchingColor===!1&&H._colorsTexture!==null||H.isInstancedMesh&&Et.instancing===!1||!H.isInstancedMesh&&Et.instancing===!0||H.isSkinnedMesh&&Et.skinning===!1||!H.isSkinnedMesh&&Et.skinning===!0||H.isInstancedMesh&&Et.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&Et.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&Et.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&Et.instancingMorph===!1&&H.morphTexture!==null||Et.envMap!==Ut||V.fog===!0&&Et.fog!==St||Et.numClippingPlanes!==void 0&&(Et.numClippingPlanes!==Nt.numPlanes||Et.numIntersection!==Nt.numIntersection)||Et.vertexAlphas!==jt||Et.vertexTangents!==ne||Et.morphTargets!==Pt||Et.morphNormals!==he||Et.morphColors!==Le||Et.toneMapping!==Me||Et.morphTargetsCount!==We||!!Et.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(ae=!0):(ae=!0,Et.__version=V.version);let Sn=Et.currentProgram;ae===!0&&(Sn=Ws(V,U,H),N&&V.isNodeMaterial&&N.onUpdateProgram(V,Sn,Et));let Hn=!1,Mi=!1,pr=!1;const de=Sn.getUniforms(),Ce=Et.uniforms;if(S.useProgram(Sn.program)&&(Hn=!0,Mi=!0,pr=!0),V.id!==Y&&(Y=V.id,Mi=!0),Et.needsLights){const xe=Ed(E.state.lightProbeGridArray,H);Et.lightProbeGrid!==xe&&(Et.lightProbeGrid=xe,Mi=!0)}if(Hn||J!==w){S.buffers.depth.getReversed()&&w.reversedDepth!==!0&&(w._reversedDepth=!0,w.updateProjectionMatrix()),de.setValue(D,"projectionMatrix",w.projectionMatrix),de.setValue(D,"viewMatrix",w.matrixWorldInverse);const yi=de.map.cameraPosition;yi!==void 0&&yi.setValue(D,ot.setFromMatrixPosition(w.matrixWorld)),C.logarithmicDepthBuffer&&de.setValue(D,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&de.setValue(D,"isOrthographic",w.isOrthographicCamera===!0),J!==w&&(J=w,Mi=!0,pr=!0)}if(Et.needsLights&&($e.state.sunShadowMap.length>0&&de.setValue(D,"sunShadowMap",$e.state.sunShadowMap,Z),$e.state.directionalShadowMap.length>0&&de.setValue(D,"directionalShadowMap",$e.state.directionalShadowMap,Z),$e.state.spotShadowMap.length>0&&de.setValue(D,"spotShadowMap",$e.state.spotShadowMap,Z),$e.state.pointShadowMap.length>0&&de.setValue(D,"pointShadowMap",$e.state.pointShadowMap,Z)),H.isSkinnedMesh){de.setOptional(D,H,"bindMatrix"),de.setOptional(D,H,"bindMatrixInverse");const xe=H.skeleton;xe&&(xe.boneTexture===null&&xe.computeBoneTexture(),de.setValue(D,"boneTexture",xe.boneTexture,Z))}H.isBatchedMesh&&(de.setOptional(D,H,"batchingTexture"),de.setValue(D,"batchingTexture",H._matricesTexture,Z),de.setOptional(D,H,"batchingIdTexture"),de.setValue(D,"batchingIdTexture",H._indirectTexture,Z),de.setOptional(D,H,"batchingColorTexture"),H._colorsTexture!==null&&de.setValue(D,"batchingColorTexture",H._colorsTexture,Z));const Si=q.morphAttributes;if((Si.position!==void 0||Si.normal!==void 0||Si.color!==void 0)&&F.update(H,q,Sn),(Mi||Et.receiveShadow!==H.receiveShadow)&&(Et.receiveShadow=H.receiveShadow,de.setValue(D,"receiveShadow",H.receiveShadow)),(V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial)&&V.envMap===null&&U.environment!==null&&(Ce.envMapIntensity.value=U.environmentIntensity),Ce.dfgLUT!==void 0&&(Ce.dfgLUT.value=fS()),Mi){if(de.setValue(D,"toneMappingExposure",R.toneMappingExposure),Et.needsLights&&Ad(Ce,pr),St&&V.fog===!0&&It.refreshFogUniforms(Ce,St),It.refreshMaterialUniforms(Ce,V,k,K,E.state.transmissionRenderTarget[w.id]),Et.needsLights&&Et.lightProbeGrid){const xe=Et.lightProbeGrid;Ce.probesSH.value=xe.texture,Ce.probesMin.value.copy(xe.boundingBox.min),Ce.probesMax.value.copy(xe.boundingBox.max),Ce.probesResolution.value.copy(xe.resolution)}Ea.upload(D,$c(Et),Ce,Z)}if(V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Ea.upload(D,$c(Et),Ce,Z),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&de.setValue(D,"center",H.center),de.setValue(D,"modelViewMatrix",H.modelViewMatrix),de.setValue(D,"normalMatrix",H.normalMatrix),de.setValue(D,"modelMatrix",H.matrixWorld),V.uniformsGroups!==void 0){const xe=V.uniformsGroups;for(let yi=0,mr=xe.length;yi<mr;yi++){const jc=xe[yi];at.update(jc,Sn),at.bind(jc,Sn)}}return Sn}function Ad(w,U){w.ambientLightColor.needsUpdate=U,w.lightProbe.needsUpdate=U,w.sunLights.needsUpdate=U,w.sunLightShadows.needsUpdate=U,w.directionalLights.needsUpdate=U,w.directionalLightShadows.needsUpdate=U,w.pointLights.needsUpdate=U,w.pointLightShadows.needsUpdate=U,w.spotLights.needsUpdate=U,w.spotLightShadows.needsUpdate=U,w.rectAreaLights.needsUpdate=U,w.hemisphereLights.needsUpdate=U}function Rd(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return X},this.getActiveMipmapLevel=function(){return G},this.getRenderTarget=function(){return et},this.setRenderTargetTextures=function(w,U,q){const V=W.get(w);V.__autoAllocateDepthBuffer=w.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),W.get(w.texture).__webglTexture=U,W.get(w.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:q,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(w,U){const q=W.get(w);q.__webglFramebuffer=U,q.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(w,U=0,q=0){et=w,X=U,G=q;let V=null,H=!1,St=!1;if(w){const Mt=W.get(w);if(Mt.__useDefaultFramebuffer!==void 0){S.bindFramebuffer(D.FRAMEBUFFER,Mt.__webglFramebuffer),Q.copy(w.viewport),bt.copy(w.scissor),xt=w.scissorTest,S.viewport(Q),S.scissor(bt),S.setScissorTest(xt),Y=-1;return}else if(Mt.__webglFramebuffer===void 0)Z.setupRenderTarget(w);else if(Mt.__hasExternalTextures)Z.rebindTextures(w,W.get(w.texture).__webglTexture,W.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){const jt=w.depthTexture;if(Mt.__boundDepthTexture!==jt){if(jt!==null&&W.has(jt)&&(w.width!==jt.image.width||w.height!==jt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Z.setupDepthRenderbuffer(w)}}const Ct=w.texture;(Ct.isData3DTexture||Ct.isDataArrayTexture||Ct.isCompressedArrayTexture)&&(St=!0);const Ut=W.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Ut[U])?V=Ut[U][q]:V=Ut[U],H=!0):w.samples>0&&Z.useMultisampledRTT(w)===!1?V=W.get(w).__webglMultisampledFramebuffer:Array.isArray(Ut)?V=Ut[q]:V=Ut,Q.copy(w.viewport),bt.copy(w.scissor),xt=w.scissorTest}else Q.copy(mt).multiplyScalar(k).floor(),bt.copy(Ot).multiplyScalar(k).floor(),xt=Kt;if(q!==0&&(V=z),S.bindFramebuffer(D.FRAMEBUFFER,V)&&S.drawBuffers(w,V),S.viewport(Q),S.scissor(bt),S.setScissorTest(xt),H){const Mt=W.get(w.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+U,Mt.__webglTexture,q)}else if(St){const Mt=U;for(let Ct=0;Ct<w.textures.length;Ct++){const Ut=W.get(w.textures[Ct]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Ct,Ut.__webglTexture,q,Mt)}}else if(w!==null&&q!==0){const Mt=W.get(w.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Mt.__webglTexture,q)}Y=-1};function Qc(w){const U=W.get(w);return(U.__readFormat!==w.format||U.__readType!==w.type)&&(U.__readFormat=w.format,U.__readType=w.type,U.__formatReadable=C.textureFormatReadable(w.format),U.__typeReadable=C.textureTypeReadable(w.type)),U}this.readRenderTargetPixels=function(w,U,q,V,H,St,wt,Mt=0){if(!(w&&w.isWebGLRenderTarget)){le("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ct=W.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&wt!==void 0&&(Ct=Ct[wt]),Ct){S.bindFramebuffer(D.FRAMEBUFFER,Ct);try{const Ut=w.textures[Mt],jt=Ut.format,ne=Ut.type;w.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+Mt);const Pt=Qc(Ut);if(Pt.__formatReadable===!1){le("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Pt.__typeReadable===!1){le("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=w.width-V&&q>=0&&q<=w.height-H&&D.readPixels(U,q,V,H,gt.convert(jt),gt.convert(ne),St)}finally{const Ut=et!==null?W.get(et).__webglFramebuffer:null;S.bindFramebuffer(D.FRAMEBUFFER,Ut)}}},this.readRenderTargetPixelsAsync=async function(w,U,q,V,H,St,wt,Mt=0){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ct=W.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&wt!==void 0&&(Ct=Ct[wt]),Ct)if(U>=0&&U<=w.width-V&&q>=0&&q<=w.height-H){S.bindFramebuffer(D.FRAMEBUFFER,Ct);const Ut=w.textures[Mt],jt=Ut.format,ne=Ut.type;w.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+Mt);const Pt=Qc(Ut);if(Pt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Pt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const he=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,he),D.bufferData(D.PIXEL_PACK_BUFFER,St.byteLength,D.STREAM_READ),D.readPixels(U,q,V,H,gt.convert(jt),gt.convert(ne),0),D.bindBuffer(D.PIXEL_PACK_BUFFER,null);const Le=et!==null?W.get(et).__webglFramebuffer:null;S.bindFramebuffer(D.FRAMEBUFFER,Le);const Me=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await Um(D,Me,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,he),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,St),D.bindBuffer(D.PIXEL_PACK_BUFFER,null),D.deleteBuffer(he),D.deleteSync(Me),St}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(w,U=null,q=0){const V=Math.pow(2,-q),H=Math.floor(w.image.width*V),St=Math.floor(w.image.height*V),wt=U!==null?U.x:0,Mt=U!==null?U.y:0;Z.setTexture2D(w,0),D.copyTexSubImage2D(D.TEXTURE_2D,q,0,0,wt,Mt,H,St),S.unbindTexture()},this.copyTextureToTexture=function(w,U,q=null,V=null,H=0,St=0){let wt,Mt,Ct,Ut,jt,ne,Pt,he,Le;const Me=w.isCompressedTexture?w.mipmaps[St]:w.image;if(q!==null)wt=q.max.x-q.min.x,Mt=q.max.y-q.min.y,Ct=q.isBox3?q.max.z-q.min.z:1,Ut=q.min.x,jt=q.min.y,ne=q.isBox3?q.min.z:0;else{const Ce=Math.pow(2,-H);wt=Math.floor(Me.width*Ce),Mt=Math.floor(Me.height*Ce),w.isDataArrayTexture?Ct=Me.depth:w.isData3DTexture?Ct=Math.floor(Me.depth*Ce):Ct=1,Ut=0,jt=0,ne=0}V!==null?(Pt=V.x,he=V.y,Le=V.z):(Pt=0,he=0,Le=0);const pe=gt.convert(U.format),We=gt.convert(U.type);let Et;U.isData3DTexture?(Z.setTexture3D(U,0),Et=D.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(Z.setTexture2DArray(U,0),Et=D.TEXTURE_2D_ARRAY):(Z.setTexture2D(U,0),Et=D.TEXTURE_2D),S.activeTexture(D.TEXTURE0),S.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,U.flipY),S.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),S.pixelStorei(D.UNPACK_ALIGNMENT,U.unpackAlignment);const $e=S.getParameter(D.UNPACK_ROW_LENGTH),ae=S.getParameter(D.UNPACK_IMAGE_HEIGHT),Sn=S.getParameter(D.UNPACK_SKIP_PIXELS),Hn=S.getParameter(D.UNPACK_SKIP_ROWS),Mi=S.getParameter(D.UNPACK_SKIP_IMAGES);S.pixelStorei(D.UNPACK_ROW_LENGTH,Me.width),S.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Me.height),S.pixelStorei(D.UNPACK_SKIP_PIXELS,Ut),S.pixelStorei(D.UNPACK_SKIP_ROWS,jt),S.pixelStorei(D.UNPACK_SKIP_IMAGES,ne);const pr=w.isDataArrayTexture||w.isData3DTexture,de=U.isDataArrayTexture||U.isData3DTexture;if(w.isDepthTexture){const Ce=W.get(w),Si=W.get(U),xe=W.get(Ce.__renderTarget),yi=W.get(Si.__renderTarget);S.bindFramebuffer(D.READ_FRAMEBUFFER,xe.__webglFramebuffer),S.bindFramebuffer(D.DRAW_FRAMEBUFFER,yi.__webglFramebuffer);for(let mr=0;mr<Ct;mr++)pr&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,W.get(w).__webglTexture,H,ne+mr),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,W.get(U).__webglTexture,St,Le+mr)),D.blitFramebuffer(Ut,jt,wt,Mt,Pt,he,wt,Mt,D.DEPTH_BUFFER_BIT,D.NEAREST);S.bindFramebuffer(D.READ_FRAMEBUFFER,null),S.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(H!==0||w.isRenderTargetTexture||W.has(w)){const Ce=W.get(w),Si=W.get(U);S.bindFramebuffer(D.READ_FRAMEBUFFER,L),S.bindFramebuffer(D.DRAW_FRAMEBUFFER,B);for(let xe=0;xe<Ct;xe++)pr?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Ce.__webglTexture,H,ne+xe):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Ce.__webglTexture,H),de?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Si.__webglTexture,St,Le+xe):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Si.__webglTexture,St),H!==0?D.blitFramebuffer(Ut,jt,wt,Mt,Pt,he,wt,Mt,D.COLOR_BUFFER_BIT,D.NEAREST):de?D.copyTexSubImage3D(Et,St,Pt,he,Le+xe,Ut,jt,wt,Mt):D.copyTexSubImage2D(Et,St,Pt,he,Ut,jt,wt,Mt);S.bindFramebuffer(D.READ_FRAMEBUFFER,null),S.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else de?w.isDataTexture||w.isData3DTexture?D.texSubImage3D(Et,St,Pt,he,Le,wt,Mt,Ct,pe,We,Me.data):U.isCompressedArrayTexture?D.compressedTexSubImage3D(Et,St,Pt,he,Le,wt,Mt,Ct,pe,Me.data):D.texSubImage3D(Et,St,Pt,he,Le,wt,Mt,Ct,pe,We,Me):w.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,St,Pt,he,wt,Mt,pe,We,Me.data):w.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,St,Pt,he,Me.width,Me.height,pe,Me.data):D.texSubImage2D(D.TEXTURE_2D,St,Pt,he,wt,Mt,pe,We,Me);S.pixelStorei(D.UNPACK_ROW_LENGTH,$e),S.pixelStorei(D.UNPACK_IMAGE_HEIGHT,ae),S.pixelStorei(D.UNPACK_SKIP_PIXELS,Sn),S.pixelStorei(D.UNPACK_SKIP_ROWS,Hn),S.pixelStorei(D.UNPACK_SKIP_IMAGES,Mi),St===0&&U.generateMipmaps&&D.generateMipmap(Et),S.unbindTexture()},this.initRenderTarget=function(w){W.get(w).__webglFramebuffer===void 0&&Z.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?Z.setTextureCube(w,0):w.isData3DTexture?Z.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?Z.setTexture2DArray(w,0):Z.setTexture2D(w,0),S.unbindTexture()},this.resetState=function(){X=0,G=0,et=null,S.reset(),yt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ti}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=re._getDrawingBufferColorSpace(t),e.unpackColorSpace=re._getUnpackColorSpace()}}const pS=1.5,mS=`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,_S=`
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec2 texel;        // 1 / RT 尺寸
uniform float outerPx;     // 外輪廓半徑（RT 像素）
uniform float innerPx;     // 內線半徑（RT 像素）
uniform vec3 lineColor;
uniform float cameraNear;
uniform float cameraFar;
uniform vec2 rtSize;       // RT 像素尺寸（筆觸雜訊用）
varying vec2 vUv;

// ---- 水墨：值雜訊（筆觸粗幼、飛白、紙紋）----
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float linDepth(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
}
float covered(vec2 uv) { return texture2D(tDepth, uv).x < 0.9999 ? 1.0 : 0.0; }

void main() {
  vec4 col = texture2D(tColor, vUv);
  float here = covered(vUv);

  vec2 px = vUv * rtSize;
  // 外輪廓：毛筆粗幼有起伏（低頻雜訊調半徑），但唔會斷線
  float wobble = 0.72 + 0.56 * vnoise(px / (outerPx * 9.0));
  float r = outerPx * wobble;
  float outer = 0.0;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 0.3926991;
    vec2 d = vec2(cos(a), sin(a));
    outer = max(outer, abs(covered(vUv + d * r * texel) - here));
    outer = max(outer, abs(covered(vUv + d * r * 0.5 * texel) - here));
  }
  // 飛白：拉長嘅高頻雜訊喺筆畫入面挖出紙色細縫（只喺外線）
  float dry = vnoise(vec2(px.x / 2.2, px.y / 7.0) + vec2(px.y / 31.0, 0.0));
  outer *= mix(1.0, smoothstep(0.12, 0.34, dry), 0.85);

  // 內線：只喺主體上計；法線差為主，深度差門檻放寬（斜面唔會冒細碎斜紋）
  float inner = 0.0;
  if (here > 0.5) {
    vec3 n0 = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
    float z0 = linDepth(texture2D(tDepth, vUv).x);
    vec2 offs[4];
    offs[0] = vec2(innerPx, 0.0); offs[1] = vec2(-innerPx, 0.0);
    offs[2] = vec2(0.0, innerPx); offs[3] = vec2(0.0, -innerPx);
    for (int i = 0; i < 4; i++) {
      vec2 uv = vUv + offs[i] * texel;
      if (covered(uv) < 0.5) continue;
      vec3 n = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
      float z = linDepth(texture2D(tDepth, uv).x);
      float nEdge = smoothstep(0.55, 0.35, dot(n0, n));
      float zEdge = smoothstep(0.06, 0.12, abs(z - z0) / max(z0, 0.001));
      inner = max(inner, max(nEdge, zEdge));
    }
  }

  // 內線用淡墨（主體結構線唔搶外輪廓）
  inner *= 0.72;
  float edge = max(outer, inner);
  // 設色：略去飽和、加紙紋（顏料喺宣紙上嘅顆粒感）
  if (col.a > 0.0) {
    vec3 base = col.rgb / col.a;
    float luma = dot(base, vec3(0.299, 0.587, 0.114));
    base = mix(base, vec3(luma), 0.18);
    base *= 0.93 + 0.09 * vnoise(px / 2.5) + 0.04 * vnoise(px / 23.0);
    col.rgb = base * col.a;
  }
  // colorRT 背景透明（rgb＝0），即係預乘；線色疊上去保持預乘
  vec3 rgb = col.rgb * (1.0 - edge) + lineColor * edge;
  float alpha = max(col.a, edge);
  gl_FragColor = vec4(rgb, alpha);
  #include <colorspace_fragment>
}
`;class gS{constructor(t){Vt(this,"renderer");Vt(this,"scene",new Ou);Vt(this,"camera",new wn(32,1,.1,60));Vt(this,"subjectRoot",new Ge);Vt(this,"props",new Ge);Vt(this,"keyLight",new th(16774890,2));Vt(this,"skyLight",new h_(16183264,7037527,1.35));Vt(this,"rimLight",new th(16777215,2.2));Vt(this,"colorRT");Vt(this,"normalRT");Vt(this,"normalMat",new l_);Vt(this,"quadScene",new Ou);Vt(this,"quadCam",new Za(-1,1,1,-1,0,1));Vt(this,"composite");Vt(this,"ss");Vt(this,"width",1);Vt(this,"height",1);this.renderer=new dS({canvas:t.canvas,alpha:!0,antialias:!1,premultipliedAlpha:!0}),this.renderer.setClearColor(0,0),this.renderer.outputColorSpace=fn,this.ss=t.lowPower?1:pS,this.colorRT=new xn(1,1,{samples:4,type:kn}),this.normalRT=new xn(1,1,{samples:0}),this.normalRT.depthTexture=new $r(1,1),this.normalRT.depthTexture.type=zn,this.composite=new Gn({vertexShader:mS,fragmentShader:_S,uniforms:{tColor:{value:this.colorRT.texture},tNormal:{value:this.normalRT.texture},tDepth:{value:this.normalRT.depthTexture},texel:{value:new ft},outerPx:{value:3.2},innerPx:{value:1.2},lineColor:{value:new Jt(wa)},cameraNear:{value:this.camera.near},cameraFar:{value:this.camera.far},rtSize:{value:new ft(1,1)}},transparent:!0,depthTest:!1,depthWrite:!1}),this.quadScene.add(new Ln(new Vs(2,2),this.composite)),this.camera.position.set(0,1.15,9.2),this.camera.lookAt(0,.55,0),this.keyLight.position.set(-3,5,4),this.rimLight.position.set(2.5,2.2,-5),this.scene.add(this.keyLight,this.skyLight,this.rimLight,this.subjectRoot,this.props)}resize(t,e,n){this.width=Math.max(1,Math.round(t*n)),this.height=Math.max(1,Math.round(e*n)),this.renderer.setPixelRatio(1),this.renderer.setSize(this.width,this.height,!1);const i=Math.min(this.ss,2560/Math.max(this.width,this.height)),s=Math.round(this.width*i),a=Math.round(this.height*i);this.colorRT.setSize(s,a),this.normalRT.setSize(s,a),this.composite.uniforms.texel.value.set(1/s,1/a),this.composite.uniforms.rtSize.value.set(s,a);const o=s/this.width;this.composite.uniforms.outerPx.value=2.4*n*o,this.composite.uniforms.innerPx.value=Math.max(1,.9*n*o),this.camera.aspect=t/e,this.camera.fov=t/e<.62?38:32,this.camera.updateProjectionMatrix()}setRimColor(t){this.rimLight.color.set(t)}render(){const t=this.renderer;t.setRenderTarget(this.colorRT),t.clear(),t.render(this.scene,this.camera),this.scene.overrideMaterial=this.normalMat,t.setRenderTarget(this.normalRT),t.clear(),t.render(this.scene,this.camera),this.scene.overrideMaterial=null,t.setRenderTarget(null),t.clear(),t.render(this.quadScene,this.quadCam)}project(t,e,n){const i=t.clone().project(this.camera);return{x:(i.x*.5+.5)*e,y:(-i.y*.5+.5)*n}}dispose(){this.colorRT.dispose(),this.normalRT.dispose(),this.normalMat.dispose(),this.composite.dispose(),this.scene.traverse(t=>{var i;const e=t;(i=e.geometry)==null||i.dispose();const n=e.material;Array.isArray(n)?n.forEach(s=>s.dispose()):n==null||n.dispose()}),this.renderer.dispose()}}const hs=new I;function bn(r,t,e,n,i,s){const a=2*Math.PI*i/4,o=Math.max(s-2*i,0),l=Math.PI/4;hs.copy(t),hs[n]=0,hs.normalize();const c=.5*a/(a+o),u=1-hs.angleTo(r)/l;return Math.sign(hs[e])===1?u*c:o/(a+o)+c+c*(1-u)}class Uc extends vi{constructor(t=1,e=1,n=1,i=2,s=.1){const a=i*2+1;if(s=Math.min(t/2,e/2,n/2,s),super(1,1,1,a,a,a),this.type="RoundedBoxGeometry",this.parameters={width:t,height:e,depth:n,segments:i,radius:s},a===1)return;const o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;const l=new I,c=new I,u=new I(t,e,n).divideScalar(2).subScalar(s),f=this.attributes.position.array,h=this.attributes.normal.array,d=this.attributes.uv.array,g=f.length/6,_=new I,m=.5/a;for(let p=0,M=0;p<f.length;p+=3,M+=2)switch(l.fromArray(f,p),c.copy(l),c.x-=Math.sign(c.x)*m,c.y-=Math.sign(c.y)*m,c.z-=Math.sign(c.z)*m,c.normalize(),f[p+0]=u.x*Math.sign(l.x)+c.x*s,f[p+1]=u.y*Math.sign(l.y)+c.y*s,f[p+2]=u.z*Math.sign(l.z)+c.z*s,h[p+0]=c.x,h[p+1]=c.y,h[p+2]=c.z,Math.floor(p/g)){case 0:_.set(1,0,0),d[M+0]=bn(_,c,"z","y",s,n),d[M+1]=1-bn(_,c,"y","z",s,e);break;case 1:_.set(-1,0,0),d[M+0]=1-bn(_,c,"z","y",s,n),d[M+1]=1-bn(_,c,"y","z",s,e);break;case 2:_.set(0,1,0),d[M+0]=1-bn(_,c,"x","z",s,t),d[M+1]=bn(_,c,"z","x",s,n);break;case 3:_.set(0,-1,0),d[M+0]=1-bn(_,c,"x","z",s,t),d[M+1]=1-bn(_,c,"z","x",s,n);break;case 4:_.set(0,0,1),d[M+0]=1-bn(_,c,"x","y",s,t),d[M+1]=1-bn(_,c,"y","x",s,e);break;case 5:_.set(0,0,-1),d[M+0]=bn(_,c,"x","y",s,t),d[M+1]=1-bn(_,c,"y","x",s,e);break}}static fromJSON(t){return new Uc(t.width,t.height,t.depth,t.segments,t.radius)}}let Ri=null;function xS(){if(Ri)return Ri;const r=[120,175,225,255],t=new Uint8Array(r.length*4);return r.forEach((e,n)=>t.set([e,e,e,255],n*4)),Ri=new jf(t,r.length,1,Cn),Ri.minFilter=Ne,Ri.magFilter=Ne,Ri.generateMipmaps=!1,Ri.needsUpdate=!0,Ri}function Be(r,t={}){return new o_({color:r,gradientMap:xS(),emissive:t.emissive??0,emissiveIntensity:t.emissiveIntensity??0})}const Eh=new Jt("#3A342C");class Fc{constructor(){Vt(this,"mat",new Rc({color:Eh.clone()}));Vt(this,"target",new Jt("#ffffff"));Vt(this,"k",0)}setColor(t){this.target.set(t),this.apply()}set(t){this.k=t,this.apply()}apply(){this.mat.color.copy(Eh).lerp(this.target,Math.min(1,this.k))}}function Xt(r,t,e=0,n=0,i=0){const s=new Ln(r,t);return s.position.set(e,n,i),s}function Fn(r,t,e,n=.025){return new Uc(r,t,e,2,Math.min(n,r/2,t/2,e/2))}function Vo(r,t,e){const n=new Ya,i=-r/2,s=-t/2;return n.moveTo(i+e,s),n.lineTo(i+r-e,s),n.quadraticCurveTo(i+r,s,i+r,s+e),n.lineTo(i+r,s+t-e),n.quadraticCurveTo(i+r,s+t,i+r-e,s+t),n.lineTo(i+e,s+t),n.quadraticCurveTo(i,s+t,i,s+t-e),n.lineTo(i,s+e),n.quadraticCurveTo(i,s,i+e,s),n}function Oc(r,t){const e=new Nc(r,0);return e.scale(1,1.25,.55),e.computeVertexNormals(),new Ln(e,t)}function vS(){const r=new Ge,t=2.2,e=1.45,n=1.05,i=.12,s=.038,a=[Be("#A88660"),Be("#9A7853"),Be("#B4936C")],o=Be("#C9CCD6"),l=Be("#E9ECF4"),c=Be("#FFFFFF"),u=Be("#1C1A17"),f=new Fc,h=new Ge;r.add(h),h.add(Xt(Fn(t,i,e),a[1],0,i/2,0));const d=(n-i-s*3)/3;for(let b=0;b<3;b++){const R=i+s+b*(d+s)+d/2;for(const P of[e/2-i/2,-e/2+i/2])h.add(Xt(Fn(t,d,i),a[(b+(P>0?0:1))%3],0,R,P));for(const P of[t/2-i/2,-t/2+i/2])h.add(Xt(Fn(i,d,e-i*2),a[(b+2)%3],P,R,0))}h.add(Xt(new vi(t-i*2-.02,n-i-.06,e-i*2-.02),f.mat,0,i+(n-i)/2,0));const g=[-t*.29,t*.29];for(const b of g)for(const R of[1,-1]){h.add(Xt(Fn(.17,n+.02,.04,.012),o,b,n/2,R*(e/2+.02)));for(let P=0;P<3;P++){const N=Xt(new ei(.035,12,8),l,b,.2+P*.32,R*(e/2+.045));h.add(N)}}for(const b of[1,-1])for(const R of[1,-1]){h.add(Xt(Fn(.2,n+.03,.035,.01),o,b*(t/2-.1+.012),n/2,R*(e/2+.017))),h.add(Xt(Fn(.035,n+.03,.2,.01),o,b*(t/2+.017),n/2,R*(e/2-.1+.012)));for(const P of[.14,n-.12])h.add(Xt(new ei(.03,10,8),l,b*(t/2-.06),P,R*(e/2+.04)))}h.add(Xt(Fn(t+.05,.07,.05,.015),o,0,n-.035,e/2+.02)),h.add(Xt(Fn(t+.05,.07,.05,.015),o,0,n-.035,-e/2-.02)),h.add(Xt(Fn(.4,.44,.07,.03),o,0,n-.3,e/2+.05));const _=new Ge;_.add(Xt(new Pn(.045,.045,.02,16),u,0,.03,0)),_.add(Xt(new vi(.04,.02,.1),u,0,.03,-.05)),_.rotation.x=Math.PI/2,_.position.set(0,n-.34,e/2+.06),h.add(_);const m=Oc(.06,c);m.position.set(0,n-.18,e/2+.1),h.add(m);const p=new Ge;p.position.set(0,n,-e/2),r.add(p);const M=e/2,T=5,x=s/M,y=(Math.PI-x*(T-1))/T;for(let b=0;b<T;b++){const R=b*(y+x)+y/2,P=2*(M-i/2)*Math.sin(y/2),N=Xt(Fn(t-.02,i,P+.005),a[b%3]);N.position.set(0,Math.sin(R)*(M-i/2),M+Math.cos(R)*(M-i/2)),N.rotation.x=Math.PI/2-R,p.add(N)}const E=new Ya;E.absarc(0,0,M,0,Math.PI,!1),E.lineTo(M,0);const A=new Hr(E,{depth:i,bevelEnabled:!0,bevelSize:.015,bevelThickness:.015,bevelSegments:2,curveSegments:24});for(const b of[1,-1]){const R=Xt(A,a[2]);R.rotation.y=-Math.PI/2,R.position.set(b>0?t/2:-t/2+i,0,M),p.add(R)}const v=Xt(new Pn(M-i-.01,M-i-.01,t-i*2,20,1,!1,0,Math.PI),f.mat);v.rotation.z=Math.PI/2,v.position.set(0,0,M),p.add(v);for(const b of g){const R=Xt(new Bn(M+.012,.04,8,28,Math.PI),o);R.rotation.y=Math.PI/2,R.position.set(b,0,M),p.add(R);for(const P of[.5,1.57,2.64])p.add(Xt(new ei(.035,12,8),l,b,Math.sin(P)*(M+.05),M+Math.cos(P)*(M+.05)))}p.add(Xt(Fn(.22,.26,.05,.02),o,0,-.06,M*2+.06));for(const b of g){const R=Xt(new Pn(.06,.06,.24,16),o,b,0,-.04);R.rotation.z=Math.PI/2,p.add(R)}return r.position.y=0,{root:r,burstPoint:new I(0,n+.2,.1),height:n+M,setGrade(b){o.color.set(b.main),l.color.set(b.main).lerp(new Jt("#F3EBDC"),.45),c.color.set(b.glow),f.setColor(b.glow)},setGlow(b){f.set(b)},setOpen(b){p.rotation.x=-1.95*b}}}function MS(){const r=new Ya;return r.moveTo(0,.62),r.lineTo(.07,.48),r.lineTo(.07,-.18),r.lineTo(.24,-.2),r.lineTo(.24,-.27),r.lineTo(.05,-.27),r.lineTo(.05,-.5),r.lineTo(.09,-.56),r.lineTo(0,-.64),r.lineTo(-.09,-.56),r.lineTo(-.05,-.5),r.lineTo(-.05,-.27),r.lineTo(-.24,-.27),r.lineTo(-.24,-.2),r.lineTo(-.07,-.18),r.lineTo(-.07,.48),r.lineTo(0,.62),r}function SS(){const r=new Ge,t=new Ge;r.add(t);const e=Be("#C9CCD6"),n=Be("#E4E8D6"),i=Be("#7A8B99"),s=Be("#FFFFFF"),a=Be("#A33A32"),o=new Fc,l=1.15,c=1.5,u=2.05,f=.26,h=Vo(c,u,.3);h.holes.push(Vo(c-.34,u-.34,.16));const d=new Hr(h,{depth:f,bevelEnabled:!0,bevelSize:.05,bevelThickness:.05,bevelSegments:3,curveSegments:16});d.translate(0,0,-f/2),t.add(Xt(d,e,0,l,0)),t.add(Xt(new vi(c-.36,u-.36,f*.5),o.mat,0,l,0));const g=new Hr(Vo(c-.44,u-.44,.12),{depth:.05,bevelEnabled:!0,bevelSize:.02,bevelThickness:.02,bevelSegments:2});for(const x of[1,-1]){const y=Xt(g,n,0,l,x*(f/2-.02));x<0&&(y.rotation.y=Math.PI),t.add(y)}const _=Xt(new Hr(MS(),{depth:.05,bevelEnabled:!0,bevelSize:.012,bevelThickness:.012,bevelSegments:1}),i,0,l,f/2+.03);t.add(_);const m=new Bn(.34,.05,10,32),p=Xt(m,i,0,l,-f/2-.05);t.add(p),t.add(Xt(new Pn(.1,.1,.06,20),i,0,l,-f/2-.05).rotateX(Math.PI/2));const M=c/2-.17,T=u/2-.17;for(const x of[1,-1])for(const y of[1,-1])for(const E of[1,-1]){const A=Oc(.075,s);A.position.set(y*M,l+E*T,x*(f/2+.07)),A.rotation.z=Math.PI/4,t.add(A)}return t.add(Xt(new Bn(.17,.055,10,24),e,0,l+u/2+.18,0)),t.add(Xt(new Pn(.025,.025,.28,8),a,0,l-u/2-.14,0)),t.add(Xt(new ei(.07,12,10),a,0,l-u/2-.3,0)),t.add(Xt(new Pc(.11,.34,12),a,0,l-u/2-.5,0).rotateX(Math.PI)),{root:r,burstPoint:new I(0,l,.2),height:l+u/2+.3,setGrade(x){e.color.set(x.main),i.color.set(x.main).lerp(new Jt("#1C1A17"),.35),s.color.set(x.glow),o.setColor(x.glow)},setGlow(x){o.set(x)},setOpen(x){t.rotation.y=x*Math.PI*4}}}function yS(){const r=new Ge,t=Be("#C9CCD6"),e=Be("#9AA0B4"),n=Be("#EEF0F6"),i=Be("#FFFFFF"),s=new Fc,a=.42,o=[[.35,0],[.72,.08],[.98,.3],[1.08,.58],[1.04,.86],[.9,1.06],[.86,1.12],[.94,1.18]],l=[[.86,1.18],[.8,1.1],[.94,.86],[.98,.58],[.88,.32],[.64,.14],[.3,.08]],c=[...o,...l].map(([T,x])=>new ft(T,x)),u=6,f=.045,h=Math.PI*2/u-f,d=new Ge;d.position.y=a,r.add(d);for(let T=0;T<u;T++){const x=new ka(c,10,T*(h+f),h),y=Xt(x,t);y.material.side=Jn,d.add(y)}d.add(Xt(new ei(.86,24,16),s.mat,0,.62,0)),d.add(Xt(new Bn(1.085,.055,10,48),e,0,.6,0).rotateX(Math.PI/2)),d.add(Xt(new Bn(.94,.06,10,48),e,0,1.18,0).rotateX(Math.PI/2)),d.add(Xt(new Bn(.72,.045,8,40),e,0,.1,0).rotateX(Math.PI/2));for(let T=0;T<12;T++){const x=T/12*Math.PI*2;d.add(Xt(new ei(.05,10,8),n,Math.cos(x)*1.12,.6,Math.sin(x)*1.12))}const g=Oc(.1,i);g.position.set(0,.84,1.07),d.add(g);for(const T of[1,-1]){const x=Xt(new Bn(.22,.06,10,20,Math.PI),e,T*.78,1.18,0);x.rotation.y=Math.PI/2,d.add(x)}for(let T=0;T<3;T++){const x=T/3*Math.PI*2+Math.PI/2,y=new Ge;y.position.set(Math.cos(x)*.55,a,Math.sin(x)*.55),y.rotation.set(Math.sin(x)*-.25,0,Math.cos(x)*.25),y.add(Xt(new Pn(.11,.07,a+.1,12),t,0,-a/2,0)),y.add(Xt(new ei(.11,12,10),n,0,-a,0)),r.add(y)}const _=new Ge;_.position.set(0,a+1.2,-.9),r.add(_);const m=[[.001,.56],[.2,.52],[.52,.36],[.82,.12],[.96,.02],[.96,0],[.84,0],[.7,.1],[.44,.28],[.18,.4],[.001,.42]].map(([T,x])=>new ft(T,x)),p=Xt(new ka(m,40),t,0,0,.9);_.add(p),_.add(Xt(new Bn(.95,.045,8,48),e,0,.02,.9).rotateX(Math.PI/2)),_.add(Xt(new ei(.13,16,12),n,0,.68,.9)),_.add(Xt(new Pn(.06,.1,.14,12),e,0,.58,.9));const M=Xt(new Pn(.06,.06,.34,14),e,0,.02,-.02);return M.rotation.z=Math.PI/2,_.add(M),{root:r,burstPoint:new I(0,a+1.3,.1),height:a+1.9,setGrade(T){t.color.set(T.main).lerp(new Jt("#6E6254"),.3),e.color.set(T.main).lerp(new Jt("#1C1A17"),.3),n.color.set(T.main).lerp(new Jt("#F3EBDC"),.5),i.color.set(T.glow),s.setColor(T.glow)},setGlow(T){s.set(T)},setOpen(T){_.rotation.x=-1.2*T}}}function bS(){const r=new Ge,t=Be("#5A554D"),e=Be("#7C766B");return r.add(Xt(new Pn(1.75,1.9,.28,48),t,0,-.14,0)),r.add(Xt(new Bn(1.76,.06,8,48),e,0,0,0).rotateX(Math.PI/2)),r.position.y=-.62,r}function TS(r){return r==="chest"?vS():r==="token"?SS():yS()}class ES{constructor(t){Vt(this,"ctx");Vt(this,"list",[]);Vt(this,"w",1);Vt(this,"h",1);Vt(this,"dpr",1);Vt(this,"density",1);this.canvas=t,this.ctx=t.getContext("2d")}resize(t,e,n){this.w=t,this.h=e,this.dpr=n,this.canvas.width=Math.round(t*n),this.canvas.height=Math.round(e*n)}get count(){return this.list.length}clear(t){this.list=t?this.list.filter(e=>!t(e)):[]}add(t){this.list.push({shape:"spark",mode:"free",vx:0,vy:0,life:1,maxLife:1,size:3,gravity:0,drag:.98,rot:Math.random()*Math.PI*2,vr:0,...t})}n(t){return Math.max(1,Math.round(t*this.density))}sparks(t,e,n,i,s=9,a=.16,o=0){for(let l=0;l<this.n(n);l++){const c=Math.random()*Math.PI*2,u=s*(.35+Math.random()*.8),f=.7+Math.random()*.7;this.add({x:t+Math.cos(c)*o,y:e+Math.sin(c)*o,vx:Math.cos(c)*u,vy:Math.sin(c)*u-2,color:i[l%i.length],size:2+Math.random()*3.2,gravity:a,drag:.955,life:f,maxLife:f})}}streaks(t,e,n,i,s=22,a=0){for(let o=0;o<this.n(n);o++){const l=o/n*Math.PI*2+Math.random()*.2,c=s*(.7+Math.random()*.5),u=.45+Math.random()*.3;this.add({shape:"streak",x:t+Math.cos(l)*a,y:e+Math.sin(l)*a,vx:Math.cos(l)*c,vy:Math.sin(l)*c,color:i,size:2.2,drag:.9,life:u,maxLife:u})}}stars(t,e,n,i,s=180,a=0){for(let o=0;o<this.n(n);o++){const l=Math.random()*Math.PI*2,c=a+s*(.3+Math.random()*.7),u=.8+Math.random()*.9;this.add({shape:"star",x:t+Math.cos(l)*c,y:e+Math.sin(l)*c,vx:Math.cos(l)*.6,vy:Math.sin(l)*.6-.4,color:i,size:7+Math.random()*9,drag:.97,vr:(Math.random()-.5)*.25,life:u,maxLife:u})}}shockwave(t,e,n,i,s=.7){this.add({shape:"ring",x:t,y:e,color:i,maxR:n,life:s,maxLife:s,size:1})}attract(t,e,n,i,s=220,a=60){for(let o=0;o<this.n(n);o++){const l=Math.random()*Math.PI*2,c=s*(.7+Math.random()*.6),u=1.4;this.add({mode:"attract",x:t+Math.cos(l)*c,y:e+Math.sin(l)*c,vx:-Math.sin(l)*2,vy:Math.cos(l)*2,tx:t,ty:e,accel:.9+Math.random()*.6,killRadius:a,color:i[o%i.length],size:1.8+Math.random()*2,drag:.9,life:u,maxLife:u})}}curve(t,e,n,i,s,a=.8,o=-160){const l=(t+n)/2;this.add({mode:"curve",x:t,y:e,sx:t,sy:e,tx:n,ty:i,c1x:t+(l-t)*.2,c1y:e+o,c2x:n-(n-l)*.3,c2y:i+o*.5,color:s,size:3,life:a,maxLife:a})}orbit(t,e,n,i,s,a){for(let o=0;o<this.n(s);o++)this.add({mode:"orbit",shape:"dust",x:t,y:e,cx:t,cy:e,rx:n,ry:i,ang:o/s*Math.PI*2,angV:1.4+o%3*.15,trail:[],color:a,size:3.4,life:999,maxLife:999})}dust(t,e,n,i,s){for(let a=0;a<this.n(i);a++){const o=1.6+Math.random()*1.6;this.add({shape:"dust",x:t+(Math.random()-.5)*n,y:e-Math.random()*40,vx:(Math.random()-.5)*.3,vy:-(.6+Math.random()*.9),color:s,size:1.2+Math.random()*1.8,drag:1,life:o,maxLife:o})}}confetti(t,e,n,i){for(let s=0;s<this.n(n);s++){const a=-Math.PI/2+(Math.random()-.5)*2.2,o=10+Math.random()*9,l=2.2+Math.random()*.8;this.add({shape:"confetti",x:t,y:e,vx:Math.cos(a)*o,vy:Math.sin(a)*o,color:i[s%i.length],size:5+Math.random()*4,gravity:.28,drag:.965,vr:(Math.random()-.5)*.5,life:l,maxLife:l})}}step(t){const e=t*60,n=[];for(const i of this.list)if(i.life-=t,!(i.life<=0)){if(i.mode==="free"){i.vy+=i.gravity*e;const s=Math.pow(i.drag,e);i.vx*=s,i.vy*=s,i.x+=i.vx*e,i.y+=i.vy*e}else if(i.mode==="attract"){const s=i.tx-i.x,a=i.ty-i.y,o=Math.hypot(s,a)||1;i.vx=(i.vx+s/o*i.accel*e)*Math.pow(i.drag,e),i.vy=(i.vy+a/o*i.accel*e)*Math.pow(i.drag,e),i.x+=i.vx*e,i.y+=i.vy*e,o<i.killRadius&&(i.life=Math.min(i.life,.08))}else if(i.mode==="curve"){const s=1-i.life/i.maxLife,a=s<.5?2*s*s:1-Math.pow(-2*s+2,2)/2,o=1-a;i.x=o*o*o*i.sx+3*o*o*a*i.c1x+3*o*a*a*i.c2x+a*a*a*i.tx,i.y=o*o*o*i.sy+3*o*o*a*i.c1y+3*o*a*a*i.c2y+a*a*a*i.ty}else i.mode==="orbit"&&(i.ang+=i.angV*t,i.x=i.cx+Math.cos(i.ang)*i.rx,i.y=i.cy+Math.sin(i.ang)*i.ry,i.trail.push({x:i.x,y:i.y}),i.trail.length>14&&i.trail.shift());i.rot+=i.vr*e,n.push(i)}this.list=n}draw(){const t=this.ctx;t.setTransform(this.dpr,0,0,this.dpr,0,0),t.clearRect(0,0,this.w,this.h),t.globalCompositeOperation="source-over";for(const e of this.list){const n=e.life/e.maxLife,i=Math.min(1,n*1.6);switch(e.shape){case"spark":case"dust":{e.mode==="orbit"&&e.trail&&e.trail.forEach((s,a)=>{t.globalAlpha=a/e.trail.length*.5,t.fillStyle=e.color,t.beginPath(),t.arc(s.x,s.y,e.size*(.4+a/e.trail.length*.6),0,Math.PI*2),t.fill()}),t.globalAlpha=i*.16,t.fillStyle=e.color,t.beginPath(),t.arc(e.x,e.y,e.size*3.2,0,Math.PI*2),t.fill(),t.globalAlpha=i,t.beginPath(),t.arc(e.x,e.y,e.size,0,Math.PI*2),t.fill();break}case"streak":{const s=Math.hypot(e.vx,e.vy)*3.2,a=Math.atan2(e.vy,e.vx);t.save(),t.translate(e.x,e.y),t.rotate(a);const o=t.createLinearGradient(-s,0,0,0);o.addColorStop(0,"rgba(255,255,255,0)"),o.addColorStop(1,e.color),t.globalAlpha=i,t.fillStyle=o,t.beginPath(),t.moveTo(-s,0),t.lineTo(0,-e.size/2),t.lineTo(e.size,0),t.lineTo(0,e.size/2),t.closePath(),t.fill(),t.restore();break}case"star":{const s=e.size*.8*Math.sin(Math.PI*Math.min(1,(1-n)*1.4+.1));t.save(),t.translate(e.x,e.y),t.rotate(e.rot),t.scale(1,.35+.65*Math.abs(Math.cos(e.rot*1.7))),t.globalAlpha=i,t.fillStyle=e.color,t.beginPath(),t.moveTo(-s*.6,-s*.5),t.lineTo(s*.55,-s*.35),t.lineTo(s*.45,s*.55),t.lineTo(-s*.5,s*.4),t.closePath(),t.fill(),t.globalAlpha=i*.6,t.fillStyle="#FFF8E6",t.fillRect(-s*.3,-s*.3,s*.25,s*.18),t.restore();break}case"confetti":{t.save(),t.translate(e.x,e.y),t.rotate(e.rot),t.scale(1,Math.cos(e.rot*2)),t.globalAlpha=i*.9,t.fillStyle=e.color,t.beginPath(),t.ellipse(0,0,e.size*.6,e.size*.32,0,0,Math.PI*2),t.fill(),t.restore();break}case"ring":{const s=1-n,a=1-Math.pow(1-s,3),o=e.maxR*a,l=[[22,.1],[9,.22],[2.5,.75]];for(const[c,u]of l)t.globalAlpha=u*n,t.strokeStyle=c<3?"#1C1A17":e.color,t.lineWidth=c*(.5+n*.5),t.beginPath(),t.ellipse(e.x,e.y,o,o*.78,0,0,Math.PI*2),t.stroke();break}}}t.globalAlpha=1,t.globalCompositeOperation="source-over"}}let En=null,sr=null,Ga=null;function wS(){if(En||typeof window>"u")return;const r=window.AudioContext||window.webkitAudioContext;if(!r)return;En=new r;const t=En.createDynamicsCompressor();t.threshold.value=-10,t.ratio.value=8,sr=En.createGain(),sr.gain.value=.7,sr.connect(t).connect(En.destination),Ga=En.createBuffer(1,En.sampleRate,En.sampleRate);const e=Ga.getChannelData(0);for(let n=0;n<e.length;n++)e[n]=Math.random()*2-1}function Bc(){return!En||!sr||Lh()?null:(En.state==="suspended"&&En.resume(),En)}function Ni(r,t,e,n,i=0,s){const a=Bc();if(!a)return;const o=a.currentTime+i,l=a.createOscillator(),c=a.createGain();l.type=e,l.frequency.setValueAtTime(r,o),s&&l.frequency.exponentialRampToValueAtTime(s,o+t),c.gain.setValueAtTime(1e-4,o),c.gain.exponentialRampToValueAtTime(n,o+.008),c.gain.exponentialRampToValueAtTime(1e-4,o+t),l.connect(c).connect(sr),l.start(o),l.stop(o+t+.02)}function _a(r,t,e,n=0,i="lowpass"){const s=Bc();if(!s||!Ga)return;const a=s.currentTime+n,o=s.createBufferSource();o.buffer=Ga;const l=s.createBiquadFilter();l.type=i,l.frequency.value=e;const c=s.createGain();c.gain.setValueAtTime(t,a),c.gain.exponentialRampToValueAtTime(1e-4,a+r),o.connect(l).connect(c).connect(sr),o.start(a),o.stop(a+r+.02)}function Ho(r,t=0,e=.07){Ni(r,.9,"triangle",e,t),Ni(r*2,.5,"sine",e*.35,t),Ni(r*3.01,.25,"sine",e*.12,t)}function Wo(r,t,e,n=0){[1,2.76,5.4,8.93].forEach((i,s)=>Ni(r*i,t/(1+s*.6),"sine",e/(1+s*1.4),n))}const Xo=[294,330,370,440,494,587,659,740,880],Ki={jump(){Ni(620,.08,"sine",.12,0,380),_a(.03,.05,2400,0,"bandpass"),is("light")},land(){Ni(110,.28,"sine",.26,0,62),_a(.07,.07,500),is("medium")},levelUp(r){const t=Math.min(r,4);Xo.slice(t,t+3+Math.floor(r/2)).forEach((n,i)=>Ho(n,i*.07,.06))},charge(r){const t=Bc();if(!t)return()=>{};const e=t.currentTime,n=t.createOscillator(),i=t.createGain();n.type="triangle",n.frequency.setValueAtTime(147,e),n.frequency.exponentialRampToValueAtTime(587,e+r);const s=t.createOscillator(),a=t.createGain();return s.frequency.setValueAtTime(5,e),s.frequency.linearRampToValueAtTime(14,e+r),a.gain.value=8,s.connect(a).connect(n.frequency),i.gain.setValueAtTime(1e-4,e),i.gain.exponentialRampToValueAtTime(.09,e+r),n.connect(i).connect(sr),n.start(e),s.start(e),_a(r,.03,3e3,0,"highpass"),()=>{const o=t.currentTime;i.gain.cancelScheduledValues(o),i.gain.setValueAtTime(i.gain.value,o),i.gain.exponentialRampToValueAtTime(1e-4,o+.05),n.stop(o+.06),s.stop(o+.06)}},explode(r){Ni(70,.7,"sine",.5,0,38),_a(.35,.25,700),Wo(147,1.2+r*.8,.14*Math.min(1.4,r),.02),is("heavy")},pop(){Ho(Xo[5],0,.05),is("light")},tick(){Ni(1500,.025,"sine",.05)},coin(){Wo(1320,.35,.05)},fanfare(){Xo.slice(2,8).forEach((r,t)=>Ho(r,t*.08,.055)),Wo(196,1.8,.1,.5),is("ritual")}},qn={chargeSec:1,flashMax:.8,shakePx:14,pushK:.12,sparkBase:70,streakBase:22,starBase:12,confetti:90,revealDelay:.75},wh=2.3,$i="#1C1A17",AS="#8A857C",Pr="#C29A45",RS="#A33A32",CS=.42;class PS{constructor(t,e,n,i){Vt(this,"phase","idle");Vt(this,"grade",0);Vt(this,"stage");Vt(this,"particles");Vt(this,"model");Vt(this,"pedestal");Vt(this,"A",{y:0,rotY:0,rotZ:0,spin:0,sx:1,sy:1,sz:1,jitter:0,open:0,glow:0,camK:1,world:0,pan:0});Vt(this,"cam",{dist:9,lookY:1,camY:1.6});Vt(this,"subH",wh);Vt(this,"loops",[]);Vt(this,"hintCall",null);Vt(this,"main",null);Vt(this,"raf",0);Vt(this,"last",0);Vt(this,"cssW",1);Vt(this,"cssH",1);Vt(this,"reduce");Vt(this,"audioReady",!1);Vt(this,"stopCharge",null);Vt(this,"norm",1);Vt(this,"orbitOn",!1);Vt(this,"dustTimer",null);Vt(this,"sfx",Ki);this.refs=t,this.cfg=e,this.cb=n,this.reduce=i.reduceMotion,this.stage=new gS({canvas:t.gl,lowPower:i.reduceMotion}),this.particles=new ES(t.fx),this.particles.density=this.reduce?.35:1,this.model=TS(e.subject);const s=new ts().setFromObject(this.model.root).getSize(new I);this.norm=wh/Math.max(s.x,s.y,s.z*.8),this.model.root.scale.setScalar(this.norm),this.subH=s.y*this.norm,this.stage.subjectRoot.add(this.model.root),this.pedestal=bS(),this.stage.props.add(this.pedestal),this.applyGrade(0,!1),this.resize(),this.tick=this.tick.bind(this),this.syncScene(),this.stage.render(),this.raf=requestAnimationFrame(this.tick),this.startIdle()}resize(){const t=this.refs.root.getBoundingClientRect();this.cssW=Math.max(1,t.width),this.cssH=Math.max(1,t.height);const e=Math.min(2,window.devicePixelRatio||1);this.stage.resize(this.cssW,this.cssH,e);const n=this.stage.camera,i=Math.tan(jm.degToRad(n.fov/2)),s=this.cssW/this.cssH,a=Math.max(3.9/2/(i*s),(this.subH+2.6)/2/i),o=2*a*i,l=this.subH/2-(.5-CS)*o;this.cam={dist:a,lookY:l,camY:l+.9},this.particles.resize(this.cssW,this.cssH,e),this.placeOverlays()}get style(){return Yn[this.grade]}burstScreen(){const t=this.model.burstPoint.clone().multiplyScalar(this.norm);return this.stage.subjectRoot.updateMatrixWorld(),this.stage.project(t.applyMatrix4(this.stage.subjectRoot.matrixWorld),this.cssW,this.cssH)}centerScreen(){return this.stage.project(new I(0,this.subH*.5,0),this.cssW,this.cssH)}baseScreen(){return this.stage.project(new I(0,-.05,0),this.cssW,this.cssH)}subjectRadiusPx(){const t=this.stage.project(new I(0,this.subH+.1,0),this.cssW,this.cssH),e=this.stage.project(new I(0,-.1,0),this.cssW,this.cssH),n=this.stage.project(new I(1.35,this.subH*.5,0),this.cssW,this.cssH),i=this.centerScreen();return{rx:Math.abs(n.x-i.x),ry:Math.abs(e.y-t.y)/2}}placeOverlays(){const t=this.centerScreen(),e=this.baseScreen(),n=this.burstScreen(),i=this.refs.root.style;i.setProperty("--cx",`${t.x}px`),i.setProperty("--cy",`${t.y}px`),i.setProperty("--bx",`${n.x}px`),i.setProperty("--by",`${n.y}px`),i.setProperty("--gx",`${e.x}px`),i.setProperty("--gy",`${e.y}px`);const{rx:s,ry:a}=this.subjectRadiusPx();i.setProperty("--sr",`${Math.max(s,a)}px`)}applyGrade(t,e=!0){this.grade=t;const n=Yn[t];this.model.setGrade(n),this.stage.setRimColor(n.glow);const i=this.refs.root.style;if(i.setProperty("--main",n.main),i.setProperty("--glow",n.glow),i.setProperty("--bg-in",n.bgInner),i.setProperty("--bg-out",n.bgOuter),this.cb.onGrade(t),!e)return;const s=this.centerScreen();this.flash(.45,.35,s),this.particles.shockwave(s.x,s.y,150,n.main,.55),this.particles.sparks(s.x,s.y,22,[$i,n.main,Pr],7,.12,this.subjectRadiusPx().rx),Ki.levelUp(t)}flash(t,e,n){const i=this.refs.flash,s=n??this.burstScreen();i.style.setProperty("--fx",`${s.x}px`),i.style.setProperty("--fy",`${s.y}px`),ce.killTweensOf(i),ce.fromTo(i,{opacity:Math.min(t,qn.flashMax)},{opacity:0,duration:e,ease:"power2.out"})}setPhase(t){this.phase=t,this.cb.onPhase(t)}tick(t){this.raf=requestAnimationFrame(this.tick);const e=Math.min(.05,this.last?(t-this.last)/1e3:.016);this.last=t,this.syncScene(),this.placeOverlays(),this.stage.render(),this.particles.step(e),this.particles.draw()}syncScene(){const t=this.A,e=this.stage.subjectRoot,n=t.jitter;e.position.set(n?(Math.random()-.5)*.12*n:0,t.y,n?(Math.random()-.5)*.06*n:0),e.rotation.set(0,t.rotY+t.spin,t.rotZ+(n?(Math.random()-.5)*.1*n:0)),e.scale.set(t.sx,t.sy,t.sz),this.model.setOpen(t.open),this.model.setGlow(t.glow);const i=this.stage.camera;i.position.set(0,this.cam.camY,this.cam.dist*t.camK),i.position.y=this.cam.camY-t.pan,i.lookAt(0,this.cam.lookY+(1-t.camK)*this.subH*.35-t.pan,0);const s=this.refs.shadow.style,a=1/(1+t.y*.55);s.transform=`translate(-50%, -50%) scale(${a*(t.sx*.9+.1)}, ${a})`,s.opacity=String(.55*a),t.world?this.refs.world.style.transform=`translate(${(Math.random()-.5)*t.world}px, ${(Math.random()-.5)*t.world}px)`:this.refs.world.style.transform&&(this.refs.world.style.transform="")}startIdle(){this.stopLoops();const t=this.A;this.loops.push(ce.to(t,{y:.16,duration:1.3,ease:"sine.inOut",yoyo:!0,repeat:-1}),ce.fromTo(t,{rotY:t.rotY},{rotY:.55,duration:1.6,ease:"sine.inOut",onComplete:()=>{this.phase!=="idle"&&this.phase!=="settle"&&this.phase!=="revealing"||this.loops.push(ce.fromTo(t,{rotY:.55},{rotY:-.55,duration:3.2,ease:"sine.inOut",yoyo:!0,repeat:-1}))}})),this.phase==="idle"&&this.scheduleHint()}scheduleHint(){var t;(t=this.hintCall)==null||t.kill(),this.hintCall=ce.delayedCall(2.6,()=>{if(this.phase!=="idle")return;const e=ce.timeline({onComplete:()=>this.scheduleHint()});e.to(this.A,{rotZ:.1,duration:.06}).to(this.A,{rotZ:-.1,duration:.08,yoyo:!0,repeat:3}).to(this.A,{rotZ:0,duration:.12,ease:"back.out(3)"}),this.loops.push(e)})}stopLoops(){var t;(t=this.hintCall)==null||t.kill(),this.hintCall=null;for(const e of this.loops)e.kill();this.loops=[],ce.killTweensOf(this.A,"y,rotZ,jitter"),this.A.rotZ=0,this.A.jitter=0}tap(){this.audioReady||(wS(),this.audioReady=!0),this.phase==="idle"&&(this.grade<this.cfg.targetGrade?this.upgrade():this.charge())}upgrade(){this.setPhase("upgrading"),this.stopLoops();const t=this.A,e=this.grade+1;Ki.jump();const n=ce.timeline({onComplete:()=>{this.setPhase("idle"),this.startIdle()}});this.main=n,n.to(t,{rotY:0,duration:.12,ease:"power1.out"},0).to(t,{y:0,duration:.08},0).to(t,{sy:.82,sx:1.12,sz:1.12,duration:.08,ease:"power2.out"},0).to(t,{sy:1.2,sx:.88,sz:.88,duration:.14,ease:"power2.out"},.08).to(t,{y:1.55,duration:.3,ease:"power2.out"},.08).to(t,{spin:`+=${Math.PI*2}`,duration:.56,ease:"power2.inOut"},.08).to(t,{sy:1,sx:1,sz:1,duration:.2},.22).call(()=>this.applyGrade(e),[],.36).to(t,{y:0,duration:.26,ease:"power2.in"},.38).call(()=>{Ki.land();const i=this.baseScreen();this.particles.sparks(i.x,i.y,14,[AS,$i],4,.05)},[],.64).to(t,{sy:.66,sx:1.24,sz:1.24,duration:.07,ease:"power2.out"},.64).to(t,{sy:1,sx:1,sz:1,duration:.55,ease:"elastic.out(1.1, 0.32)"},.71)}charge(){this.setPhase("charging"),this.stopLoops();const t=this.A,e=qn.chargeSec;this.stopCharge=Ki.charge(e);const n=this.style,i=ce.timeline({onComplete:()=>this.burst()});this.main=i,i.to(t,{rotY:0,y:0,duration:.2,ease:"power2.out"},0).to(t,{glow:1,duration:e,ease:"power2.in"},0).to(t,{jitter:this.reduce?.3:1.2,duration:e,ease:"power2.in"},0).to(this.refs.root,{"--ray-speed":.25,duration:e,ease:"power2.in"},0);for(let s=0;s<e-.1;s+=.09)i.call(()=>{const a=this.burstScreen();this.particles.attract(a.x,a.y,10,[$i,n.main],Math.max(this.cssW,this.cssH)*.42,Math.max(this.subjectRadiusPx().rx,this.subjectRadiusPx().ry)*1.15)},[],s);i.to(t,{sy:.58,sx:1.3,sz:1.3,duration:.12,ease:"power3.in"},e-.12)}burst(){var o;this.setPhase("bursting"),(o=this.stopCharge)==null||o.call(this),this.stopCharge=null;const t=this.A;t.jitter=0;const e=this.style,n=e.power,i=this.grade===5,s=this.burstScreen();Ki.explode(n),this.flash(qn.flashMax*Math.min(1,.6+n*.25),.7,s),this.refs.root.style.setProperty("--ray-speed","1"),this.refs.root.dataset.burst="1";const a=ce.timeline({onComplete:()=>this.reveal()});this.main=a,a.to(t,{sy:1.14,sx:.9,sz:.9,duration:.1,ease:"power2.out"},0).to(t,{sy:1,sx:1,sz:1,duration:.7,ease:"elastic.out(1, 0.38)"},.1).to(t,{open:1,duration:this.cfg.subject==="token"?1.2:.6,ease:this.cfg.subject==="token"?"power3.out":"back.out(2.4)"},.02).to(t,{glow:.75,duration:.8},.1).to(t,{camK:1-qn.pushK*n*(this.reduce?.3:1),duration:.16,ease:"power3.out"},0).to(t,{camK:.96,duration:.9,ease:"power2.inOut"},.2),this.reduce||a.to(t,{world:qn.shakePx*n,duration:.02},0).to(t,{world:0,duration:.45,ease:"power2.out"},.05),[0,.07,.16].forEach((l,c)=>a.call(()=>this.particles.shockwave(s.x,s.y,(180+c*90)*n,c===1?$i:e.main,.7+c*.1),[],l)),a.call(()=>{const l=this.subjectRadiusPx().rx*.9;this.particles.streaks(s.x,s.y,Math.round(qn.streakBase*n),$i,20+n*6,l),this.particles.sparks(s.x,s.y,Math.round(qn.sparkBase*n),[$i,$i,e.main,Pr],8+n*5,.15,l),this.particles.stars(s.x,s.y,Math.round(qn.starBase*n),Pr,60+90*n,this.subjectRadiusPx().rx)},[],.02),a.fromTo(this.refs.beams,{opacity:0,scale:.4},{opacity:1,scale:1,duration:.5,ease:"back.out(1.6)"},.05),a.call(()=>this.startBeamDust(),[],.3),i&&!this.reduce&&a.call(()=>this.particles.confetti(this.cssW/2,this.cssH*.18,qn.confetti,[RS,Pr,"#E7B7A8","#F3EBDC",e.main]),[],.22),a.to({},{duration:qn.revealDelay},.2)}startBeamDust(){var e;(e=this.dustTimer)==null||e.kill();const t=()=>{if(this.phase==="done")return;const n=this.burstScreen();this.particles.dust(n.x,n.y-40,90,2,Pr),this.dustTimer=ce.delayedCall(.18,t)};t()}reveal(){this.setPhase("revealing"),this.grade===5&&this.enterStage(),Ki.fanfare();const e=this.cfg.subject==="cauldron"?{pan:.1,k:1.24}:{pan:.2,k:1.08};ce.to(this.A,{pan:this.subH*e.pan,camK:e.k,duration:.8,ease:"power2.inOut"}),this.startIdle(),this.cb.onReveal()}enterStage(){if(this.pedestal.visible=!1,this.refs.root.dataset.stage="1",ce.fromTo(this.refs.curtain,{opacity:0},{opacity:1,duration:.6,ease:"power2.out"}),ce.fromTo(this.refs.backGlow,{opacity:0,scale:.6},{opacity:1,scale:1,duration:.8,ease:"power2.out"}),!this.orbitOn){this.orbitOn=!0;const t=this.centerScreen(),{rx:e,ry:n}=this.subjectRadiusPx();this.particles.orbit(t.x,t.y,e*1.35+30,n*1.05+30,this.reduce?3:9,Pr)}}revealSettled(){this.phase==="revealing"&&this.setPhase("settle")}beginClaim(){return this.phase!=="settle"?!1:(this.setPhase("claiming"),!0)}finish(){var t;this.phase!=="done"&&(this.setPhase("done"),this.stopLoops(),(t=this.dustTimer)==null||t.kill(),this.cb.onDone())}skip(){var e,n;if(this.phase==="settle"||this.phase==="claiming"||this.phase==="done"||this.phase==="revealing")return;(e=this.main)==null||e.kill(),(n=this.stopCharge)==null||n.call(this),this.stopCharge=null,this.stopLoops();const t=this.A;ce.killTweensOf(t),Object.assign(t,{y:0,rotY:0,spin:0,sx:1,sy:1,sz:1,jitter:0,open:1,glow:.75,camK:.96,world:0}),this.grade!==this.cfg.targetGrade&&this.applyGrade(this.cfg.targetGrade,!1),this.refs.root.dataset.burst="1",ce.set(this.refs.beams,{opacity:1,scale:1}),this.startBeamDust(),this.reveal()}dispose(){var t,e,n;cancelAnimationFrame(this.raf),(t=this.main)==null||t.kill(),(e=this.stopCharge)==null||e.call(this),this.stopLoops(),(n=this.dustTimer)==null||n.kill(),ce.killTweensOf(this.A),this.stage.dispose()}}function Ah(r,t){const e=parseInt(r.slice(1),16);let n=e>>16&255,i=e>>8&255,s=e&255;return t<0?(n*=1+t,i*=1+t,s*=1+t):(n+=(255-n)*t,i+=(255-i)*t,s+=(255-s)*t),`rgb(${Math.round(n)},${Math.round(i)},${Math.round(s)})`}function ke(r,t,e,n,i,s){r.roundRect(t,e,n,i,s)}const LS={sword:{base:"#D9D5CB",body:r=>{r.moveTo(0,-.95),r.lineTo(.16,-.72),r.lineTo(.16,.3),r.lineTo(-.16,.3),r.lineTo(-.16,-.72),r.closePath()},parts:[{color:"#B08A3E",path:r=>ke(r,-.46,.28,.92,.16,.07)},{color:"#5A4636",path:r=>ke(r,-.1,.43,.2,.38,.05)},{color:"#B08A3E",path:r=>r.arc(0,.88,.12,0,Math.PI*2)}],details:r=>{r.moveTo(0,-.7),r.lineTo(0,.2)},tilt:.35},blade:{base:"#D4D0C6",body:r=>{r.moveTo(-.2,.25),r.lineTo(-.2,-.7),r.quadraticCurveTo(.1,-1,.42,-.8),r.quadraticCurveTo(.3,-.2,.22,.25),r.closePath()},parts:[{color:"#A33A32",path:r=>ke(r,-.34,.24,.7,.14,.06)},{color:"#2E2A25",path:r=>ke(r,-.1,.36,.22,.5,.06)}],details:r=>{r.moveTo(-.08,-.62),r.quadraticCurveTo(.12,-.8,.3,-.72)},tilt:-.3},spear:{base:"#DCD8CE",body:r=>{r.moveTo(0,-.98),r.lineTo(.28,-.46),r.lineTo(.1,-.36),r.lineTo(-.1,-.36),r.lineTo(-.28,-.46),r.closePath()},parts:[{color:"#A33A32",path:r=>r.ellipse(0,-.28,.22,.1,0,0,Math.PI*2)},{color:"#7A5E42",path:r=>ke(r,-.07,-.22,.14,1.12,.05)}],details:r=>{r.moveTo(0,-.86),r.lineTo(0,-.46)},tilt:.5},staff:{base:"#8C6A4A",body:r=>{ke(r,-.12,-.9,.24,1.8,.12)},parts:[{color:"#B08A3E",path:r=>ke(r,-.16,-.62,.32,.12,.05)},{color:"#B08A3E",path:r=>ke(r,-.16,.5,.32,.12,.05)}],details:r=>{r.moveTo(-.04,-.3),r.lineTo(-.04,.3)},tilt:-.55},whip:{base:"#6E5A48",body:r=>{r.moveTo(-.5,.75),r.bezierCurveTo(-.9,.1,.1,-.2,-.2,-.6),r.bezierCurveTo(-.35,-.85,.3,-1,.6,-.7),r.bezierCurveTo(.2,-.8,-.1,-.7,0,-.52),r.bezierCurveTo(.3,-.1,-.55,.1,-.34,.72),r.closePath()},parts:[{color:"#2E2A25",path:r=>ke(r,-.62,.62,.3,.3,.08)}],tilt:.1},bow:{base:"#8C6A4A",body:r=>{r.moveTo(-.2,-.9),r.quadraticCurveTo(.75,0,-.2,.9),r.lineTo(-.06,.9),r.quadraticCurveTo(.9,0,-.06,-.9),r.closePath()},parts:[{color:"#EFE7D6",path:r=>ke(r,-.24,-.9,.04,1.8,.02)}],tilt:.2},hidden:{base:"#BDB8AE",body:r=>{for(let t=0;t<8;t++){const e=t/8*Math.PI*2-Math.PI/2,n=t%2===0?.85:.3;r.lineTo(Math.cos(e)*n,Math.sin(e)*n)}r.closePath()},parts:[{color:"#2E2A25",path:r=>r.arc(0,0,.1,0,Math.PI*2)}],tilt:.4},armor:{base:"#76827F",body:r=>{r.moveTo(-.3,-.8),r.quadraticCurveTo(0,-.6,.3,-.8),r.lineTo(.78,-.5),r.lineTo(.62,-.1),r.lineTo(.5,-.2),r.lineTo(.52,.72),r.quadraticCurveTo(0,.92,-.52,.72),r.lineTo(-.5,-.2),r.lineTo(-.62,-.1),r.lineTo(-.78,-.5),r.closePath()},parts:[{color:"#B08A3E",path:r=>ke(r,-.52,.28,1.04,.14,.05)}],details:r=>{r.moveTo(0,-.62),r.lineTo(0,.25),r.moveTo(-.3,.55),r.lineTo(.3,.55)},tilt:0},accessory:{base:"#9CB8A0",body:r=>{r.arc(0,.15,.62,0,Math.PI*2)},parts:[{color:"#A33A32",path:r=>ke(r,-.05,-.95,.1,.45,.04)},{color:"#A33A32",path:r=>r.arc(0,-.5,.1,0,Math.PI*2)}],details:r=>{r.moveTo(.18,.15),r.arc(0,.15,.18,0,Math.PI*2)},tilt:-.12},scroll:{base:"#EFE3C4",body:r=>{ke(r,-.6,-.6,1.2,1.2,.08)},parts:[{color:"#7A5E42",path:r=>ke(r,-.72,-.76,1.44,.2,.1)},{color:"#7A5E42",path:r=>ke(r,-.72,.56,1.44,.2,.1)},{color:"#A33A32",path:r=>ke(r,.28,-.45,.16,.5,.03)}],details:r=>{for(const t of[-.35,-.2])r.moveTo(-.42,t),r.lineTo(.1,t)},tilt:.08},pill:{base:"#B8483C",body:r=>{r.arc(0,.05,.72,0,Math.PI*2)},parts:[{color:"#C9A24A",path:r=>r.ellipse(0,-.62,.3,.12,0,0,Math.PI*2)}],tilt:0},coin:{base:"#B89455",body:r=>{r.arc(0,0,.8,0,Math.PI*2),r.moveTo(-.22,-.22),r.lineTo(-.22,.22),r.lineTo(.22,.22),r.lineTo(.22,-.22),r.closePath()},details:r=>{r.moveTo(.64,0),r.arc(0,0,.64,0,Math.PI*2),r.moveTo(-.32,-.32),r.lineTo(.32,-.32),r.lineTo(.32,.32),r.lineTo(-.32,.32),r.closePath()},tilt:.15},gem:{base:"#A33A32",body:r=>{ke(r,-.72,-.72,1.44,1.44,.12)},details:r=>{r.moveTo(-.5,-.5),r.lineTo(.5,-.5),r.lineTo(.5,.5),r.lineTo(-.5,.5),r.closePath(),r.moveTo(0,-.5),r.lineTo(0,.5)},tilt:-.1}};function DS(r,t,e,n,i,s){r.fillStyle=i,r.fillRect(0,0,e,n),r.save(),r.globalAlpha=.13,r.strokeStyle=s,r.fillStyle=s;const a=e/10;if(r.lineWidth=a*.35,t==="blade")for(let o=-n;o<e;o+=a*1.6)r.beginPath(),r.moveTo(o,n),r.lineTo(o+n,0),r.stroke();else if(t==="guard"){r.lineWidth=a*.18;const o=a*.9;for(let l=0,c=0;l<n+o;l+=o*1.5,c++)for(let u=c%2?o*.866:0;u<e+o;u+=o*1.732){r.beginPath();for(let f=0;f<6;f++){const h=f/6*Math.PI*2+Math.PI/6;r.lineTo(u+Math.cos(h)*o,l+Math.sin(h)*o)}r.closePath(),r.stroke()}}else if(t==="charm")for(let o=a/2,l=0;o<n;o+=a*1.4,l++)for(let c=l%2?a*.7:0;c<e+a;c+=a*1.4)r.beginPath(),r.arc(c,o,a*.28,0,Math.PI*2),r.fill();else if(t==="art"){r.lineWidth=a*.2;for(let o=0;o<n+a;o+=a*1.1)for(let l=0;l<e+a;l+=a*1.8)r.beginPath(),r.arc(l,o,a*.9,Math.PI,Math.PI*2),r.stroke()}else if(t==="elixir"){r.lineWidth=a*.15;const o=[[.15,.2,.7],[.8,.15,.5],[.3,.75,.9],[.85,.7,.6],[.55,.45,.35],[.1,.55,.3]];for(const[l,c,u]of o)r.beginPath(),r.arc(l*e,c*n,u*a,0,Math.PI*2),r.stroke()}else{r.lineWidth=a*.14;for(let o=-10;o<20;o++)r.beginPath(),r.moveTo(o*a*1.4,0),r.lineTo(o*a*1.4+n,n),r.moveTo(o*a*1.4,n),r.lineTo(o*a*1.4+n,0),r.stroke()}r.restore()}let Lr=null;function IS(r){if(!Lr){Lr=document.createElement("canvas"),Lr.width=64,Lr.height=64;const t=Lr.getContext("2d");t.fillStyle=wa,t.fillRect(0,0,64,64),t.globalCompositeOperation="destination-out";let e=7;const n=()=>(e=e*16807%2147483647)/2147483647;for(let i=0;i<70;i++)t.globalAlpha=.35+n()*.5,t.fillRect(n()*64,n()*64,4+n()*14,.6+n()*1.2)}return r.createPattern(Lr,"repeat")??wa}function Sd(r){const t=r.dpr??(typeof window<"u"&&window.devicePixelRatio||1),e=Math.round(r.cssSize*t*1.5),n=document.createElement("canvas");n.width=e,n.height=e;const i=n.getContext("2d");r.pattern&&r.bg&&DS(i,r.pattern,e,e,r.bg,r.fg??wa);const s=LS[r.kind],a=r.tint??s.base,o=e*.34,l=e/2,c=e*.47;r.shadow!==!1&&(i.fillStyle="rgba(28,26,23,0.12)",i.beginPath(),i.ellipse(l,e*.86,e*.3,e*.06,0,0,Math.PI*2),i.fill(),i.fillStyle="rgba(28,26,23,0.18)",i.beginPath(),i.ellipse(l,e*.86,e*.2,e*.035,0,0,Math.PI*2),i.fill()),i.save(),i.translate(l,c),i.rotate(s.tilt),i.scale(o,o);const u=.09,f=.03,h="#F3EBDC",d=(p,M)=>{i.fillStyle=NS(M,h,.28),i.fill(p,"evenodd"),i.save(),i.clip(p,"evenodd"),i.globalAlpha=.55,i.fillStyle=Ah(M,-.32),i.beginPath(),i.moveTo(.15,-1.2),i.lineTo(1.3,-1.2),i.lineTo(1.3,1.3),i.lineTo(-1.3,1.3),i.lineTo(-1.3,.35),i.bezierCurveTo(-.4,.45,.3,.1,.15,-1.2),i.fill(),i.globalAlpha=.5,i.fillStyle=Ah(M,-.6),i.beginPath(),i.ellipse(.55,.5,.42,.1,-.7,0,Math.PI*2),i.fill(),i.globalAlpha=.7,i.fillStyle=h,i.beginPath(),i.ellipse(-.32,-.45,.1,.26,-.5,0,Math.PI*2),i.fill(),i.restore()},g=new Path2D;s.body(g);const _=(s.parts??[]).map(p=>{const M=new Path2D;return p.path(M),{p:M,color:p.color}});i.lineJoin="round",i.lineCap="round";const m=IS(i);return i.strokeStyle=m,typeof m!="string"&&m.setTransform(new DOMMatrix().scale(1/o)),i.lineWidth=u*2,i.stroke(g),_.forEach(({p})=>i.stroke(p)),d(g,a),_.forEach(({p,color:M})=>d(p,M)),i.strokeStyle="rgba(28,26,23,0.7)",i.lineWidth=f,i.stroke(g),_.forEach(({p})=>i.stroke(p)),s.details&&(i.beginPath(),s.details(i),i.stroke()),i.restore(),n}function NS(r,t,e){const n=parseInt(r.slice(1),16),i=parseInt(t.slice(1),16),s=(o,l)=>o>>l&255,a=o=>Math.round(s(n,o)*(1-e)+s(i,o)*e);return`rgb(${a(16)},${a(8)},${a(0)})`}const Rh=new Map;function qo(r,t,e){const n=`${r}:${t}:`,i=Rh.get(n);if(i)return i;const s=Sd({kind:r,cssSize:t,tint:e,shadow:!1}).toDataURL();return Rh.set(n,s),s}const US="_root_xawmm_9",FS="_world_xawmm_43",OS="_bg_xawmm_51",BS="_rays_xawmm_73",zS="_curtain_xawmm_129",kS="_backGlow_xawmm_171",GS="_beams_xawmm_192",VS="_shadow_xawmm_245",HS="_gl_xawmm_261",WS="_fx_xawmm_262",XS="_flash_xawmm_271",qS="_hud_xawmm_289",YS="_modes_xawmm_308",ZS="_mode_xawmm_308",KS="_tag_xawmm_334",$S="_balances_xawmm_343",JS="_pill_xawmm_349",QS="_mute_xawmm_369",jS="_muteOff_xawmm_381",ty="_skip_xawmm_396",ey="_titleWrap_xawmm_413",ny="_titleRow_xawmm_427",iy="_title_xawmm_413",ry="_gradeTag_xawmm_449",sy="_sub_xawmm_450",ay="_seal_xawmm_460",oy="_hint_xawmm_484",ly="_reveal_xawmm_512",cy="_panel_xawmm_526",uy="_panelBody_xawmm_560",hy="_panelName_xawmm_565",fy="_panelGrade_xawmm_572",dy="_blurb_xawmm_583",py="_stat_xawmm_589",my="_up_xawmm_603",_y="_cards_xawmm_610",gy="_card_xawmm_610",xy="_art_xawmm_692",vy="_cardName_xawmm_709",My="_amount_xawmm_719",Sy="_inlay_xawmm_731",yy="_newBadge_xawmm_754",by="_claim_xawmm_771",Ty="_flyer_xawmm_803",qt={root:US,world:FS,bg:OS,rays:BS,curtain:zS,backGlow:kS,beams:GS,shadow:VS,gl:HS,fx:WS,flash:XS,hud:qS,modes:YS,mode:ZS,tag:KS,balances:$S,pill:JS,mute:QS,muteOff:jS,skip:ty,titleWrap:ey,titleRow:ny,title:iy,gradeTag:ry,sub:sy,seal:ay,hint:oy,reveal:ly,panel:cy,panelBody:uy,panelName:hy,panelGrade:fy,blurb:dy,stat:py,up:my,cards:_y,card:gy,art:xy,cardName:vy,amount:My,inlay:Sy,newBadge:yy,claim:by,flyer:Ty},Ch="https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400;700&display=swap";function Ey(){if(typeof document>"u"||document.querySelector(`link[href="${Ch}"]`))return;const r=document.createElement("link");r.rel="stylesheet",r.href=Ch,document.head.appendChild(r)}function wy(){var r;return typeof document<"u"&&document.documentElement.dataset.inkMotion==="reduce"?!0:typeof window<"u"&&!!((r=window.matchMedia)!=null&&r.call(window,"(prefers-reduced-motion: reduce)").matches)}const Yo={chest:"寶箱",token:"武學令",cauldron:"丹爐"};function Ph({card:r,size:t}){const e=oe.useRef(null);return oe.useLayoutEffect(()=>{const n=e.current;if(!n)return;const i=Yn[r.grade],s=Sd({kind:r.icon,pattern:r.pattern,bg:i.bgInner,fg:i.main,cssSize:t,tint:r.icon==="gem"?i.main:void 0});s.style.width=`${t}px`,s.style.height=`${t}px`,n.replaceChildren(s)},[r,t]),Rt.jsx("div",{ref:e,className:qt.art,style:{width:t,height:t},"aria-hidden":!0})}function Ay({text:r,gradeKey:t}){const e=oe.useRef(null);return oe.useLayoutEffect(()=>{var i;const n=(i=e.current)==null?void 0:i.querySelectorAll("span");n!=null&&n.length&&ce.fromTo(n,{scale:1.9,y:-18,opacity:0,filter:"blur(10px)"},{scale:1,y:0,opacity:1,filter:"blur(0px)",duration:.55,ease:"back.out(2)",stagger:.07,overwrite:!0})},[r,t]),Rt.jsx("h1",{ref:e,className:qt.title,"aria-label":r,children:Array.from(r).map((n,i)=>Rt.jsx("span",{"aria-hidden":!0,children:n},`${t}-${i}`))})}function Ly({config:r,onDone:t,modes:e,onMode:n}){var Ht,ie,K;const i=oe.useRef(null),s=oe.useRef(null),a=oe.useRef(null),o=oe.useRef(null),l=oe.useRef(null),c=oe.useRef(null),u=oe.useRef(null),f=oe.useRef(null),h=oe.useRef(null),d=oe.useRef(null),g=oe.useRef(null),_=oe.useRef(null),m=oe.useRef(null),p=oe.useRef(null),M=oe.useRef(null),T=oe.useRef(null),[x,y]=oe.useState("idle"),[E,A]=oe.useState(0),[v,b]=oe.useState(!1),[R,P]=oe.useState(Lh),[N,z]=oe.useState(0),[L,B]=oe.useState(!1),X=oe.useMemo(wy,[]),G=r.targetGrade===5;oe.useEffect(Ey,[]),oe.useLayoutEffect(()=>{const k=new PS({root:i.current,world:s.current,gl:a.current,fx:o.current,flash:l.current,shadow:c.current,beams:u.current,curtain:f.current,backGlow:h.current},r,{onPhase:y,onGrade:A,onReveal:()=>b(!0),onDone:t},{reduceMotion:X});T.current=k;const lt=new ResizeObserver(()=>k.resize());return lt.observe(i.current),()=>{lt.disconnect(),k.dispose(),T.current=null}},[]),oe.useLayoutEffect(()=>{if(!v)return;const k=T.current,lt=d.current;if(!k||!lt)return;const Lt=Array.from(lt.querySelectorAll("[data-card]")),mt=k.burstScreen(),Ot=i.current.getBoundingClientRect(),Kt=ce.timeline({delay:G?1.3:.25});Lt.forEach((st,rt)=>{const ot=st.getBoundingClientRect(),At=mt.x-(ot.left-Ot.left+ot.width/2),Tt=mt.y-(ot.top-Ot.top+ot.height/2),Ft={t:0};ce.set(st,{x:At,y:Tt,scale:.15,rotation:-40,opacity:0}),Kt.to(Ft,{t:1,duration:.55,ease:"power2.out",onStart:()=>k.sfx.pop(),onUpdate:()=>{const Gt=Ft.t,C=At*.45,S=Math.min(Tt,0)-170,O=1-Gt;ce.set(st,{x:O*O*At+2*O*Gt*C,y:O*O*Tt+2*O*Gt*S,scale:.15+.95*Gt,rotation:-40*O,opacity:Math.min(1,Gt*3)})}},rt*.13),Kt.fromTo(st,{scale:1.1},{scale:1,duration:.6,ease:"elastic.out(1.2, 0.35)"},rt*.13+.55),Kt.fromTo(st,{rotation:9},{rotation:0,duration:.75,ease:"elastic.out(1.4, 0.3)"},rt*.13+.55);const Bt=st.querySelector("[data-amount]"),D=Number((Bt==null?void 0:Bt.dataset.amount)??0);if(Bt&&D){const Gt={v:0};Kt.to(Gt,{v:D,duration:.6,ease:"power2.out",onUpdate:()=>Bt.textContent=`×${Math.round(Gt.v)}`},rt*.13+.45)}const Qt=st.querySelector("[data-new]");Qt&&Kt.fromTo(Qt,{scale:0,rotation:-40},{scale:1,rotation:12,duration:.5,ease:"back.out(3)"},rt*.13+.7)});const j=g.current,it=Lt.length*.13+.7;return j&&(Kt.fromTo(j,{y:40,opacity:0,scale:.94},{y:0,opacity:1,scale:1,duration:.45,ease:"back.out(1.8)"},it),j.querySelectorAll("[data-stat]").forEach((st,rt)=>{const ot=st.querySelector("[data-val]"),At=st.querySelector("[data-up]"),Tt=Number(ot.dataset.from),Ft=Number(ot.dataset.to),Bt={v:Tt};let D=Tt;Kt.to(Bt,{v:Ft,duration:.8,ease:"power2.out",onUpdate:()=>{const Qt=Math.round(Bt.v);ot.textContent=String(Qt),Math.abs(Qt-D)>=Math.max(1,(Ft-Tt)/8)&&(D=Qt,k.sfx.tick())}},it+.3+rt*.15),At&&Kt.fromTo(At,{scale:0,y:8,opacity:0},{scale:1,y:0,opacity:1,duration:.45,ease:"back.out(3)"},it+.9+rt*.15)})),Kt.call(()=>{B(!0),k.revealSettled()}),()=>{Kt.kill()}},[v,G]);const et=oe.useCallback(()=>{var j;const k=T.current;if(!k||!k.beginClaim())return;const lt=i.current,Lt=lt.getBoundingClientRect(),mt=[],Ot={coin:{el:p.current,pill:_.current,v:r.balances.coin.value},gem:{el:M.current,pill:m.current,v:r.balances.gem.value}},Kt=Array.from(((j=d.current)==null?void 0:j.querySelectorAll("[data-card]"))??[]);r.rewards.forEach((it,st)=>{var D,Qt;if(!it.flyTo||!it.amount)return;const rt=Ot[it.flyTo],ot=(D=Kt[st])==null?void 0:D.getBoundingClientRect(),At=(Qt=rt.pill)==null?void 0:Qt.getBoundingClientRect();if(!ot||!At)return;const Tt=Math.max(4,Math.min(12,Math.round(it.amount/15))),Ft=it.amount/Tt;let Bt=0;for(let Gt=0;Gt<Tt;Gt++){const C=document.createElement("img");C.src=qo(it.flyTo==="coin"?"coin":"gem",30),C.className=qt.flyer,lt.appendChild(C);const S=ot.left-Lt.left+ot.width/2+ce.utils.random(-18,18),O=ot.top-Lt.top+ot.height/2+ce.utils.random(-14,14),W=At.left-Lt.left+16,Z=At.top-Lt.top+At.height/2,ht=S+ce.utils.random(-120,120),dt=O+ce.utils.random(-40,60),$=W-40,nt=Z+160,pt={t:0};mt.push(new Promise(It=>{ce.to(pt,{t:1,duration:.75,delay:.12+st*.25+Gt*.07,ease:"power1.in",onUpdate:()=>{const ct=pt.t,ut=1-ct,Nt=ut*ut*ut*S+3*ut*ut*ct*ht+3*ut*ct*ct*$+ct*ct*ct*W,kt=ut*ut*ut*O+3*ut*ut*ct*dt+3*ut*ct*ct*nt+ct*ct*ct*Z;C.style.transform=`translate(${Nt-15}px, ${kt-15}px) scale(${1-.35*ct}) rotate(${ct*540}deg)`},onComplete:()=>{C.remove(),Bt+=1,rt.v+=Bt===Tt?it.amount-Ft*(Tt-1):Ft,rt.el&&(rt.el.textContent=Math.round(rt.v).toLocaleString()),rt.pill&&ce.fromTo(rt.pill,{scale:1.28},{scale:1,duration:.45,ease:"elastic.out(1.3, 0.4)",overwrite:!0}),k.sfx.coin(),It()}})}))}}),ce.to(Kt,{scale:.8,opacity:0,y:30,duration:.35,delay:mt.length?.6:.05,stagger:.05,ease:"power2.in"}),Promise.all(mt).then(()=>ce.delayedCall(.45,()=>k.finish()))},[r]),Y=oe.useCallback(()=>{var k;return(k=T.current)==null?void 0:k.tap()},[]);oe.useEffect(()=>{const k=lt=>{var Lt,mt,Ot;lt.key===" "||lt.key==="Enter"?(lt.preventDefault(),((Lt=T.current)==null?void 0:Lt.phase)==="settle"?et():(mt=T.current)==null||mt.tap()):lt.key==="Escape"&&((Ot=T.current)==null||Ot.skip())};return window.addEventListener("keydown",k),()=>window.removeEventListener("keydown",k)},[et]);const J=Yn[E],Q=!v,bt=Q?((Ht=r.titles)==null?void 0:Ht[E])??`${Yo[r.subject]} · ${J.name}`:r.revealTitle,xt=r.rewards[N]??r.rewards[0],Zt=x==="idle"||x==="upgrading"||x==="charging"||x==="bursting";return Ld.createPortal(Rt.jsxs("div",{ref:i,className:qt.root,"data-phase":x,"data-top":G?"1":void 0,"data-reduce":X?"1":void 0,role:"dialog","aria-modal":"true","aria-label":`${Yo[r.subject]}：${bt}`,style:{"--grade-name":`"${J.name}"`},children:[Rt.jsxs("div",{ref:s,className:qt.world,onPointerDown:Y,children:[Rt.jsx("div",{className:qt.bg}),Rt.jsxs("div",{className:qt.rays,"aria-hidden":!0,children:[Rt.jsx("i",{}),Rt.jsx("i",{}),Rt.jsx("i",{})]}),Rt.jsx("div",{ref:f,className:qt.curtain,"aria-hidden":!0,children:Rt.jsx("i",{})}),Rt.jsx("div",{ref:h,className:qt.backGlow,"aria-hidden":!0}),Rt.jsxs("div",{ref:u,className:qt.beams,"aria-hidden":!0,children:[[-42,-28,-14,0,14,28,42].map((k,lt)=>Rt.jsx("i",{style:{"--a":`${k}deg`,"--i":lt}},k)),Rt.jsx("b",{})]}),Rt.jsx("div",{ref:c,className:qt.shadow,"aria-hidden":!0}),Rt.jsx("canvas",{ref:a,className:qt.gl,"aria-hidden":!0}),Rt.jsx("canvas",{ref:o,className:qt.fx,"aria-hidden":!0}),Rt.jsx("div",{ref:l,className:qt.flash,"aria-hidden":!0})]}),Rt.jsxs("header",{className:qt.hud,children:[e?Rt.jsx("div",{className:qt.modes,role:"tablist",children:e.map(k=>Rt.jsx("button",{type:"button",role:"tab","aria-selected":k.value===r.subject,className:qt.mode,onClick:()=>n==null?void 0:n(k.value),children:k.label},k.value))}):Rt.jsx("span",{className:qt.tag,children:Yo[r.subject]}),Rt.jsxs("div",{className:qt.balances,children:[Rt.jsxs("div",{ref:_,className:qt.pill,title:r.balances.coin.label,children:[Rt.jsx("img",{src:qo("coin",22),alt:""}),Rt.jsx("span",{ref:p,children:r.balances.coin.value.toLocaleString()})]}),Rt.jsxs("div",{ref:m,className:qt.pill,title:r.balances.gem.label,children:[Rt.jsx("img",{src:qo("gem",22),alt:""}),Rt.jsx("span",{ref:M,children:r.balances.gem.value.toLocaleString()})]}),Rt.jsx("button",{type:"button",className:qt.mute,"aria-pressed":R,"aria-label":R?"開聲":"靜音",onClick:()=>P(Dd()),children:Rt.jsx("span",{className:R?qt.muteOff:void 0,children:"♪"})})]})]}),Rt.jsxs("div",{className:qt.titleWrap,children:[Rt.jsxs("div",{className:qt.titleRow,children:[Rt.jsx(Ay,{text:bt,gradeKey:Q?`g${E}`:"reveal"}),!Q&&r.seal&&tu(r.seal)&&Rt.jsx("img",{className:qt.seal,src:tu(r.seal),alt:Id(r.seal)})]}),!Q&&r.revealSub&&Rt.jsx("p",{className:qt.sub,children:r.revealSub}),Q&&((ie=r.titles)==null?void 0:ie[E])&&Rt.jsx("p",{className:qt.gradeTag,children:J.name})]}),x==="idle"&&Rt.jsx("p",{className:qt.hint,"aria-live":"polite",children:"點擊"}),Zt&&Rt.jsx("button",{type:"button",className:qt.skip,onClick:()=>{var k;return(k=T.current)==null?void 0:k.skip()},children:"跳過 ›"}),v&&Rt.jsxs("div",{className:qt.reveal,children:[xt&&Rt.jsxs("div",{ref:g,className:qt.panel,style:{"--pc":Yn[xt.grade].main},children:[Rt.jsx(Ph,{card:xt,size:78}),Rt.jsxs("div",{className:qt.panelBody,children:[Rt.jsx("p",{className:qt.panelName,children:xt.name}),Rt.jsx("p",{className:qt.panelGrade,children:Yn[xt.grade].name}),xt.blurb&&Rt.jsx("p",{className:qt.blurb,children:xt.blurb}),(K=xt.stats)==null?void 0:K.map(k=>Rt.jsxs("div",{className:qt.stat,"data-stat":!0,children:[Rt.jsx("span",{children:k.label}),Rt.jsx("b",{"data-val":!0,"data-from":k.from,"data-to":k.to,children:L?k.to:k.from}),k.to>k.from&&Rt.jsxs("em",{"data-up":!0,className:qt.up,style:L?{opacity:1}:void 0,children:["▲+",k.to-k.from]})]},k.label))]})]}),Rt.jsx("div",{ref:d,className:qt.cards,children:r.rewards.map((k,lt)=>Rt.jsxs("button",{type:"button","data-card":!0,className:qt.card,"data-inlay":Yn[k.grade].inlay,"data-shine":k.grade>=2?"1":void 0,"aria-pressed":lt===N,style:{"--cc":Yn[k.grade].main,"--cg":Yn[k.grade].glow},onClick:()=>z(lt),children:[Yn[k.grade].inlay!=="plain"&&Rt.jsxs(Rt.Fragment,{children:[Rt.jsx("i",{className:qt.inlay,"data-pos":"tl"}),Rt.jsx("i",{className:qt.inlay,"data-pos":"br"})]}),Rt.jsx(Ph,{card:k,size:64}),Rt.jsx("span",{className:qt.cardName,children:k.name}),k.amount?Rt.jsx("span",{className:qt.amount,"data-amount":k.amount,children:"×0"}):null,k.isNew&&Rt.jsx("span",{className:qt.newBadge,"data-new":!0,"aria-label":"新",children:"新"})]},k.id))}),Rt.jsx("button",{type:"button",className:qt.claim,disabled:x!=="settle",onClick:et,children:"領取"})]})]}),document.body)}export{Ly as default};
