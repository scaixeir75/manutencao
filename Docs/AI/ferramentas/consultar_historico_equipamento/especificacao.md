# Ferramenta — Consultar Histórico do Equipamento

## 1. Nome da ferramenta

- **Nome funcional:** Consultar Histórico do Equipamento.
- **Nome técnico interno:** `consultar_historico_equipamento`.
- **Estado:** documentação funcional, sem implementação técnica.
- **Versão documental:** v0.8A.

### Factos confirmados

- A ferramenta deve obter registos anteriores associados a um equipamento.
- A ferramenta é apenas de leitura.
- A entrada obrigatória é `equipamento_id`.
- A entrada opcional é `limite`.
- A saída deve incluir apenas `data`, `tipo_registo`, `descricao` e `estado`.

### Propostas arquiteturais

- A ferramenta deve especializar a consulta histórica por equipamento.
- A ferramenta deve coexistir temporariamente com `consultar_historico`.
- A substituição total de `consultar_historico` fica **A confirmar**.

## 2. Objetivo único

Obter registos anteriores associados a um equipamento identificado, para apoiar os agentes do Copiloto PMP na análise de contexto técnico.

A ferramenta não interpreta o histórico, não decide prioridade e não gera recomendações. Apenas devolve dados existentes e confirmados.

## 3. Agentes autorizados a utilizá-la

### Confirmado

- **A confirmar.**

### Proposta

- Agente de Avaliação de Risco, para obter contexto histórico do equipamento.
- Agente de Planeamento, para consultar ocorrências anteriores antes de propor próximos passos.
- Orquestrador, para controlar quando a ferramenta pode ser chamada dentro de uma missão autorizada.

A autorização final por agente deve ser confirmada antes da implementação técnica.

## 4. Entradas obrigatórias

- `equipamento_id`: identificador do equipamento cujo histórico deve ser consultado.

## 5. Entradas opcionais

- `limite`: número máximo de registos a devolver.

Valor por omissão: **A confirmar**.

## 6. Saída estruturada

A resposta deve devolver uma estrutura com:

```text
resultado:
  - data
  - tipo_registo
  - descricao
  - estado
estado_consulta
mensagem
```

Campos por registo:

- `data`: data do registo.
- `tipo_registo`: tipo do registo existente.
- `descricao`: descrição registada.
- `estado`: estado do registo.

Quando não existirem resultados, `resultado` deve ser uma lista vazia.

## 7. Validações das entradas

- `equipamento_id` deve existir no pedido.
- `equipamento_id` não pode estar vazio.
- `limite`, quando fornecido, deve ser um número positivo.
- A existência real do equipamento deve ser validada contra a fonte de dados autorizada. Fonte concreta: **A confirmar**.

## 8. Erros possíveis

- `identificador_em_falta`: quando `equipamento_id` não é fornecido ou está vazio.
- `equipamento_inexistente`: quando o equipamento não existe na fonte autorizada.
- `historico_indisponivel`: quando o histórico não pode ser consultado.

## 9. Comportamento quando não existem resultados

Quando o equipamento existe mas não existem registos anteriores associados:

- devolver `resultado` como lista vazia;
- devolver `estado_consulta` como `sem_resultados`;
- indicar `Informação insuficiente` para análise.

A ausência de resultados não deve ser tratada como erro técnico.

## 10. Permissões

Esta ferramenta é apenas de leitura.

A ferramenta pode:

- consultar registos existentes associados ao equipamento;
- devolver os campos autorizados da saída estruturada.

A ferramenta não pode:

- criar registos;
- alterar registos;
- fechar registos;
- apagar registos;
- alterar estado de registos;
- alterar prioridade;
- gerar alertas.

## 11. Limites de utilização

- Não decide prioridade.
- Não avalia risco por si só.
- Não gera alertas.
- Não substitui validação humana.
- Não assume sensores, telemetria ou dados preditivos.
- Não devolve campos não confirmados.
- Não deve expor dados fora do âmbito do equipamento consultado.

## 12. Regras de segurança

- Separar dados devolvidos de inferências dos agentes.
- Não transformar ausência de histórico em conclusão de baixo risco.
- Não ocultar erros de identificação do equipamento.
- Não devolver campos não autorizados.
- Não alterar dados recebidos ou consultados.
- Manter rastreável a origem da consulta. Campo de origem: **A confirmar**.

## 13. Exemplo de pedido

```text
ferramenta: consultar_historico_equipamento
entrada:
  equipamento_id: EQ-001
  limite: 5
```

## 14. Exemplo de resposta

```text
estado_consulta: encontrado
mensagem: Histórico consultado com sucesso.
resultado:
  - data: 2026-07-03
    tipo_registo: Tarefa
    descricao: Ruído identificado durante funcionamento.
    estado: A confirmar
  - data: 2026-07-09
    tipo_registo: Importante
    descricao: Verificação técnica solicitada.
    estado: A confirmar
```

Exemplo sem resultados:

```text
estado_consulta: sem_resultados
mensagem: Informação insuficiente.
resultado: []
```

## 15. Testes mínimos necessários

- Deve devolver erro `identificador_em_falta` quando `equipamento_id` não é fornecido.
- Deve devolver erro `equipamento_inexistente` quando o equipamento não existe.
- Deve devolver erro `historico_indisponivel` quando o histórico não pode ser consultado.
- Deve devolver lista vazia e mensagem `Informação insuficiente` quando não existem registos associados.
- Deve devolver apenas `data`, `tipo_registo`, `descricao` e `estado` por registo.
- Deve respeitar `limite` quando fornecido.
- Não deve criar, alterar, fechar ou apagar registos.
- Não deve decidir prioridade.
- Não deve gerar alertas.
- Não deve substituir validação humana.