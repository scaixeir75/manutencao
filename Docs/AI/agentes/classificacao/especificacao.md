# Agente de Classificacao

## Objetivo

Classificar um registo tecnico de manutencao de forma consistente com os tipos reconhecidos pelo PMP.

## Responsabilidade principal

Analisar a descricao fornecida pelo utilizador e propor um dos tipos de registo: `Tarefa`, `Visita` ou `Importante`.

## Entrada

- Descricao textual do registo.
- Data do registo, quando disponivel.
- Equipamento associado, quando existir.
- Contexto da ficha de manutencao, quando o registo tiver origem numa ficha.
- Metadados das fotografias, sem inferir conteudo que nao tenha sido analisado.

## Saída

Resultado estruturado com:

- `tipo_proposto`: `Tarefa`, `Visita` ou `Importante`.
- `confianca`: valor entre 0 e 1.
- `justificacao`: explicacao curta baseada na entrada.
- `necessita_confirmacao`: `true` quando houver ambiguidade ou informacao insuficiente.

## Regras

- Usar apenas os tipos definidos nas regras de negocio do PMP.
- Classificar como `Tarefa` quando a descricao representar trabalho executado ou a executar.
- Classificar como `Visita` quando o foco for inspecao, deslocacao, observacao ou verificacao sem intervencao claramente descrita.
- Propor `Importante` quando o registo assinalar urgencia, indisponibilidade, perigo, falha critica ou impacto operacional relevante.
- Dar prioridade a `Importante` quando existirem sinais explicitos de criticidade.
- Basear a justificacao em elementos presentes na entrada.
- Sinalizar necessidade de confirmacao quando mais de uma classe for plausivel.
- Preservar a data e a associacao ao equipamento recebidas.

## O que este agente não faz

- Nao cria, edita ou elimina registos.
- Nao avalia tecnicamente o nivel de risco.
- Nao escreve o resumo tecnico final.
- Nao cria planos de intervencao.
- Nao interpreta fotografias sem dados visuais disponibilizados.
- Nao substitui a confirmacao do utilizador.

## Dependências

- Regras de negocio relativas aos tipos de registo.
- Modelo de dominio de `Registo de Manutencao`.
- Descricao introduzida pelo utilizador.
- Agente de composicao de resposta, que apresenta a proposta final.

## Critérios de qualidade

- A classe pertence ao conjunto permitido.
- A justificacao e curta, clara e rastreavel ate a entrada.
- A confianca reflete a ambiguidade real do texto.
- Nenhum facto novo e introduzido.
- Entradas equivalentes produzem classificacoes consistentes.

## Exemplo

Entrada:

> Detetada fuga de agua na bomba P-03. Equipamento parado ate reparacao.

Saida:

```json
{
  "tipo_proposto": "Importante",
  "confianca": 0.96,
  "justificacao": "A descricao indica fuga e paragem do equipamento.",
  "necessita_confirmacao": false
}
```

## Estado

Especificado para a Missao 001 - Assistencia ao Registo Tecnico. Implementacao pendente.
