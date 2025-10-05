/* line-panel-greek.js | DChurch LIFF helper (draggable + Greek theme)
   Usage: <script src="line-panel-greek.js"></script>
   Buttons: 在 LINE 打開 / 分享 / +好友 / 關閉
*/
(function(){
  const LIFF_ID = "2008232895-oOjpmYGX";   // your LIFF ID
  const OA_ID   = "@307momvl";             // your Official Account ID
  const OA_LINK = `https://line.me/R/ti/p/${encodeURIComponent(OA_ID)}`;

  // Theme (Greek): white card, blue outline, soft shadow, accent buttons
  const THEME = {
    blue: "#1F5FBF",     // Greek blue frame
    green: "#06C755",    // LINE green
    milk:  "#c9b9a6",    // milk-tea
    gray:  "#f1f3f5",    // light gray
    black: "#111111",    // black
    text:  "#0b1645",    // deep navy text
    white: "#ffffff"
  };

  // Inject style once
  const style = document.createElement('style');
  style.textContent = `
    #line-fab{position:fixed;right:16px;bottom:16px;z-index:2147483647;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial}
    #line-fab .card{background:${THEME.white};border-radius:16px;box-shadow:0 10px 26px rgba(0,0,0,.14);padding:10px;border:4px solid ${THEME.blue};min-width: 260px;touch-action:none}
    #line-fab .row{display:flex;gap:8px;flex-wrap:wrap}
    #line-fab button{border:0;border-radius:12px;padding:10px 12px;cursor:pointer;font-weight:700;flex:1 1 auto;min-width:96px;min-height:44px}
    #btn-open{background:${THEME.green};color:#fff}
    #btn-share{background:${THEME.milk};color:${THEME.black}}
    #btn-add{background:${THEME.gray};color:${THEME.black}}
    #btn-close{background:${THEME.black};color:#fff}
    #line-fab .title{font-weight:800;color:${THEME.text};font-size:14px;margin:0 0 8px 4px}
    #line-fab .drag-handle{cursor:move; user-select:none; display:flex; align-items:center; gap:8px; margin-bottom:8px}
    #line-fab .dots{width:22px; height:6px; background:linear-gradient(90deg, ${THEME.blue} 33%, transparent 0) 0 0/6px 6px repeat-x; border-radius:3px; opacity:.8}
    @media (max-width:480px){ #line-fab .card{min-width: 240px;} }
  `;
  document.head.appendChild(style);

  // Ensure LIFF SDK
  const ensureLiff = () => new Promise((resolve) => {
    if (window.liff) return resolve();
    const s = document.createElement("script");
    s.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });

  const isLINE = /Line\/|LIFF|inapp=1/i.test(navigator.userAgent);
  const pageURL = location.href.split('#')[0];

  // Exposed helpers
  window.openInLINE = () => {
    if (isLINE && window.liff) liff.openWindow({ url: pageURL, external:false });
    else location.href = `https://liff.line.me/${LIFF_ID}?url=${encodeURIComponent(pageURL)}`;
  };

  window.shareInLINE = async () => {
    try{
      if (!window.liff) return alert("LIFF 尚未載入，請稍後再試。");
      if (!liff.isLoggedIn()) await liff.login();
      if (await liff.isApiAvailable('shareTargetPicker')) {
        await liff.shareTargetPicker([{ type:'text', text:`👋 來看看這個互動頁：\n${pageURL}` }]);
      } else {
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageURL)}`, '_blank');
      }
    }catch(e){
      alert("分享失敗，請再試一次或先登入 LINE。");
      console.error(e);
    }
  };

  window.addLINE = () => {
    if (isLINE && window.liff) liff.openWindow({ url: OA_LINK, external:false });
    else window.open(OA_LINK, '_blank');
  };

  // Build panel
  const box = document.createElement('div');
  box.id = 'line-fab';
  box.innerHTML = `
    <div class="card" role="region" aria-label="LINE actions">
        <div class="drag-handle"><div class="dots" aria-hidden="true"></div>
        <div class="row">
        <button id="btn-open"  title="在 LINE 中開啟">在 LINE 打開</button>
        <button id="btn-share" title="分享給好友">分享</button>
        <button id="btn-add"   title="加好友">+ 好友</button>
        <button id="btn-close" title="關閉面板">關閉</button>
      </div>
    </div>`;
  document.body.appendChild(box);

  // Actions
  document.getElementById('btn-open').onclick  = window.openInLINE;
  document.getElementById('btn-share').onclick = window.shareInLINE;
  document.getElementById('btn-add').onclick   = window.addLINE;
  document.getElementById('btn-close').onclick = () => box.remove();

  // Dragging (touch + mouse) with localStorage memory
  (function enableDrag(){
    const el = box.querySelector('.card');
    const handle = box.querySelector('.drag-handle');
    let sx=0, sy=0, ox=0, oy=0, dragging=false;

    // Restore position
    const saved = localStorage.getItem("line_fab_pos");
    if(saved){
      try{
        const {x,y} = JSON.parse(saved);
        box.style.right = "auto";
        box.style.bottom = "auto";
        box.style.left = x+"px";
        box.style.top  = y+"px";
      }catch{}
    }

    const start = (e)=>{
      dragging = true;
      const p = (e.touches? e.touches[0]: e);
      sx = p.clientX; sy = p.clientY;
      const r = box.getBoundingClientRect();
      ox = r.left; oy = r.top;
      e.preventDefault();
    };
    const move = (e)=>{
      if(!dragging) return;
      const p = (e.touches? e.touches[0]: e);
      const nx = Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, ox + (p.clientX - sx)));
      const ny = Math.max(8, Math.min(window.innerHeight - el.offsetHeight - 8, oy + (p.clientY - sy)));
      box.style.left = nx+"px";
      box.style.top  = ny+"px";
      box.style.right = "auto";
      box.style.bottom = "auto";
    };
    const end = ()=>{
      if(!dragging) return;
      dragging = false;
      const r = box.getBoundingClientRect();
      localStorage.setItem("line_fab_pos", JSON.stringify({x:r.left, y:r.top}));
    };

    handle.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    handle.addEventListener('touchstart', start, {passive:false});
    window.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('touchend', end);
  })();

  // Initialize LIFF
  const init = async () => {
    if (!window.liff) await ensureLiff();
    try { await liff.init({ liffId: LIFF_ID }); }
    catch (e) { console.warn("liff.init error:", e); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
