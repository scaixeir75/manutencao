# PHOTO-AI-002 — retoma e validação local

Data: 2026-09-05. Sem commit, push, tag, deploy ou pedidos à OpenAI real.

## Estado herdado

Primeiros comandos: `git status --short`, `git diff --stat`, `git diff --check`. Foram encontrados `index.html` e `sw.js` modificados, e ficheiros novos de configuração, contrato, proxy, Docker e plano. A árvore de partida da retoma não estava limpa. Nada foi revertido.

Revistos: `.dockerignore`, `Docs/AI/PHOTO_AI_002_PLAN.md`, `photo-ai-config.js`, `photo-ai-contract.js`, `index.html`, `sw.js` e todos os ficheiros de `server/photo-ai`: `.env.example`, `Dockerfile`, `README.md`, `core.js`, `server.js`, `quota.js`, `package.json` e lockfile. Dependências instaladas: Firebase Admin 13.10.0, Redis 5.12.1, sharp 0.34.5; lockfile npm v3.

Já implementado: adaptador Responses com imagem e JSON estruturado, contrato partilhado, verificação Firebase ID token/revogação, autorização por UID, CORS, quotas Redis, flags de retenção, preview e botão de análise. Tudo estava sem validação automatizada PHOTO-AI.

Parcial: limpeza nos caminhos de erro, timeout durante autenticação/leitura da resposta, proteção de respostas tardias e repetição após gravação parcial. Por fazer: testes, atualização do plano com a regra de privacidade acordada e documentação de resultados.

## Trabalho completado

- Descarte imediato ao cancelar e no fim da análise, em sucesso ou erro. Falta de autenticação também descarta a imagem. Timeout cobre token, leitura do ficheiro, fetch e leitura JSON.
- Identidade de sessão impede resposta antiga de preencher nova folha ou eliminar a fotografia seguinte. Logout e saída da página limpam a sessão.
- Campos continuam editáveis após análise; dados sem evidência são rejeitados, campos incertos exigem motivo, ficha do plano permanece Não confirmado. Nenhum registo é criado pela análise.
- Confirmação humana mantém destinos exclusivos. Referências Firebase estáveis durante a sessão permitem repetir após erro incerto/resultado parcial sem gerar novas chaves. Histórico preserva `id`. Verificação de duplicado abrange Histórico e Diário. A proteção de repetição não é persistida e não sobrevive a recarregar a página: após uma falha, consultar o histórico antes de iniciar outra folha.
- Backend limita e valida imagem, descodifica com sharp, remove metadados, limita resposta do fornecedor, preserva UTF-8 e limpa buffers; erros públicos não devolvem detalhes internos. Timeout e cancelamento propagam AbortSignal.
- Adicionados testes de backend, browser e sintaxe, com comandos npm na raiz.

## Resultados

| Validação | Resultado |
| --- | --- |
| `node --test server/photo-ai/test/photo-ai.test.js` | 9 testes aprovados |
| `node node_modules/@playwright/test/cli.js test tests/photo-ai.spec.js --workers=1` | 19 testes aprovados |
| `npm.cmd run test:ai:backtest` | 1 teste Playwright, 15 casos simulados aprovados |
| `node scripts/check-syntax.js` | 9 scripts válidos, incluindo módulos/inline |
| `git diff --check` | Sem erros; avisos de conversão LF/CRLF do Git no Windows |
| Página completa e 390 px | Arranque/logout sem erros JS; painel sem overflow horizontal; captura móvel inspecionada |

O `npm.cmd` invocado por nome neste ambiente aponta para uma instalação incompleta. Foi usado o executável funcional `C:\Program Files\nodejs\npm.cmd` para o backtest, sem modificar o sistema.

Cobertura exigida: fotografia válida e resposta completa; campos em falta; campos duvidosos; resposta inválida/recusada; erro de rede; timeout; cancelamento; resposta tardia; tamanho/tipo inválidos; utilizador sem sessão; quota atingida; descarte nos caminhos anteriores; confirmação humana e exclusividade Histórico/Diário. Adicionalmente: falha parcial, logout, saída da página, MIME falso, excesso de píxeis, remoção de metadados e configuração de retenção.

## Privacidade e limites da validação

A fotografia PHOTO-AI nunca é enviada para `pendingPhotos`, Realtime Database ou Storage, não é associada aos registos e não é escrita em disco pelo proxy. A fotografia original na galeria não é apagada. Testes e captura visual usam imagens sintéticas. Não se afirma apagamento físico instantâneo da memória gerida pelo browser/runtime.

`store:false` e `background:false` são obrigatórios no adaptador. A flag `zdr-verified` é uma declaração operacional após verificação e não ativa nem prova ZDR do fornecedor. Produção bloqueia `limited-test-verified`; desenvolvimento pode usar esse modo após verificar a política, apenas para dados sintéticos. A flag pública continua `enabled:false`, sem endpoint e sem segredo.

As chamadas do fornecedor, Firebase Auth, escritas e Redis foram simuladas nos testes; o proxy HTTP e a descodificação de imagem foram executados localmente. A quota tem operações Lua atómicas para 5/minuto, 50/24h e um pedido por UID, mas não houve teste contra um Redis real. Não houve autenticação Firebase Admin real, deploy Cloud Run ou validação de qualidade multimodal em folhas reais. Estes pontos permanecem necessários antes da ativação de produção.

Não foram criados recursos externos, segredos ou dados de manutenção. A retoma técnica local está validada; a ativação real permanece pendente.
