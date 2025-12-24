// Serverless collector: logs payloads and can forward to Discord webhook server-side
// Deploy under /api/collect. Forwards to Discord webhook to avoid CORS from browsers.
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1453369571909042238/NoeJHdPY6puZ4dynrEuF1NMtLNzDIjqTtQ9cwZkJluZq4_SbgsM9sV1_0aYvjlUo3T6E';

async function forwardToDiscord(body) {
  try{
    // build a markdown description with important fields as a list
    const ignored = new Set(['forwardToDiscord','payload']);
    const pairs = [];
    for (const k of Object.keys(body)) {
      if (['event','type','title','trackTitle'].includes(k)) continue;
      if (ignored.has(k)) continue;
      try{ pairs.push(`- **${k}**: ${typeof body[k] === 'object' ? JSON.stringify(body[k]) : String(body[k])}`); }catch(e){}
    }
    const description = (body.title || body.trackTitle || '') + '\n\n' + pairs.join('\n');
    const embed = {
      title: body.event || body.type || 'Site event',
      description: description,
      timestamp: new Date().toISOString()
    };
    const payload = {embeds:[embed]};
    const r = await fetch(DISCORD_WEBHOOK, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    return r.ok;
  }catch(e){ console.error('forwardToDiscord error', e); return false; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).end('Method Not Allowed'); }
  try{
    const body = req.body || await new Promise(r=>{let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{ r(JSON.parse(d)); }catch(e){ r({}); } });});
    console.log('[/api/collect] payload:', JSON.stringify(body));
    // If client asked to forward to Discord, do it server-side to avoid CORS
    if (body.forwardToDiscord || body.type === 'webhook_forward' || body.event || body.type) {
      // decorate a bit
      const ok = await forwardToDiscord(body);
      return res.status(200).json({ok:true,forwarded:ok});
    }
    return res.status(200).json({ok:true});
  }catch(e){
    console.error('Error in /api/collect:', e);
    return res.status(500).json({ok:false,error:String(e)});
  }
}
