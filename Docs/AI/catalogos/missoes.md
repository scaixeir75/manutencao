# Catálogo de Missões

## Missão 001 — Assistência ao Registo Técnico

- **Identificador:** `001_assistencia_registo`
- **Objetivo:** apoiar o técnico na preparação de um registo de manutenção claro, classificado e acompanhado por uma avaliação prudente de risco e próximos passos.
- **Entrada principal:** descrição livre escrita pelo técnico e contexto disponível do registo.
- **Resultado:** sugestão consolidada para revisão e confirmação pelo técnico.
- **Agentes implementados:** Classificação, Resumo Técnico, Avaliação de Risco, Planeamento e Composição da Resposta.
- **Ferramenta usada no fluxo atual:** `consultHistory` / Consultar Histórico.
- **Ferramenta técnica disponível para uso futuro:** `consultarHistoricoEquipamento`, implementada desde v0.9, aditiva e ainda não integrada na Missão 001.
- **Fluxo:** `fluxo_001_assistencia_registo`.
- **Estado:** v1.0 estável — missão simulada/controlada fechada documentalmente.
- **Versão:** v1.0.
- **Ecrã:** Registos Diários.
- **Comportamento implementado:** painel IA visível, ativação com pelo menos 12 caracteres, estados visuais, sugestão técnica, informação em falta, cópia manual de resumo, próxima ação e sugestão completa.
- **Supervisão humana:** visível no painel; qualquer ação crítica exige validação humana.
- **Segurança:** nenhum campo é alterado automaticamente, nenhuma sugestão é gravada automaticamente e nenhuma ação crítica é executada.
- **Validação:** TypeScript sem erros, teste da Missão 001 concluído com sucesso e validações visuais registadas até v0.8B.
- **Limites:** sem chamadas externas, sem IA externa, sem persistência nova, sem dependências novas e sem alteração automática de tipo, prioridade ou descrição.
- **Teste:** `../../../SRC/features/ai/tests/assistTechnicalRecordMission.test.ts`.
- **Especificação:** `../missoes/001_assistencia_registo/especificacao.md`.

## Estado Futuro

- **Missão 002 — Resumo de Equipamento:** proposta para v1.1 ou v1.2.
- **Integração futura:** `consultarHistoricoEquipamento` poderá ser integrada num fluxo próprio ou numa missão futura quando existir contexto de equipamento no formulário ou no fluxo de execução.
- **A confirmar:** recolha de `equipamentoId` no ecrã de Registos Diários e validação real de equipamento inexistente.