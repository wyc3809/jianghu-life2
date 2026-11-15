import {afterEach,expect,it,vi} from 'vitest';
const config=vi.hoisted(()=>({expiry:1}));
vi.mock('../src/cloud/cloud',()=>({cloudAccess:async()=>({url:'https://test.invalid',key:'test-public',token:'header.'+btoa(JSON.stringify({sub:'test-user',exp:config.expiry}))+'.signature'})}));
vi.mock('../src/cloud/sync',()=>({saveProfileForOnline:async()=>true}));
vi.mock('../src/store/lifeStore',()=>({useLifeStore:{getState:()=>({state:{}})}}));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.resetModules();config.expiry=1;});
it('test_organizations_限頻及身份續期_同帳戶重試沿用ID',async()=>{
 const saved=new Map<string,string>(),ids:string[]=[];let count=0;
 vi.stubGlobal('sessionStorage',{getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v),removeItem:(k:string)=>saved.delete(k)});
 vi.spyOn(crypto,'randomUUID').mockImplementation(()=>`00000000-0000-4000-8000-${String(++count).padStart(12,'0')}`);
 vi.stubGlobal('fetch',async(_u:string,init:RequestInit)=>{ids.push(JSON.parse(init.body as string).requestId);return new Response(JSON.stringify(ids.length===1?{error:'請稍候再發言。'}:{ok:true}),{status:ids.length===1?429:200});});
 const {organizationRequest}=await import('../src/cloud/organizations');const data={kind:'guild',group:'group',body:'聚義堂見。'};
 await expect(organizationRequest('send',data)).rejects.toMatchObject({status:429});config.expiry=2;
 await organizationRequest('send',data);expect(new Set(ids).size).toBe(1);expect(saved.size).toBe(0);
});
