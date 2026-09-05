# PHOTO-AI-002 — análise de folha executada

Data: 2026-09-05. Estado: implementação local com testes simulados; envio real desativado. Ver `PHOTO_AI_002_VALIDATION.md` para a auditoria e os resultados da retoma.

## Bloco 1/2 — arquitetura e contrato

### Estado de partida confirmado (PHOTO-AI-001)

- `main` local e `main` no GitHub apontam para `659ea4d7e715cb79f34ad4547e0fbe5fa7043062`, confirmado por `git ls-remote`. PHOTO-AI-001 já foi publicado.
- Frontend estático com Firebase Auth e Realtime Database; não existe backend no repositório.
- `setPhotoAiTemporaryFile` mantém File e Object URL na sessão. A extração continua manual.
- A ficha pré-selecionada é contexto do plano, não evidência extraída da fotografia.

### Proposta

Manter o frontend e acrescentar um serviço Node.js isolado em Cloud Run, usando o projeto Google existente se houver faturação e permissões adequadas. Esta é uma recomendação de implementação, não um recurso já provisionado. Não alterar regras nem caminhos de dados Firebase.

`Frontend → POST /v1/photo-ai/analyze → validar Firebase ID token e autorização → analisar imagem → validar JSON → preview editável → confirmação humana → fluxo de gravação existente`.

- Validar token com Firebase Admin, projeto fixo e verificação de revogação. Autorizar apenas UIDs configurados no servidor; não confundir utilizador autenticado com utilizador autorizado.
- CORS limitado à origem publicada e, em desenvolvimento, à origem local configurada. CORS não substitui autenticação.
- Chave do fornecedor apenas num secret do backend. Conta de serviço sem permissões de escrita em dados de manutenção ou Storage.
- Proposta de fornecedor: OpenAI Responses API com entrada de imagem e saída estruturada estrita. Modelo configurável apenas no servidor; escolher e fixar versão compatível após confirmar acesso da conta, retenção e qualidade em folhas representativas.
- `store: false`, sem Files API, conversas persistentes, processamento em background ou ferramentas externas. Isto não constitui garantia de retenção zero do fornecedor.
- Regra acordada: a fotografia nunca é persistida pelo PMP e é descartada após análise, erro, cancelamento ou conclusão. O fornecedor deve usar a política mais restritiva disponível; `store:false` não equivale a retenção zero. Desenvolvimento e testes técnicos podem avançar com respostas simuladas. Testes externos limitados exigem política verificada; produção exige ZDR/equivalente verificado para a conta, endpoint e modelo.

### Contrato proposto

Pedido implementado: `{image: base64, mime, context: {fichaId, equipment, week}}`. Não transmitir histórico completo nesta primeira versão. Não aceitar URL de imagem fornecida pelo cliente.

Resposta: `schemaVersion: 1`, `fields` e `warnings`. Campos de `fields`: `date`, `equipment`, `work`, `status`, `notes`, `anomaly`.

Cada campo contém `{value, confidence, evidence, reason}`:

- `value`: texto ou `null`; datas ISO reais; estado apenas `Concluído`, `Pendente` ou `null`.
- `confidence`: `Reconhecido`, `Duvidoso` ou `Não confirmado`.
- `evidence`: excerto legível da folha ou `null`; nunca preenchido a partir do plano.
- `reason`: explicação curta da ambiguidade ou ausência de informação.

Schema estrito, todas as propriedades obrigatórias, sem propriedades adicionais. Ausência de evidência implica valor `null` e `Não confirmado`. Reconhecido significa legível, não aprovado. Divergência de equipamento gera aviso e exige revisão, sem mudar automaticamente a ficha. A data e a conclusão nunca são inferidas apenas pela semana planeada. Instruções escritas na imagem são conteúdo documental, nunca comandos para o sistema.

### Limites e ciclo da imagem

Limites iniciais propostos: uma imagem JPEG/PNG/WebP, até 8 MiB e 20 megapíxeis; validar assinatura e descodificação no servidor, além de MIME. Rejeitar formatos animados, SVG e dados inválidos. Limitar corpo HTTP antes de o carregar integralmente. Normalizar orientação e remover metadados antes de enviar ao fornecedor.

Timeout de análise: 45 segundos; um pedido ativo por utilizador; quota partilhada de 5 análises/minuto e 50/dia por UID, com contadores sem imagem ou texto. Não usar contadores apenas em memória como limite global entre instâncias. Erros 401/403/413/415/429/502/504 não podem preencher campos ou criar registos. Sem repetição automática de pedidos faturáveis.

Imagem apenas em memória no frontend e proxy; sem ficheiros temporários, logs de corpos, traces com conteúdo, cache, IndexedDB, localStorage, Realtime Database ou Storage. Resposta com `Cache-Control: no-store`. Rever o service worker para garantir que o endpoint nunca é colocado em cache.

Cancelar, substituir imagem, fechar modal, terminar sessão ou concluir deve abortar pedidos e revogar Object URL. Usar identificador de sessão para ignorar respostas tardias. Descartar buffers do proxy ao terminar; revogar referências não é promessa de apagamento físico instantâneo da RAM. Fotografias escolhidas da galeria continuam a existir no dispositivo de origem.

## Bloco 2/2 — implementação e aceitação

1. Criar proxy isolado e testes de autenticação, autorização, quotas, conteúdo inválido, timeout, recusa do modelo e JSON fora do contrato. Configuração ausente mantém análise desativada.
2. Integrar botão de análise explícito no preview existente. Não sobrescrever alterações manuais com respostas atrasadas. Exibir origem contextual da ficha separadamente de reconhecimento da imagem.
3. Preservar confirmação humana e os dois destinos exclusivos: Histórico direto OU Diário com espelho. Anomalia continua a exigir confirmação separada. Verificar repetição após falha parcial para evitar duplicados.
4. Testar com fornecedor simulado sem escritas Firebase: imagem legível, ilegível, campos em falta, conflito de ficha, anomalia, cancelamento, troca de imagem e logout. Validar desktop e 390 px.
5. Após configurar infraestrutura, segredo e condições de retenção, validar folhas reais com transcrição de referência humana. Testes simulados não demonstram qualidade multimodal real nem retenção do fornecedor.
6. Verificar diff e testes antes de commit/push. Só declarar concluído após integração e validação real. Não avançar para Registos Diários ou redesign mobile nesta fase.

### Dependências ainda não confirmadas

Conta de fornecedor e modelo disponível; política de retenção aplicável; faturação/permissões Cloud Run; lista de utilizadores autorizados; folhas reais para validação. Não foram enviadas fotografias nem criados recursos externos nesta auditoria.

### Fontes oficiais consultadas

- [Firebase — verificar ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [OpenAI — imagens](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI — saídas estruturadas](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI — retenção e controlos de dados](https://developers.openai.com/api/docs/guides/your-data)
- [Cloud Run — memória](https://docs.cloud.google.com/run/docs/configuring/services/memory-limits)
