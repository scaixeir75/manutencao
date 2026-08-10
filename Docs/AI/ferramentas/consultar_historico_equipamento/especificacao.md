# Ferramenta — Consultar Histórico do Equipamento

## 1. Nome da ferramenta

- **Nome funcional:** Consultar Histórico do Equipamento.
- **Nome técnico interno:** `consultar_historico_equipamento`.
- **Função TypeScript:** `consultarHistoricoEquipamento`.
- **Estado:** implementação técnica inicial aditiva.
- **Versão:** v0.9.

### Factos confirmados

- A ferramenta obtém registos anteriores associados a um equipamento.
- A ferramenta é apenas de leitura.
- A entrada obrigatória funcional é `equipamento_id`.
- A entrada técnica é `equipamentoId`.
- A entrada opcional é `limite`.
- A implementação usa `readonly MaintenanceRecord[]`.
- A implementação não substitui `consultHistory`.
- A Missão 001 continua a usar a ferramenta atual `consultHistory`.

### A confirmar

- Fonte autorizada para validar existência real do equipamento.
- Valor por omissão funcional de `limite`.
- Campo real de estado do registo.
- Autorização final por agente.

## 2. Objetivo único

Obter registos anteriores associados a um equipamento identificado, para apoiar análises futuras do Copiloto PMP.

A ferramenta não interpreta o histórico, não decide prioridade e não gera recomendações. Apenas devolve dados existentes e confirmados.

## 3. Agentes autorizados a utilizá-la

### Confirmado

- **A confirmar.**

### Proposta

- Agente de Avaliação de Risco, para obter contexto histórico do equipamento.
- Agente de Planeamento, para consultar ocorrências anteriores antes de propor próximos passos.
- Orquestrador, para controlar quando a ferramenta pode ser chamada dentro de uma missão autorizada.

A autorização final por agente deve ser confirmada antes de integrar esta ferramenta em fluxos de missão.

## 4. Entradas obrigatórias

- `equipamento_id`, no contrato funcional.
- `equipamentoId`, no contrato TypeScript.

Tipo técnico:

```ts
equipamentoId: string | undefined
```

## 5. Entradas opcionais

- `limite`: número máximo de registos a devolver.

Tipo técnico:

```ts
limite?: number
```

A implementação aplica `limite` apenas quando é um número positivo.

## 6. Saída estruturada

Tipo técnico:

```ts
{
  entries: Array<{
    data: string;
    tipoRegisto: MaintenanceRecordType;
    descricao: string;
    equipamentoId: string;
  }>;
  error?: 'identificador_em_falta' | 'equipamento_inexistente' | 'historico_indisponivel';
  message?: string;
}
```

Campos por entrada:

- `data`: origem em `MaintenanceRecord.date`.
- `tipoRegisto`: origem em `MaintenanceRecord.type`.
- `descricao`: origem em `MaintenanceRecord.description`.
- `equipamentoId`: origem em `MaintenanceRecord.equipmentId`.

### Campo `estado`

`estado` permanece **A confirmar**. Não existe em `MaintenanceRecord`, por isso a implementação v0.9 não devolve este campo como dado real.

## 7. Validações das entradas

- `equipamentoId` deve existir.
- `equipamentoId` não pode estar vazio após `trim()`.
- `limite`, quando fornecido, só é aplicado se for número positivo.
- A existência real do equipamento contra uma lista de equipamentos permanece **A confirmar**.

## 8. Erros possíveis

- `identificador_em_falta`: quando `equipamentoId` não é fornecido ou está vazio.
- `historico_indisponivel`: quando não existem registos associados ao equipamento indicado.
- `equipamento_inexistente`: previsto no tipo, mas a validação contra fonte de equipamentos está **A confirmar**.

## 9. Comportamento quando não existem resultados

Quando não existem registos associados ao equipamento indicado:

```ts
{
  entries: [],
  error: 'historico_indisponivel',
  message: 'Informação insuficiente'
}
```

A ausência de resultados não deve ser usada como prova de baixo risco.

## 10. Permissões

Esta ferramenta é apenas de leitura.

A ferramenta pode:

- consultar o array de registos recebido;
- filtrar registos por `equipmentId`;
- devolver os campos confirmados da saída estruturada.

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
- Não devolve `estado` como dado real.
- Não deve expor dados fora do âmbito do equipamento consultado.

## 12. Regras de segurança

- Separar dados devolvidos de inferências dos agentes.
- Não transformar ausência de histórico em conclusão de baixo risco.
- Não ocultar erro de identificador em falta.
- Não devolver campos não confirmados.
- Não alterar dados recebidos ou consultados.

## 13. Exemplo de pedido

```text
ferramenta: consultar_historico_equipamento
entrada:
  equipamento_id: eq-pump-02
  limite: 5
```

## 14. Exemplo de resposta

```text
entries:
  - data: 2026-07-03
    tipoRegisto: Visita
    descricao: Pressões dentro do intervalo esperado após verificação de rotina.
    equipamentoId: eq-pump-02
```

Exemplo sem resultados:

```text
entries: []
error: historico_indisponivel
message: Informação insuficiente
```

## 15. Testes mínimos necessários

- Devolve `identificador_em_falta` quando não há `equipamentoId`.
- Devolve lista filtrada por equipamento.
- Não devolve registos de outro equipamento.
- Ordena por data do mais recente para o mais antigo quando possível.
- Não quebra quando a data não é parseável.
- Aplica `limite` positivo.
- Devolve `historico_indisponivel` e `Informação insuficiente` quando não existem resultados.
- Não inclui campo `estado` inventado.
- `consultHistory` continua a funcionar como antes.