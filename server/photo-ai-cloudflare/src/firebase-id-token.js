const KEY_URL='https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let keyCache={keys:new Map(),expiresAt:0};
const encoder=new TextEncoder();
function fail(message='Sessão inválida.'){return Object.assign(new Error(message),{status:401});}
function decodePart(value){
  if(typeof value!=='string'||!/^[A-Za-z0-9_-]+$/.test(value))throw fail();
  const base64=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');
  try{return Uint8Array.from(atob(base64),char=>char.charCodeAt(0));}catch{throw fail();}
}
function jsonPart(value){try{return JSON.parse(new TextDecoder().decode(decodePart(value)));}catch{throw fail();}}
function maxAge(headers){const match=/max-age=(\d+)/i.exec(headers.get('cache-control')||'');return match?Math.min(Number(match[1])*1000,24*60*60*1000):0;}
async function refreshKeys(fetchImpl){
  const response=await fetchImpl(KEY_URL,{headers:{Accept:'application/json'}});
  if(!response.ok)throw fail('Não foi possível validar a sessão.');
  const document=await response.json(), keys=new Map();
  for(const jwk of document?.keys||[]){if(jwk?.kid&&jwk.kty==='RSA'&&jwk.alg==='RS256')keys.set(jwk.kid,await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']));}
  const ttl=maxAge(response.headers);if(!ttl||!keys.size)throw fail('Não foi possível validar a sessão.');
  keyCache={keys,expiresAt:Date.now()+ttl};return keys;
}
async function publicKey(kid,fetchImpl){
  let keys=keyCache.expiresAt>Date.now()?keyCache.keys:await refreshKeys(fetchImpl);
  if(!keys.has(kid))keys=await refreshKeys(fetchImpl);
  const key=keys.get(kid);if(!key)throw fail();return key;
}
export function resetKeyCache(){keyCache={keys:new Map(),expiresAt:0};}
export async function verifyFirebaseIdToken(token,{projectId,fetchImpl=fetch,now=Date.now()}={}){
  const parts=String(token||'').split('.');if(parts.length!==3||!projectId)throw fail();
  const header=jsonPart(parts[0]), payload=jsonPart(parts[1]);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||!header.kid)throw fail();
  const signature=decodePart(parts[2]);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',await publicKey(header.kid,fetchImpl),signature,encoder.encode(parts[0]+'.'+parts[1])))throw fail();
  const seconds=Math.floor(now/1000);
  if(payload.aud!==projectId||payload.iss!==`https://securetoken.google.com/${projectId}`||typeof payload.exp!=='number'||payload.exp<=seconds||typeof payload.iat!=='number'||payload.iat>seconds||typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128)throw fail();
  return {uid:payload.sub};
}
