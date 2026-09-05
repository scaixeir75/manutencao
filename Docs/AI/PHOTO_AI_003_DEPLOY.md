# PHOTO-AI-003 — guia para ativação futura

> **Arquitetura anterior — não usar enquanto `PHOTO_AI_FREE_ONLY=true` estiver ativo.** Este documento conserva a alternativa Cloud Run/OpenAI/Redis para referência histórica; a arquitetura em preparação é Cloudflare Workers AI + Durable Object, documentada em `PHOTO_AI_004_FREE.md`.

Este guia prepara uma ativação controlada. Não executar comandos em produção sem a autorização correspondente, valores confirmados e teste real aprovado. Os valores entre `<…>` são placeholders; não os substituir por segredos em Git, documentação, terminal partilhado ou frontend.

## Pré-condições e arquitetura

Escolha uma única arquitetura: Cloud Run com o contentor de `server/photo-ai`, Redis privado e Direct VPC egress. O projeto já contém o Dockerfile para esta opção; não preparar Firebase Functions, Cloudflare ou outro proxy paralelo.

O container escuta `PORT` (predefinição `8080`) e expõe apenas `POST /v1/photo-ai/analyze`. A autenticação da aplicação é Firebase ID token; Cloud Run pode permanecer público ao nível HTTP porque o handler recusa pedidos sem token Firebase válido e UID na allowlist. Restringir ingress e aplicar proteção de borda conforme as normas do projeto não substitui estas guardas.

Configuração Cloud Run recomendada, ajustável depois de teste controlado: região `<PMP_REGION>`, memória `1Gi`, CPU `1`, timeout do serviço `50s` para acomodar o limite interno de 45s, concorrência `1`, mínimo `0`, máximo `3`, service account `<PMP_PHOTO_AI_SERVICE_ACCOUNT>`. Não usar a conta Compute Engine predefinida.

