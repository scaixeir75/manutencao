# Missão 001 — Assistência ao Registo Técnico

## Objetivo

Apoiar o técnico na preparação de um registo de manutenção claro, classificado e acompanhado por uma avaliação prudente de risco e próximos passos.

## Estado atual

**Versão:** v1.0

**Estado:** Fecho estável documental da Missão 001 simulada/controlada.

A Missão 001 está estável como apoio local e determinístico no ecrã de Registos Diários. Não usa IA externa, não faz chamadas externas e não altera automaticamente dados do formulário.

## Implementado

- Assistente IA integrado no ecrã de Registos Diários.
- Painel IA sempre visível, com estados de ativação, análise, sugestão pronta e erro discreto.
- Ativação da análise quando a descrição tem pelo menos 12 caracteres.
- Execução da Missão 001 através do orquestrador.
- Classificação simulada/controlada do registo.
- Resumo técnico simples.
- Consulta de histórico via `consultHistory`.
- Avaliação de risco com base em ocorrências semelhantes.
- Próxima ação sugerida conforme o sintoma identificado.
- Informação em falta apresentada em lista.
- Cópia manual de resumo, próxima ação e sugestão completa.
- Supervisão humana visível no painel.
- Nota de supervisão humana incluída na sugestão completa.
- Mensagem de histórico insuficiente quando o risco é indeterminado.
- Fallback defensivo quando a cópia não está disponível.

## Documentado

- A Supervisão Humana é uma regra transversal, não um agente executável nesta fase.
- A ferramenta `consultar_historico_equipamento` foi desenhada em v0.8A e implementada tecnicamente em v0.9 como `consultarHistoricoEquipamento`.
- `consultarHistoricoEquipamento` é aditiva, apenas de leitura e ainda não substitui `consultHistory` na Missão 001.
- O campo `estado` permanece A confirmar, porque não existe em `MaintenanceRecord`.

## Limites da v1.0

- Não existe modelo real de IA.
- Não existe API externa.
- Não existe persistência nova.
- Não existe alteração automática do formulário.
- Não existe alteração automática de descrição, tipo ou prioridade.
- Não existe criação automática de alertas.
- Não existe fecho automático de registos.
- Não existe validação real de equipamento inexistente.
- `equipamentoId` ainda não é recolhido no formulário de Registos Diários.
- `consultarHistoricoEquipamento` está pronta para uso futuro, mas ainda não está integrada no fluxo da Missão 001.
- Sem criação de campos novos.
- Sem alteração da lógica de gravação.
- Sem importação direta de `initialRecords` pela IA.
- Sem dependências novas.

## Supervisão Humana

A IA apenas sugere. O técnico mantém a responsabilidade por rever, corrigir e confirmar qualquer conteúdo antes de o usar.

Ações críticas continuam proibidas sem aprovação humana explícita:

- criar alerta preventivo;
- alterar prioridade de uma intervenção;
- fechar registo;
- gerar relatório oficial;
- sugerir paragem de equipamento.

## Futuro

- v1.1 ou v1.2 poderá preparar a Missão 002 — Resumo de Equipamento.
- `consultarHistoricoEquipamento` poderá ser integrada num fluxo próprio quando existir contexto de equipamento confirmado.
- Qualquer ação crítica continuará sujeita a supervisão humana.

## Validação

- TypeScript sem erros.
- Teste da Missão 001 concluído com sucesso.
- Teste específico de `consultarHistoricoEquipamento` concluído com sucesso.
- Painel validado em desktop e móvel nas versões anteriores.
- Sem chamadas externas.
- Sem novas dependências.
- Sem alterações em `seed.ts`, `domain.ts`, `package.json` ou `package-lock.json`.

## Documentos relacionados

- `especificacao.md`
- `fluxo.md`
- `testes.md`
- `../../regras/supervisao_humana.md`
- `../../ferramentas/consultar_historico_equipamento/especificacao.md`