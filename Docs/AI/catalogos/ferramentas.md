# Catálogo de Ferramentas

As ferramentas da Missão 001 são operações de consulta. Não criam, editam ou eliminam dados do PMP.

## Consultar Histórico

- **Identificador:** `consultar_historico`
- **Responsabilidade:** obter registos anteriores relevantes para o contexto técnico recebido.
- **Entrada:** contexto técnico e `historyRecords` recebidos por injeção de dependências.
- **Tipo de dados:** `readonly MaintenanceRecord[]`.
- **Saída:** registos convertidos em entradas de histórico e origem `records`.
- **Missão associada:** Missão 001 — Assistência ao Registo Técnico.
- **Estado:** Correspondência simples com histórico concluída.
- **Versão:** v0.5.
- **Correspondência:** grupos equivalentes para ruído ou vibração, centrifugação, fuga de água, erro ou avaria, aquecimento e alimentação elétrica.
- **Resultado:** apenas ocorrências relevantes para o texto atual.
- **Garantias:** não altera os registos recebidos e devolve uma lista vazia quando não existe histórico.
- **Limites:** sem persistência, chamadas externas ou importação direta dos dados seed.
- **Especificação:** `../ferramentas/consultar_historico/especificacao.md`.

## Consultar Equipamento

- **Identificador:** `consultar_equipamento`
- **Responsabilidade:** obter a informação disponível de um equipamento identificado no registo.
- **Entrada:** identificador ou referência do equipamento.
- **Saída:** dados de equipamento encontrados e respetiva origem.
- **Missão associada:** Missão 001 — Assistência ao Registo Técnico.
- **Estado:** Planeada.
- **Especificação:** `../ferramentas/consultar_equipamento/especificacao.md`.

## Consultar Fotografias

- **Identificador:** `consultar_fotografias`
- **Responsabilidade:** obter a informação disponível das fotografias associadas ao registo.
- **Entrada:** referência do registo ou das fotografias disponíveis.
- **Saída:** fotografias ou metadados encontrados e respetiva origem.
- **Missão associada:** Missão 001 — Assistência ao Registo Técnico.
- **Estado:** Planeada.
- **Especificação:** `../ferramentas/consultar_fotografias/especificacao.md`.
## Consultar Histórico do Equipamento

- **Identificador:** `consultar_historico_equipamento`
- **Responsabilidade:** obter registos anteriores associados a um equipamento específico.
- **Entrada obrigatória:** `equipamento_id`.
- **Entrada opcional:** `limite`.
- **Saída:** lista de registos com `data`, `tipo_registo`, `descricao` e `estado`.
- **Permissões:** apenas leitura.
- **Missão associada:** A confirmar.
- **Estado:** Documentação funcional, sem implementação técnica.
- **Versão:** v0.8A.
- **Relação com `consultar_historico`:** especialização por equipamento; deve coexistir temporariamente com `consultar_historico` até ser confirmada a estratégia técnica.
- **Garantias:** não cria, altera, fecha ou apaga registos; não decide prioridade; não gera alertas; não substitui validação humana.
- **Limites:** sem sensores, telemetria, dados preditivos, chamadas externas ou dependências novas.
- **Especificação:** `../ferramentas/consultar_historico_equipamento/especificacao.md`.
