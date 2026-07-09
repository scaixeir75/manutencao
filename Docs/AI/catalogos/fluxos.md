# Catálogo de Fluxos

## Fluxo 001 — Assistência ao Registo Técnico

- **Identificador:** `fluxo_001_assistencia_registo`
- **Missão associada:** Missão 001 — Assistência ao Registo Técnico.
- **Objetivo:** coordenar a transformação de uma descrição livre numa sugestão técnica pronta para validação.
- **Início:** o técnico escreve um registo e pede assistência.
- **Fim:** o técnico recebe uma sugestão consolidada para confirmar ou corrigir.
- **Estado:** Integração visual controlada concluída.
- **Versão:** v0.2.
- **Integração:** painel de apoio no ecrã de Registos Diários após 12 caracteres.
- **Validação:** sequência ponta a ponta executada através da Missão 001 e do orquestrador; desktop e móvel validados sem sobreposições ou erros no browser.
- **Limites:** a IA apenas sugere, não altera o texto, não grava dados, não realiza chamadas externas e não usa dependências novas.
- **Teste:** `../../../SRC/features/ai/tests/assistTechnicalRecordMission.test.ts`.
- **Definição:** `../missoes/001_assistencia_registo/fluxo.md`.

### Sequência

```text
Técnico escreve registo
→ Assistente IA recebe contexto
→ Orquestrador identifica missão
→ Agente de Classificação
→ Agente de Resumo Técnico
→ Ferramenta Consultar Histórico
→ Agente de Avaliação de Risco
→ Agente de Planeamento
→ Agente de Composição da Resposta
→ Técnico recebe sugestão
```
