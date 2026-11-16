const SOURCES = {
  stream:{name:'荒漠甘泉',home:'https://www.fhl.net/stream/'},
  manna:{name:'每日天糧',home:'https://biblepro.app/cbook/ym-tw-mrtl/catalog.html'},
  bible:{name:'東海靈糧堂每日讀經',home:'https://win.thll.org.tw/Bible/'}
};
const h={'Content-Type':'application/json;charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'public,max-age=120'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:h});
const trim=s=>String(s||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
class Collector{constructor(){this.val=''}element(el){if(['P','DIV','H1','H2','H3','BR','LI','BLOCKQUOTE'].includes(el.tagName.toUpperCase()))this.val+='\n'}text(t){this.val+=t.text;if(t.lastInTextNode)this.val+=''}}
class Links{constructor(){this.all=[]}element(el){let href=el.getAttribute('href');if(!href)return;const x={href,text:''};this.all.push(x);el.onEndTag(()=>{});this.curr=x}text(t){if(this.curr)this.curr.text+=t.text}}
async function fetchText(url){let r=await fetch(url,{redirect:'follow',headers:{'Accept':'text/html','User-Agent':'Mozilla/5.0 (compatible; ChurchDailyShare/0.2)'},cf:{cacheTtl:120,cacheEverything:true}});if(!r.ok)throw Error('來源 HTTP '+r.status);const bytes=await r.arrayBuffer();if(bytes.byteLength>1200000)throw Error('來源頁面過大');let ct=r.headers.get('content-type')||'';let codec=/charset=([^;]+)/i.exec(ct)?.[1]||'utf-8';let text;try{text=new TextDecoder(codec).decode(bytes)}catch{text=new TextDecoder('utf-8').decode(bytes)}return {html:text,url:r.url}}
async function extract(html){
 const all={article:new Collector(),main:new Collector(),p:new Collector(),body:new Collector(),content:new Collector()};
 let rewriter=new HTMLRewriter().on('article',all.article).on('main',all.main).on('p',all.p).on('#content',all.content).on('body',all.body);
 await rewriter.transform(new Response(html,{headers:{'content-type':'text/html;charset=utf-8'}})).text();
 const ranked=[all.article,all.main,all.content,all.p,all.body].map(x=>trim(x.val)).filter(x=>x.length>40);
 return ranked.sort((a,b)=> b.length-a.length)[0]||'';
}
async function getLinks(html){let all=[];let curr=null;class Anchor{element(el){let href=el.getAttribute('href');if(!href)return;let item={href,text:''};all.push(item);el.onEndTag(()=>{});curr=item}text(t){if(curr)curr.text+=t.text}}
 await new HTMLRewriter().on('a',new Anchor()).transform(new Response(html,{headers:{'content-type':'text/html;charset=utf-8'}})).text();return all;
}
async function queryStream(mm,dd,date){
 const url='https://www.fhl.net/stream/'+mm+'/'+String(mm).padStart(2,'0')+String(dd).padStart(2,'0')+'.htm';
 const page=await fetchText(url);
 let body=await extract(page.html);
 body=body.replace(/&(?:nbsp|#160|#xA0);?/gi,' ').replace(/\u00a0/g,' ').replace(/聆聽朗讀/g,'');
 const footer=body.search(/版權所有|Copyright\s*2003|信望愛資訊中心\s*All Rights Reserved/i);
 if(footer>=0)body=body.slice(0,footer);
 body=body.replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').trim();
 let lines=body.split('\n');
 // The source has web-only metadata above the scripture.
 let author=lines.findIndex(line=>line.trim().startsWith('原作'));
 if(author>=0&&author<16)lines=lines.slice(author+1);
 else {
  let head=lines.findIndex(line=>line.includes('荒漠甘泉'));
  if(head>=0&&head<12)lines=lines.slice(head+1);
 }
 while(lines.length&&!lines[0].trim())lines.shift();
 // Stop at the web footer. Keep the article's closing attribution such as －選.
 lines=lines.filter(line=>!line.trim().startsWith('原作')&&!line.trim().startsWith('荒漠甘泉'));
 body=lines.join('\n').replace(/\n[ \t]*\n[ \t]*\n/g,'\n\n').trim();
 if(body.length<90||body.includes('&nbsp;')||body.includes('Copyright'))throw Error('荒漠甘泉正文擷取未通過');
 const text=mm+'月'+dd+'日\n'+body;
 return {source:'荒漠甘泉',date,title:'荒漠甘泉 '+mm+'月'+dd+'日',text,url:page.url,status:'full'};
}
async function queryManna(mm,dd,date){
 const path=String(mm).padStart(2,'0')+String(dd).padStart(2,'0')+'.html';
 const page=await fetchText('https://biblepro.app/cbook/ym-tw-mrtl/'+path);
 const holder=new Collector();
 const remove={element(el){el.remove()}};
 await new HTMLRewriter().on('script',remove).on('style',remove).on('button',remove).on('nav',remove).on('#settings',remove).on('#main_audio',remove).on('#main',holder).transform(new Response(page.html,{headers:{'content-type':'text/html;charset=utf-8'}})).text();
 let body=trim(holder.val).replace(/\u00a0/g,' ').replace(/&nbsp;/gi,' ');
 if(/navigator\.userAgent|localStorage\.getItem|function audioPlay|mainbox\.addEventListener|請選擇字體大小/.test(body))throw Error('抓取包含網站控制項，已停止複製');
 const lines=body.split('\n').map(x=>x.trim()).filter(Boolean);
 const rawTitle=lines.shift()||'';
 if(!rawTitle||lines.join('').length<70)throw Error('每日天糧正文不完整');
 const digits=['零','一','二','三','四','五','六','七','八','九'];
 const cn=n=>n<10?digits[n]:n===10?'十':n<20?'十'+digits[n-10]:n%10===0?digits[Math.floor(n/10)]+'十':digits[Math.floor(n/10)]+'十'+digits[n%10];
 const headline=cn(mm)+'月'+cn(dd)+'日 '+rawTitle;
 const text=headline+'\n\n'+lines.join('\n').trim();
 return {source:'每日天糧',date,title:rawTitle,text,url:page.url,status:'full'};
}
async function queryBible(mm,dd,date,env){
 const row=await env.READING_DB.prepare('SELECT chapters_json FROM daily_bible_source_cache WHERE reading_date=?').bind(date).first();
 if(!row)throw Error('原每日讀經系統尚無 '+date+' 的已核對章節');
 let chapters;
 try{chapters=JSON.parse(row.chapters_json)}catch{throw Error('讀經資料解析失敗')}
 if(!Array.isArray(chapters)||chapters.length!==4)throw Error('當日資料不是四章，暫停複製');
 const names={GEN:'創世記',EXO:'出埃及記',LEV:'利未記',NUM:'民數記',DEU:'申命記',JOS:'約書亞記',JDG:'士師記',RUT:'路得記','1SA':'撒母耳記上','2SA':'撒母耳記下','1KI':'列王紀上','2KI':'列王紀下',PSA:'詩篇',PRO:'箴言',ISA:'以賽亞書',JER:'耶利米書',MAT:'馬太福音',MRK:'馬可福音',LUK:'路加福音',JHN:'約翰福音',ACT:'使徒行傳',ROM:'羅馬書','1CO':'哥林多前書','2CO':'哥林多後書',GAL:'加拉太書,',EPH:'以弗所書',PHP:'腓立比書',COL:'歌羅西書','1TH':'帖撒羅尼迦前書','2TH':'帖撒羅尼迦後書','1TI':'提摩太前書','2TI':'提摩太後書',TIT:'提多書',PHM:'腓利門書',HEB:'希伯來書',JAS:'雅各書','1PE':'彼得前書','2PE':'彼得後書','1JN':'約翰一書','2JN':'約翰二書','3JN':'約翰三書',JUD:'猶大書',REV:'啟示錄'};
 const parsed=chapters.map(x=>({code:String(x.code),chapter:Number(x.chapter)}));
 if(parsed.some(x=>!names[x.code]||!Number.isInteger(x.chapter)||x.chapter<1||x.chapter>150))throw Error('經卷代碼或章數尚未列入核對，暫停複製');
 const groups=[];
 for(const x of parsed){const last=groups.at(-1);if(last&&last.code===x.code&&last.end+1===x.chapter)last.end=x.chapter;else groups.push({code:x.code,start:x.chapter,end:x.chapter})}
 const summary=groups.map(x=>names[x.code]+x.start+(x.start===x.end?'':'～'+x.end)+'章').join('，');
 const links=parsed.map(x=>'https://prs.app/zh-Hant/bible/'+x.code+'.'+x.chapter+'.cuvmpt');
 const displayDate=date.split('-').map(Number).join('/');
 const text=displayDate+'\n☑️方言禱告20～40分鐘\n☑️今日讀經（和合本）\n'+summary+'\n\n'+links.join('\n');
 return {source:'東海靈糧堂每日讀經',date,title:'每日讀經',text,url:'https://thll-priest-roster.dw5000-tw.workers.dev/#daily-bible',status:'full',verifiedFrom:'daily_bible_source_cache'};
}
export default{async fetch(request,env){
 const u=new URL(request.url);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
 if(u.pathname!=='/api/date')return json({ok:true,message:'DChurch daily-share public source adapter',usage:'/api/date?date=2026-11-16'});
 let date=u.searchParams.get('date')||'',m=/^(20\d\d)-(\d\d)-(\d\d)$/.exec(date);
 if(!m)return json({ok:false,error:'date must be YYYY-MM-DD'},400);
 let mm=+m[2],dd=+m[3];let dt=new Date(date+'T00:00:00Z');if(dt.getUTCFullYear()!==+m[1]||dt.getUTCMonth()+1!==mm||dt.getUTCDate()!==dd)return json({ok:false,error:'invalid calendar date'},400);
 const types=['stream','manna','bible'];
 let results=await Promise.allSettled([queryStream(mm,dd,date),queryManna(mm,dd,date),queryBible(mm,dd,date,env)]);
 return json({ok:true,date,results:results.map((r,i)=>r.status==='fulfilled'?{key:types[i],ok:true,post:r.value}:{key:types[i],ok:false,source:SOURCES[types[i]].name,url:SOURCES[types[i]].home,error:String(r.reason?.message||r.reason)})});
}};
