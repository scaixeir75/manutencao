# PHOTO-AI-004-FREE — backend Cloudflare local

## Estado

Implementação local, sem conta, login, deploy, licença Meta aceite ou inferência Workers AI. O frontend mantém `window.PMP_PHOTO_AI.enabled=false` e endpoint vazio. Não há chamada OpenAI, chave API, cartão, plano pago ou fotografia real neste trabalho.

## Arquitetura

`GitHub Pages → Worker POST /v1/photo-ai/analyze → validação JWT Firebase → allowlist UID → Durable Object SQLite → Workers AI → contrato JSON → preview editável → confirmação humana`.

O Worker não tem permissões Firebase Database/Storage e só devolve um resultado validado. A app existente decide e grava apenas após confirmação humana. A fotografia existe no browser até análise, erro, cancelamento ou timeout; o Worker processa o corpo apenas durante o pedido e não usa R2, KV, D1 ou Durable Object para imagem, Base64, texto da folha ou resultado.

## FREE-ONLY

`PHOTO_AI_FREE_ONLY=true` é obrigatório. O arranque falha se existir `OPENAI_API_KEY`, URL de fornecedor externo, modelo diferente de `@cf/meta/llama-3.2-11b-vision-instruct` ou configuração incompleta. Não existe fallback para OpenAI, API externa ou modelo pago. Falha de Workers AI/quota devolve erro controlado; nunca repete automaticamente.

O runtime não consegue provar o plano comercial escolhido na conta Cloudflare. A conta deve manter-se no plano Free e a verificação de deploy deve recusar qualquer configuração fora do modelo aprovado.

## Autenticação e autorização

O Worker valida JWT Firebase com Web Crypto e as chaves públicas Google: formato, `RS256`, `kid`, assinatura, `aud`, `iss`, `exp`, `iat` e `sub`. As chaves obedecem ao `Cache-Control` devolvido pelo endpoint oficial. O UID vem exclusivamente do `sub` validado e tem de constar em `PHOTO_AI_UIDS`, configurado fora do Git.

`PHOTO_AI_AUTH_REVOCATION_MODE=signature-only` é permitido apenas em staging/desenvolvimento. A revogação não pode ser determinada a partir de um JWT sem consultar o backend Firebase autenticado. Por isso, `NODE_ENV=production` com este modo e análise ativada falha de forma segura. Uma futura implementação de revogação precisa de uma credencial segura para uma API Firebase/Admin; não incluir chave privada no Worker, no repositório ou no browser.

## Rate limit, logs e privacidade

O Durable Object é particionado pelo hash SHA-256 do UID. A SQLite guarda somente timestamps de pedidos e um lock opaco de 90 segundos: 1 pedido ativo, 5 por minuto e 50 por 24 horas. Erros do DO bloqueiam a análise. O lock é libertado em sucesso, erro, JSON inválido, timeout, abort e exceção.

Wrangler desativa `invocation_logs`. Não há logs aplicacionais por defeito; se `PHOTO_AI_OBSERVABILITY=true`, só é emitido `{requestId, uidHash, status, durationMs, reason}`. Nunca registar corpo, Base64, imagem, output, token ou cabeçalho Authorization.

Workers AI processa conteúdo como Customer Content. A documentação Cloudflare declara que não usa esse conteúdo para treinar ou melhorar os modelos sem consentimento explícito, mas isto não equivale a uma garantia de retenção zero. A licença Meta para o modelo permanece pendente e o primeiro teste será exclusivamente com folha sintética.

## Limites e próximos passos

O Worker aceita JPEG, PNG e WebP até 8 MiB descodificados e corpo JSON até 12 MiB. Não normaliza imagem no servidor; uma futura melhoria pode reduzir/comprimir no browser antes do envio e validar os 20 MP sem persistir a fotografia. O timeout interno é 40 segundos, inferior ao limite de 45 segundos do frontend.

Workers Free disponibiliza 100.000 pedidos/dia; Workers AI tem 10.000 neurons/dia. O consumo de uma imagem não pode ser previsto sem teste sintético, por isso o produto trata o erro de quota como final e amigável. Durable Objects Free usam SQLite e são adequados apenas a contadores/locks, nunca a payloads.

1. Criar ou usar uma conta Cloudflare Free, sem ativar plano pago.
2. Instalar/usar Wrangler e autenticar, sem segredos no repositório.
3. Criar bindings AI e Durable Object durante o deploy autorizado.
4. Aceitar a licença Meta manualmente, se aprovada.
5. Obter o UID Firebase de staging pela consola e definir `PHOTO_AI_UIDS` fora do Git.
6. Testar uma folha sintética, consumo de neurons, português, timeout e política de dados.
7. Resolver revogação Firebase antes de produção.

## Fontes

- [Firebase: verificar ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firebase: revogação de sessões](https://firebase.google.com/docs/auth/admin/manage-sessions)
- [Workers AI: modelo Vision](https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/)
- [Workers AI: dados](https://developers.cloudflare.com/workers-ai/platform/data-usage/)
- [Workers AI: pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Durable Objects: pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
