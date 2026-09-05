export const FREE_MODEL='@cf/meta/llama-3.2-11b-vision-instruct';

export function readConfig(env){
  const enabled=env.PHOTO_AI_ENABLED==='true';
  const origins=String(env.PHOTO_AI_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean);
  const config={enabled,origins,projectId:env.FIREBASE_PROJECT_ID,model:env.PHOTO_AI_MODEL,freeOnly:env.PHOTO_AI_FREE_ONLY==='true',revocationMode:env.PHOTO_AI_AUTH_REVOCATION_MODE,production:env.NODE_ENV==='production',timeoutMs:Number(env.PHOTO_AI_TIMEOUT_MS||40000),observability:env.PHOTO_AI_OBSERVABILITY==='true',uids:String(env.PHOTO_AI_UIDS||'').split(',').map(value=>value.trim()).filter(Boolean)};
  if(!config.freeOnly)throw Error('PHOTO-AI requer modo FREE-ONLY ativo.');
  if(env.OPENAI_API_KEY||env.PHOTO_AI_PROVIDER_URL||env.PHOTO_AI_EXTERNAL_PROVIDER_URL)throw Error('Fornecedor externo não permitido no modo FREE-ONLY.');
  if(config.model!==FREE_MODEL)throw Error('Modelo Workers AI não autorizado.');
  if(!Number.isFinite(config.timeoutMs)||config.timeoutMs<10||config.timeoutMs>45000)throw Error('Timeout PHOTO-AI inválido.');
  if(enabled&&(!config.projectId||!origins.length||!config.uids.length))throw Error('Configuração PHOTO-AI incompleta.');
  if(enabled&&config.revocationMode!=='signature-only')throw Error('Modo de revogação PHOTO-AI inválido.');
  if(enabled&&config.production&&config.revocationMode==='signature-only')throw Error('Produção requer verificação de revogação Firebase.');
  return config;
}
