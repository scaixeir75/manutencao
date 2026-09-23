# PHOTO-AI-003 — arquitetura Cloud Run/OpenAI arquivada

Este documento preserva a decisão histórica: foi considerada uma integração
Cloud Run + OpenAI Responses API + Redis, com `store:false`, validação Firebase,
allowlist de UIDs e confirmação humana. Nunca foi ativada em produção.

O respetivo código (`server/photo-ai/`), Dockerfile e dependências foram removidos
no `LEGACY-AI-CLEANUP-001`: não existe um serviço Cloud Run, endpoint, script de
deploy ou fallback OpenAI utilizável no repositório atual.

O fluxo suportado é o preenchimento humano assistido. A leitura automática está
congelada, conforme [PHOTO_AI_AUTO_DECISION.md](PHOTO_AI_AUTO_DECISION.md), e a
configuração pública mantém `window.PMP_PHOTO_AI.enabled=false`.

Esta nota é histórica; não contém instruções de deploy nem configuração operacional.
