// These URLs address only the bound Durable Object; no external fetch is used.
export async function acquireRateLimit(stub){
  const response=await stub.fetch('https://rate-limiter.internal/acquire',{method:'POST'});
  if(response.status===429)return null;
  if(response.status!==200)throw Error('Rate limiter unavailable');
  const {token}=await response.json();
  if(typeof token!=='string'||!token||token.length>100)throw Error('Rate limiter unavailable');
  return token;
}
export async function releaseRateLimit(stub,token){
  const response=await stub.fetch('https://rate-limiter.internal/release',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});
  if(response.status!==204)throw Error('Rate limiter unavailable');
}
