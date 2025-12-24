// admin.js — charge playlist, commentaires et analytics locaux
(async function(){
  const PW = '1234';
  const loginCard = document.getElementById('loginCard');
  const loginBtn = document.getElementById('loginBtn');
  const adminPw = document.getElementById('adminPw');
  const dashboard = document.getElementById('dashboard');
  const logoutBtn = document.getElementById('logoutBtn');
  const sessionInfo = document.getElementById('sessionInfo');

  // restore session
  const saved = localStorage.getItem('adminAuth');
  if(saved === '1'){
    loginCard.style.display='none';
    dashboard.style.display='block';
    logoutBtn.style.display='inline-block';
    sessionInfo.textContent = 'Session active';
    renderDashboard();
  }

  loginBtn.addEventListener('click', async ()=>{
    if(adminPw.value === PW){
      localStorage.setItem('adminAuth','1');
      loginCard.style.display='none';
      dashboard.style.display='block';
      logoutBtn.style.display='inline-block';
      sessionInfo.textContent = 'Session active';
      await renderDashboard();
    } else {
      alert('Mot de passe incorrect');
    }
  });

  logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem('adminAuth');
    loginCard.style.display='block';
    dashboard.style.display='none';
    logoutBtn.style.display='none';
    sessionInfo.textContent = '';
  });

  async function fetchJson(path){
    try{
      const r = await fetch(path);
      return await r.json();
    }catch(e){
      return null;
    }
  }

  function mergeReviews(remote, local){
    const out = {};
    if(remote && remote.reviews){
      Object.assign(out, remote.reviews);
    }
    if(local){
      for(const k of Object.keys(local)){
        out[k] = (out[k]||[]).concat(local[k]);
      }
    }
    return out;
  }

  function formatTimeSec(s){
    if(!s && s!==0) return '-';
    s = Math.round(s);
    const m = Math.floor(s/60);
    const sec = s%60;
    return `${m}:${String(sec).padStart(2,'0')}`;
  }

  async function renderDashboard(){
    const cfg = await fetchJson('config.json');
    const remoteReviews = await fetchJson('reviews.json');
    let localReviews = {};
    try{ localReviews = JSON.parse(localStorage.getItem('musicReviews')||'{}'); }catch(e){}
    const reviews = mergeReviews(remoteReviews, localReviews);

    // analytics shape expected in localStorage: musicAnalytics
    // { plays: { trackId: { count, totalTimeSeconds, devices: {deviceId:{count,totalTime}} } }, devices: {deviceId:{ua,lastSeen}} , likes: {trackId:count} }
    let analytics = {};
    try{ analytics = JSON.parse(localStorage.getItem('musicAnalytics')||'{}'); }catch(e){ analytics = {}; }
    analytics.plays = analytics.plays || {};
    analytics.devices = analytics.devices || {};

    // Summary
    const totalTime = Object.values(analytics.plays).reduce((s, t)=> s + (t.totalTimeSeconds||0), 0);
    const totalPlays = Object.values(analytics.plays).reduce((s, t)=> s + (t.count||0), 0);
    const nDevices = Object.keys(analytics.devices).length;
    const nComments = Object.values(reviews).reduce((s, a)=> s + (a? a.length:0), 0);
    // likes removed — use comments instead per request

    const summaryEl = document.getElementById('summary');
    summaryEl.innerHTML = `
      <div><strong>Temps d'écoute total :</strong> ${formatTimeSec(totalTime)}</div>
      <div><strong>Nombre de lectures total :</strong> ${totalPlays}</div>
      <div><strong>Nombre d'appareils :</strong> ${nDevices}</div>
      <div><strong>Commentaires :</strong> ${nComments}</div>
    `;

    // Per-track table
    const perTrackEl = document.getElementById('perTrack');
    const rows = [];
    if(cfg && cfg.playlist){
      for(const t of cfg.playlist){
        const a = analytics.plays[t.id] || {};
        const plays = a.count||0;
        const tot = a.totalTimeSeconds||0;
        const avg = plays? Math.round(tot/plays): null;
        const devicesCount = a.devices? Object.keys(a.devices).length : 0;
        rows.push({id:t.id,title:t.title,tot,plays,avg,devicesCount});
      }
    }

    // find most listened
    const mostListened = rows.slice().sort((a,b)=> (b.tot||0)-(a.tot||0))[0];

    let tbl = `<table><thead><tr><th>Son</th><th>Temps total</th><th>Lectures</th><th>Temps moyen</th><th>Appareils</th></tr></thead><tbody>`;
    for(const r of rows){
      tbl += `<tr><td>${r.title}</td><td>${formatTimeSec(r.tot)}</td><td>${r.plays}</td><td>${r.avg? formatTimeSec(r.avg):'-'}</td><td>${r.devicesCount}</td></tr>`;
    }
    tbl += `</tbody></table>`;
    perTrackEl.innerHTML = tbl;

    // Add search/filter and export handlers
    const trackSearch = document.getElementById('trackSearch');
    const exportTracksBtn = document.getElementById('exportTracks');
    if(trackSearch){
      trackSearch.addEventListener('input', ()=>{
        const q = trackSearch.value.trim().toLowerCase();
        const rowsFiltered = rows.filter(r=> r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
        perTrackEl.innerHTML = renderTracksTable(rowsFiltered);
      });
    }
    if(exportTracksBtn){
      exportTracksBtn.addEventListener('click', ()=>{
        const csv = toCSV(rows, ['id','title','tot','plays','avg','devicesCount']);
        download('tracks.csv', csv);
      });
    }

    // Devices
    const devicesEl = document.getElementById('devices');
    if(Object.keys(analytics.devices).length===0){
      devicesEl.innerHTML = '<div class="muted">Aucun appareil enregistré localement (il faut instrumenter le suivi).</div>';
    } else {
      let dhtml = '<table><thead><tr><th>Appareil</th><th>Dernière connexion</th><th>Navigateur</th><th>Plateforme</th><th>Sons écoutés (count)</th></tr></thead><tbody>';
      for(const [id,info] of Object.entries(analytics.devices)){
        const listened = [];
        for(const [trackId,play] of Object.entries(analytics.plays||{})){
          if(play.devices && play.devices[id]) listened.push(`${play.devices[id].count} × ${trackId}`);
        }
        dhtml += `<tr><td>${id}</td><td>${info.lastSeen||'-'}</td><td title="${escapeHtml(info.ua||'')}">${escapeHtml(info.browser||info.ua||'-')}</td><td>${escapeHtml(info.platform||'-')}</td><td>${listened.join(', ')||'-'}</td></tr>`;
      }
      dhtml += '</tbody></table>';
      devicesEl.innerHTML = dhtml;
    }

    // Collected events / IPs (from localStorage if no server)
    const collected = JSON.parse(localStorage.getItem('collectedEvents')||'[]');
    const ipsSection = document.createElement('div');
    ipsSection.className = 'card';
    ipsSection.innerHTML = '<h3>Appareils / IPs connectés</h3>';
    if(collected.length===0){
      ipsSection.innerHTML += '<div class="muted">Aucun événement collecté localement.</div>';
    } else {
      // group by ip (or deviceId)
      const byIp = {};
      collected.forEach(ev=>{
        const key = ev.ip || ev.deviceId || 'unknown';
        byIp[key] = byIp[key] || {events:[], deviceIds: new Set()};
        byIp[key].events.push(ev);
        if(ev.deviceId) byIp[key].deviceIds.add(ev.deviceId);
      });
      let html = '<table><thead><tr><th>IP / Device</th><th>Dernier événement</th><th>Devices</th><th>#Evts</th><th>Zone</th></tr></thead><tbody>';
      const zones = JSON.parse(localStorage.getItem('deviceZones')||'{}');
      for(const [ip,info] of Object.entries(byIp)){
        const last = info.events[info.events.length-1];
        const devices = Array.from(info.deviceIds).join(', ');
        const zone = zones[Array.from(info.deviceIds)[0]] || '';
        html += `<tr><td>${escapeHtml(ip)}</td><td>${escapeHtml(last.ts||'')}</td><td>${escapeHtml(devices||'-')}</td><td>${info.events.length}</td><td><input data-ip="${escapeHtml(ip)}" class="zone-input" value="${escapeHtml(zone)}" placeholder="zone"/></td></tr>`;
      }
      html += '</tbody></table>';
      ipsSection.innerHTML += html;
      // save zone handlers
      setTimeout(()=>{
        document.querySelectorAll('.zone-input').forEach(inp=>{
          inp.addEventListener('change', ()=>{
            const ip = inp.dataset.ip;
            // assign zone to all deviceIds belonging to this IP
            const events = collected.filter(e=> (e.ip||e.deviceId||'') === ip || e.ip === ip);
            const dz = JSON.parse(localStorage.getItem('deviceZones')||'{}');
            events.forEach(ev=>{ if(ev.deviceId) dz[ev.deviceId]=inp.value; });
            localStorage.setItem('deviceZones', JSON.stringify(dz));
            alert('Zone enregistrée localement');
          });
        });
      },50);
    }
    document.getElementById('devices').parentElement.appendChild(ipsSection);

    // Comments
    const commentsEl = document.getElementById('comments');
    const allComments = [];
    for(const [trackId,arr] of Object.entries(reviews||{})){
      (arr||[]).forEach(c=> allComments.push({trackId, text:c.text||c, date:c.date||''}))
    }
    if(allComments.length===0){
      commentsEl.innerHTML = '<div class="muted">Aucun commentaire trouvé.</div>';
    } else {
      commentsEl.innerHTML = allComments.map(c=> `<div class="card"><strong>${c.trackId}</strong> <span class="muted">${c.date||''}</span><div>${escapeHtml(c.text)}</div></div>`).join('');
    }

    // export comments
    const exportCommentsBtn = document.getElementById('exportComments');
    if(exportCommentsBtn){
      exportCommentsBtn.addEventListener('click', ()=>{
        const csv = toCSV(allComments, ['trackId','date','text']);
        download('comments.csv', csv);
      });
    }

    // Top metrics
    const topNotice = document.createElement('div');
    topNotice.className = 'muted';
    topNotice.style.marginTop = '8px';
    topNotice.innerHTML = `
      <div><strong>Son le plus écouté :</strong> ${mostListened? mostListened.title : '-'} </div>
    `;
    perTrackEl.parentElement.insertBefore(topNotice, perTrackEl.parentElement.firstChild);
  }

  function renderTracksTable(rows){
    let tbl = `<table><thead><tr><th>Son</th><th>Temps total</th><th>Lectures</th><th>Temps moyen</th><th>Appareils</th></tr></thead><tbody>`;
    for(const r of rows){
      tbl += `<tr><td>${r.title}</td><td>${formatTimeSec(r.tot)}</td><td>${r.plays}</td><td>${r.avg? formatTimeSec(r.avg):'-'}</td><td>${r.devicesCount}</td></tr>`;
    }
    tbl += `</tbody></table>`;
    return tbl;
  }

  function toCSV(arr, fields){
    const esc = v => '"'+String(v||'').replace(/"/g,'""')+'"';
    const header = fields.join(',')+"\n";
    const rows = arr.map(o => fields.map(f=>esc(o[f])).join(',')).join('\n');
    return header + rows;
  }

  function download(name, content){
    const blob = new Blob([content], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }

  function escapeHtml(s){
    if(!s) return '';
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

})();
