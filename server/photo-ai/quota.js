'use strict';
const {createHash,randomUUID}=require('node:crypto');
// Apenas contadores e identificadores derivados; nunca imagens ou texto extraído.
const acquireScript=`
if redis.call('EXISTS',KEYS[1])==1 then return 0 end
if tonumber(redis.call('GET',KEYS[2]) or '0')>=5 or tonumber(redis.call('GET',KEYS[3]) or '0')>=50 then return 0 end
redis.call('SET',KEYS[1],ARGV[1],'EX',90)
local m=redis.call('INCR',KEYS[2]); if m==1 then redis.call('EXPIRE',KEYS[2],60) end
local d=redis.call('INCR',KEYS[3]); if d==1 then redis.call('EXPIRE',KEYS[3],86400) end
return 1`;
const releaseScript="if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end";
function quota(redis){return async uid=>{
  const key='photo-ai:{'+createHash('sha256').update(uid).digest('hex')+'}';
  const token=randomUUID();
  if(!await redis.eval(acquireScript,{keys:[key+':active',key+':minute',key+':day'],arguments:[token]}))return null;
  return ()=>redis.eval(releaseScript,{keys:[key+':active'],arguments:[token]});
};}
module.exports={quota};
