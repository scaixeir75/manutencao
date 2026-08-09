# Catálogo de Fluxos

## Fluxo 001 — Assistência ao Registo Técnico

- **Identificador:** `fluxo_001_assistencia_registo`
- **Missão associada:** Missão 001 — Assistência ao Registo Técnico.
- **Objetivo:** coordenar a transformação de uma descrição livre numa sugestão técnica pronta para validação humana.
- **Início:** o técnico escreve uma descrição no ecrã de Registos Diários.
- **Ativação:** a análise simulada é ativada quando a descrição tem pelo menos 12 caracteres.
- **Fim:** o técnico recebe uma sugestão consolidada para confirmar, corrigir ou copiar manualmente.
- **Estado:** v1.0 estável — fluxo simulado/controlado fechado documentalmente.
- **Versão:** v1.0.
- **Integração implementada:** painel Assistente IA no ecrã de Registos Diários, com estados visuais e nota de supervisão humana.
- **Histórico usado no fluxo atual:** `consultHistory`, recebendo `historyRecords` por injeção de dependências.
- **Histórico por equipamento:** `consultarHistoricoEquipamento` existe tecnicamente desde v0.9, mas ainda não substitui `consultHistory` neste fluxo.
- **Risco:** indeterminado sem correspondências, médio com uma ocorrência semelhante e alto com duas ou mais ocorrências semelhantes.
- **Planeamento:** próxima ação ajustada ao sintoma identificado.
- **Fallback:** lista vazia quando `historyRecords` não é fornecido.
- **Supervisão humana:** qualquer ação crítica exige aprovação humana; a resposta é sempre sugestão, não decisão automática.
- **Validação:** cenários de risco, ações por sintoma, confirmação humana e imutabilidade cobertos por teste.
- **Limites:** sem chamadas externas, sem IA externa, sem persistência, sem alteração automática de campos, sem criação automática de alertas e sem execução de ações críticas.
- **Teste:** `../../../SRC/features/ai/tests/assistTechnicalRecordMission.test.ts`.
- **Definição:** `../missoes/001_assistencia_registo/fluxo.md`.

### Sequência Implementada

```text
Técnico escreve registo
→ Assistente IA recebe contexto
→ Orquestrador executa a Missão 001
→ Agente de Classificação
→ Agente de Resumo Técnico
→ Ferramenta Consultar Histórico (`consultHistory`)
→ Agente de Avaliação de Risco
→ Agente de Planeamento
→ Agente de Composição da Resposta
→ Técnico recebe sugestão para validação
```

### Fora do Fluxo v1.0

- `consultarHistoricoEquipamento` ainda não é usada pela Missão 001.
- `equipamentoId` ainda não é recolhido no formulário de Registos Diários.
- Não existe validação real de equipamento inexistente.
- Não existe fecho automático de registos ou criação automática de alertas.