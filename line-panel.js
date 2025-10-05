/* line-panel.js | DChurch LIFF helper
   Usage: <script src="line-panel.js"></script>
   Provides: openInLINE(), shareInLINE(), addLINE() + a floating 3-button panel.
*/
(function(){
  const LIFF_ID = "2008232895-oOjpmYGX";   // ← your LIFF ID
  const OA_ID   = "@307momvl";             // ← your Official Account ID
  const OA_LINK = `https://line.me/R/ti/p/${encodeURIComponent(OA_ID)}`;

  // Inject LIFF SDK if not present
  const ensureLiff = () => new Promise((resolve) => {
    if (window.liff) return resolve();
    const s = document.createElement("script");
    s.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });

  const isLINE = /Line\/|LIFF|inapp=1/i.test(navigator.userAgent);
  const pageURL = location.href.split('#')[0];

  // Public helpers
  window.openInLINE = () => {
    if (isLINE) window.liff?.openWindow({ url: pageURL, external: false });
    else location.href = `https://liff.line.me/${LIFF_ID}?url=${encodeURIComponent(pageURL)}`;
  };

  window.shareInLINE = async () => {
    try {
      if (!window.liff) return alert("LIFF 尚未載入，請稍後再試。");
      if (!liff.isLoggedIn()) await liff.login();
      if (await liff.isApiAvailable('shareTargetPicker')) {
        await liff.shareTargetPicker([{ type: 'text', text: `👋 來看看這個互動頁：\n${pageURL}` }]);
      } else {
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageURL)}`, '_blank');
      }
    } catch (e) {
      alert('分享失敗，請再試一次或先登入 LINE。');
      console.error(e);
    }
  };

  window.addLINE = () => {
    if (isLINE && window.liff) liff.openWindow({ url: OA_LINK, external: false });
    else window.open(OA_LINK, '_blank');
  };

  // Floating panel
  const injectPanel = () => {
    if (document.getElementById('line-fab')) return; // once
    const style = document.createElement('style');
    style.textContent = `
      #line-fab{position:fixed;right:16px;bottom:16px;z-index:2147483647;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial}
      #line-fab .card{background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.15);padding:12px}
      #line-fab .row{display:flex;gap:8px}
      #line-fab button{border:0;border-radius:10px;padding:10px 12px;cursor:pointer;font-weight:600}
      #line-open{background:#06C755;color:#fff}
      #line-share{background:#f0f0f0}
      #line-add{background:#e8f9ef}
      #line-tip{font-size:12px;color:#666;margin-top:6px}
    `;
    document.head.appendChild(style);

    const box = document.createElement('div');
    box.id = 'line-fab';
    box.innerHTML = `
      <div class="card" role="region" aria-label="LINE actions">
        <div class="row">
          <button id="line-open" title="在 LINE 中開啟">在 LINE 打開</button>
          <button id="line-share" title="分享給好友">分享</button>
          <button id="line-add"  title="加好友">加好友</button>
        </div>
        <div id="line-tip"></div>
      </div>`;
    document.body.appendChild(box);

    const tip = document.getElementById('line-tip');
    tip.textContent = isLINE ? "已在 LINE 內瀏覽，可直接分享或聊天。" :
      "目前不在 LINE 內，點「在 LINE 打開」可跳進 LIFF。";

    document.getElementById('line-open').onclick = window.openInLINE;
    document.getElementById('line-share').onclick = window.shareInLINE;
    document.getElementById('line-add').onclick  = window.addLINE;
  };

  const init = async () => {
    injectPanel();
    await ensureLiff();
    try { await liff.init({ liffId: LIFF_ID }); }
    catch (e) { console.warn("liff.init error:", e); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();