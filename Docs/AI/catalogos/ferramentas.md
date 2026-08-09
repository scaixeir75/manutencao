# Catálogo de Ferramentas

As ferramentas da Missão 001 são operações de consulta. Não criam, editam, fecham ou eliminam dados do PMP.

## Consultar Histórico

- **Identificador:** `consultar_historico`
- **Função técnica:** `consultHistory`.
- **Responsabilidade:** obter registos anteriores relevantes para o contexto técnico recebido.
- **Entrada:** contexto técnico e `historyRecords` recebidos por injeção de dependências.
- **Tipo de dados:** `readonly MaintenanceRecord[]`.
- **Saída:** registos convertidos em entradas de histórico e origem `records`.
- **Missão associada:** Missão 001 — Assistência ao Registo Técnico.
- **Estado:** implementada e usada no fluxo v1.0 da Missão 001.
- **Versão:** v1.0.
- **Correspondência:** grupos equivalentes para ruído ou vibração, centrifugação, fuga de água, erro ou avaria, aquecimento e alimentação elétrica.
- **Resultado:** apenas ocorrências relevantes para o texto atual.
- **Garantias:** não altera os registos recebidos e devolve uma lista vazia quando não existe histórico relevante.
- **Limites:** sem persistência, chamadas externas ou importação direta dos dados seed.
- **Especificação:** `../ferramentas/consultar_historico/especificacao.md`.

## Consultar Equipamento

- **Identificador:** `consultar_equipamento`
- **Responsabilidade:** obter a informação disponível de um equipamento identificado no registo.
- **Entrada:** identificador ou referência do equipamento.
- **Saída:** dados de equipamento encontrados e respetiva origem.
- **Missão associada:** A confirmar.
- **Estado:** planeada.
- **Especificação:** `../ferramentas/consultar_equipamento/especificacao.md`.

## Consultar Fotografias

- **Identificador:** `consultar_fotografias`
- **Responsabilidade:** obter a informação disponível das fotografias associadas ao registo.
- **Entrada:** referência do registo ou das fotografias disponíveis.
- **Saída:** fotografias ou metadados encontrados e respetiva origem.
- **Missão associada:** A confirmar.
- **Estado:** planeada.
- **Especificação:** `../ferramentas/consultar_fotografias/especificacao.md`.

## Consultar Histórico do Equipamento

- **Identificador:** `consultar_historico_equipamento`.
- **Função técnica:** `consultarHistoricoEquipamento`.
- **Responsabilidade:** obter registos anteriores associados a um equipamento específico.
- **Entrada obrigatória:** `equipamentoId` na implementação técnica; `equipamento_id` na especificação funcional.
- **Entrada opcional:** `limite`.
- **Saída implementada:** `entries` com `data`, `tipoRegisto`, `descricao` e `equipamentoId`, além de `error` e `message` quando aplicável.
- **Campo não implementado:** `estado` permanece A confirmar, porque não existe em `MaintenanceRecord`.
- **Permissões:** apenas leitura.
- **Missão associada:** A confirmar.
- **Estado:** implementação técnica inicial aditiva desde v0.9; pronta para uso futuro, mas ainda não integrada na Missão 001.
- **Versão:** v0.9.
- **Relação com `consultar_historico`:** especialização por equipamento; coexiste com `consultHistory`, que foi preservada e continua a ser usada pela Missão 001.
- **Garantias:** não cria, altera, fecha ou apaga registos; não decide prioridade; não gera alertas; não substitui validação humana.
- **Limites:** sem sensores, telemetria, dados preditivos, chamadas externas ou dependências novas.
- **A confirmar:** validação real de equipamento inexistente e integração num fluxo de missão.
- **Especificação:** `../ferramentas/consultar_historico_equipamento/especificacao.md`.