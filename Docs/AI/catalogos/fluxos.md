# Catálogo de Fluxos

## Fluxo 001 — Assistência ao Registo Técnico

- **Identificador:** `fluxo_001_assistencia_registo`
- **Missão associada:** Missão 001 — Assistência ao Registo Técnico.
- **Objetivo:** coordenar a transformação de uma descrição livre numa sugestão técnica pronta para validação.
- **Início:** o técnico escreve um registo e pede assistência.
- **Fim:** o técnico recebe uma sugestão consolidada para confirmar ou corrigir.
- **Estado:** Ligação ao histórico em memória concluída.
- **Versão:** v0.4.
- **Commit:** `26625bb03ce68cde079e95b1ff1ccccdd0dedf93`.
- **Integração:** painel de apoio no ecrã de Registos Diários após 12 caracteres.
- **Histórico:** registos em memória recebidos por injeção de dependências e tratados como dados apenas de leitura.
- **Fallback:** lista vazia quando `historyRecords` não é fornecido.
- **Validação:** risco médio com ocorrência semelhante e indeterminado sem histórico; TypeScript, teste e browser sem erros.
- **Limites:** a IA apenas sugere, não altera dados, não cria persistência, não realiza chamadas externas e não usa dependências novas.
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
