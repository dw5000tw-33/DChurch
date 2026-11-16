const H={ 'Access-Control-Allow-Origin':'https://dw5000tw-33.github.io','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'3600','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
const fail=(msg,status=400)=>new Response(JSON.stringify({ok:false,error:msg}),{status,headers:{...H,'Content-Type':'application/json;charset=utf-8'}});
export default {async fetch(request,env){
 const origin=request.headers.get('Origin');
 if(origin!=='https://dw5000tw-33.github.io')return fail('origin_forbidden',403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:H});
 const path=new URL(request.url).pathname;
 if(path!=='/api/read-request' && path!=='/api/read-status')return fail('not_found',404);
 if(request.method!== (path==='/api/read-request'?'POST':'GET'))return fail('method_not_allowed',405);
 const auth=request.headers.get('Authorization')||'';
 if(!auth.startsWith('Bearer ')||auth.length<20)return fail('admin_token_required',401);
 const upstream=new Request('https://thll-remote-ping-test.dw5000-tw.workers.dev'+path,{method:request.method,headers:{Authorization:auth},redirect:'manual'});
 try{
   const response=await env.REMOTE.fetch(upstream);
   const headers=new Headers(response.headers);
   for(const [key,value] of Object.entries(H))headers.set(key,value);
   headers.delete('set-cookie');
   return new Response(response.body,{status:response.status,headers});
 }catch(e){return fail('remote_backend_unavailable',502)}
}};