Cloud Run usa a respetiva identidade de serviço com Application Default Credentials. Não incluir ficheiro JSON de service account na imagem, no repositório ou em Secret Manager. Dar apenas as permissões necessárias para verificar Firebase ID tokens e aceder aos segredos configurados. Não dar permissões para Realtime Database nem Firebase Storage: o proxy não precisa de ler ou escrever nesses serviços. A identidade Cloud Run e ADC são o método recomendado para aceder a APIs Google. [Cloud Run service identity](https://docs.cloud.google.com/run/docs/configuring/services/service-identity), [Firebase Admin Auth](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## Variáveis de ambiente

Usar [`.env.example`](../../server/photo-ai/.env.example) apenas como inventário. O código lê:

| Variável | Produção |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `8080` ou a porta atribuída por Cloud Run |
| `PHOTO_AI_ENABLED` | `true` apenas em staging/produção autorizada |
| `PHOTO_AI_RETENTION` | obrigatoriamente `zdr-verified` em produção |
| `PHOTO_AI_OBSERVABILITY` | `true` só após confirmar destino e política dos logs |
| `PHOTO_AI_ORIGINS` | lista CSV de origens HTTPS exatas, sem `*` |
| `PHOTO_AI_UIDS` | lista CSV de UIDs Firebase autorizados |
| `FIREBASE_PROJECT_ID` | `<PMP_GCP_PROJECT>` |
| `OPENAI_MODEL` | modelo aprovado com visão e Structured Outputs |
| `OPENAI_API_KEY` | injetada por Secret Manager |
| `REDIS_URL` | injetada por Secret Manager se incluir credenciais |

`PHOTO_AI_ENABLED=false`, endpoint frontend vazio ou configuração incompleta impedem qualquer envio. Em desenvolvimento, `limited-test-verified` só é aceite com `NODE_ENV=development`; deve usar imagem sintética. Em produção, qualquer valor de retenção diferente de `zdr-verified` impede o arranque.

## Sequência futura de staging

1. Escolher `<PMP_GCP_PROJECT>` e `<PMP_REGION>` e confirmar billing.
2. Ativar apenas as APIs necessárias: Cloud Run, Cloud Build, Artifact Registry, Secret Manager e Memorystore.
3. Criar ou selecionar `<PMP_PHOTO_AI_SERVICE_ACCOUNT>` com privilégio mínimo e sem chave descarregável.
4. Criar Redis privado `<PMP_REDIS_INSTANCE>` na VPC autorizada; configurar Direct VPC egress de Cloud Run.
5. Criar os segredos vazios sem escrever valores em comandos ou Git:

   ```powershell
   gcloud secrets create OPENAI_API_KEY --project=<PMP_GCP_PROJECT> --replication-policy=automatic
   gcloud secrets create PMP_REDIS_URL --project=<PMP_GCP_PROJECT> --replication-policy=automatic
   ```

6. Adicionar valores apenas por input seguro no terminal autorizado, nunca com argumento, histórico ou ficheiro versionado:

   ```powershell
   gcloud secrets versions add OPENAI_API_KEY --project=<PMP_GCP_PROJECT> --data-file=-
   gcloud secrets versions add PMP_REDIS_URL --project=<PMP_GCP_PROJECT> --data-file=-
   ```

7. Dar à identidade Cloud Run acesso de leitura apenas aos dois segredos; confirmar que o deployer pode `actAs` essa identidade.
8. Construir e publicar a imagem após rever o commit:

   ```powershell
   gcloud builds submit --project=<PMP_GCP_PROJECT> --tag <PMP_REGION>-docker.pkg.dev/<PMP_GCP_PROJECT>/<PMP_ARTIFACT_REPOSITORY>/<PMP_PHOTO_AI_SERVICE>
   ```

9. Fazer deploy em staging com os valores aprovados. Exemplo a completar, sem executar literalmente:

   ```powershell
   gcloud run deploy <PMP_PHOTO_AI_SERVICE> --project=<PMP_GCP_PROJECT> --region=<PMP_REGION> --image=<PMP_REGION>-docker.pkg.dev/<PMP_GCP_PROJECT>/<PMP_ARTIFACT_REPOSITORY>/<PMP_PHOTO_AI_SERVICE> --port=8080 --memory=1Gi --cpu=1 --timeout=50s --concurrency=1 --min-instances=0 --max-instances=3 --service-account=<PMP_PHOTO_AI_SERVICE_ACCOUNT> --network=<PMP_VPC_NETWORK> --subnet=<PMP_VPC_SUBNET> --vpc-egress=private-ranges-only --set-env-vars=NODE_ENV=production,PHOTO_AI_ENABLED=true,PHOTO_AI_RETENTION=zdr-verified,PHOTO_AI_OBSERVABILITY=false,FIREBASE_PROJECT_ID=<PMP_GCP_PROJECT>,PHOTO_AI_ORIGINS=https://<PMP_STAGING_ORIGIN>,PHOTO_AI_UIDS=<PMP_AUTHORIZED_UID_1>,OPENAI_MODEL=<PMP_APPROVED_OPENAI_MODEL> --set-secrets=OPENAI_API_KEY=OPENAI_API_KEY:latest,REDIS_URL=PMP_REDIS_URL:latest
   ```

10. Obter a URL HTTPS, configurar explicitamente `window.PMP_PHOTO_AI` apenas na configuração de staging e confirmar CORS exato.
11. Validar Firebase Auth com utilizador permitido e confirmar o token Bearer no backend.
12. Confirmar retenção/ZDR, ativar staging e testar uma folha fictícia antes de qualquer produção.

Cloud Run pode ligar a Memorystore por Direct VPC egress. Redis não deve ser público nem exposto ao browser. [Ligação Cloud Run a Redis](https://docs.cloud.google.com/memorystore/docs/redis/connect-redis-instance-cloud-run).

## Redis, CORS e observabilidade

Redis mantém o lock de uma análise por UID e contadores de 5/minuto e 50/24h. Se Redis não estiver disponível, a inicialização falha ou o pedido devolve erro: não existe fallback em memória em produção. `REDIS_URL` nunca é enviado ao frontend.

`PHOTO_AI_ORIGINS` aceita uma lista CSV exata. Produção deve incluir apenas origens HTTPS próprias; desenvolvimento pode usar `http://localhost:<porta>` numa configuração separada. Não usar `*`, wildcard ou regex permissiva.

Com `PHOTO_AI_OBSERVABILITY=true`, o proxy emite apenas `{requestId, uidHash, status, durationMs, reason}`. O UID é SHA-256; `reason` é uma categoria fixa. Nunca adicionar imagem, Base64, Data URL, texto reconhecido, Authorization, Firebase token, chave OpenAI, URL Redis, payload, stack trace ou objeto de erro ao logger. Confirmar também que o destino dos logs não captura request bodies.

## Retenção e decisão manual

`store:false` impede recuperação posterior da resposta pela Responses API; não é uma garantia de retenção zero. Não usar `PHOTO_AI_RETENTION=zdr-verified` até a equipa confirmar a política da organização, modelo e endpoint. A OpenAI documenta `store` e Structured Outputs em [Responses](https://developers.openai.com/api/reference/cli/resources/responses/methods/create).

- [ ] organização OpenAI identificada
- [ ] modelo identificado
- [ ] endpoint identificado
- [ ] política aplicável confirmada
- [ ] ZDR/equivalente confirmado
- [ ] confirmação registada no projeto
- [ ] teste real autorizado

## Teste mínimo de staging

Usar uma folha fictícia sem dados pessoais. Confirmar: folha legível; campo ausente; manuscrito difícil; equipamento divergente; anomalia; fotografia inclinada; fotografia cortada; resposta inválida; timeout; cancelamento; e prompt injection impresso. Em todos os casos, não gravar no PMP antes de confirmação humana e verificar que a imagem foi descartada.
