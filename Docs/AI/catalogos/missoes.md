# Catálogo de Missões

## Missão 001 — Assistência ao Registo Técnico

- **Identificador:** `001_assistencia_registo`
- **Objetivo:** apoiar o técnico na preparação de um registo de manutenção claro, classificado e acompanhado por uma avaliação prudente de risco e próximos passos.
- **Entrada principal:** descrição livre escrita pelo técnico e contexto disponível do registo.
- **Resultado:** sugestão consolidada para revisão e confirmação pelo técnico.
- **Agentes:** Classificação, Resumo Técnico, Avaliação de Risco, Planeamento e Composição da Resposta.
- **Ferramenta principal:** Consultar Histórico.
- **Ferramentas complementares:** Consultar Equipamento e Consultar Fotografias, quando houver contexto e necessidade.
- **Fluxo:** `fluxo_001_assistencia_registo`.
- **Estado:** Integração visual controlada concluída.
- **Versão:** v0.2.
- **Ecrã:** Registos Diários.
- **Comportamento:** o painel surge após 12 caracteres, executa a missão simulada e apresenta apenas sugestões.
- **Segurança:** o texto do técnico nunca é alterado e nenhuma sugestão é gravada automaticamente.
- **Validação:** TypeScript, desktop e móvel validados sem sobreposições ou erros no browser.
- **Limites:** sem chamadas externas e sem dependências novas.
- **Teste:** `../../../SRC/features/ai/tests/assistTechnicalRecordMission.test.ts`.
- **Especificação:** `../missoes/001_assistencia_registo/especificacao.md`.
