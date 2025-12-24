// Vercel Serverless function to collect analytics
// Deploy under /api/collect on Vercel. Currently this function only logs payloads.
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = req.body || await new Promise(r=>{let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d)));});
      console.log('[/api/collect] payload:', JSON.stringify(body));
      // NOTE: Serverless functions are stateless. For persistent storage configure
      // a database (Supabase, Fauna, Vercel KV) and store payloads there.
      return res.status(200).json({ok:true});
    } catch (e) {
      console.error('Error in /api/collect:', e);
      return res.status(500).json({ok:false,error:String(e)});
    }
  }
  res.setHeader('Allow', 'POST');
  return res.status(405).end('Method Not Allowed');
}
