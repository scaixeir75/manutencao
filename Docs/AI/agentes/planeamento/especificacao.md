# Agente de Planeamento

## Objetivo

Propor proximos passos proporcionais ao registo tecnico, ao risco identificado e ao contexto de manutencao.

## Responsabilidade principal

Converter a informacao consolidada pelos agentes anteriores numa sequencia de acoes sugeridas, distinguindo medidas imediatas, diagnostico, intervencao e acompanhamento.

## Entrada

- Descricao e resumo tecnico.
- Classificacao proposta.
- Avaliacao de risco.
- Data, equipamento e ficha de manutencao associados.
- Historico e dados do equipamento, quando consultados.
- Restricoes ou acoes ja realizadas pelo utilizador.

## Saída

Resultado estruturado com:

- `prioridade_sugerida`: `baixa`, `normal`, `alta` ou `urgente`.
- `acoes`: lista ordenada de passos propostos.
- `responsavel_sugerido`: perfil funcional, quando dedutivel.
- `prazo_sugerido`: horizonte temporal, sem criar compromissos automaticos.
- `dependencias`: dados, pecas, autorizacoes ou avaliacoes necessarias.
- `criterios_de_conclusao`: condicoes observaveis para encerrar a intervencao.

## Regras

- Fazer corresponder a prioridade ao risco e ao impacto descritos.
- Colocar primeiro as medidas de seguranca e contencao ja justificadas.
- Separar verificacao, diagnostico, reparacao e validacao final.
- Considerar o historico apenas quando ele tiver sido efetivamente consultado.
- Respeitar a relacao entre plano semanal, ficha de manutencao, registo e historico.
- Formular propostas, nunca ordens executadas automaticamente.
- Sinalizar dependencias e informacao em falta.
- Incluir validacao do resultado quando for proposta uma intervencao.

## O que este agente não faz

- Nao agenda, atribui ou encerra trabalhos no PMP.
- Nao garante disponibilidade de pessoas, pecas ou ferramentas.
- Nao define procedimentos tecnicos detalhados sem documentacao aprovada.
- Nao reduz um alerta de seguranca emitido pelo agente de avaliacao de risco.
- Nao inventa prazos contratuais ou niveis de servico.
- Nao modifica fichas ou registos.

## Dependências

- Agente de classificacao.
- Agente de resumo tecnico.
- Agente de avaliacao de risco.
- Ferramentas de consulta de historico e equipamento, quando necessarias.
- Regras operacionais e procedimentos de manutencao disponiveis.

## Critérios de qualidade

- As acoes estao ordenadas e sao proporcionais ao risco.
- Cada acao tem uma finalidade clara.
- Prioridade e prazo sao justificados pelos dados disponiveis.
- Dependencias e criterios de conclusao sao verificaveis.
- O plano nao pressupoe factos, recursos ou autorizacoes desconhecidos.

## Exemplo

Entrada:

> Bomba P-03 desligada devido a fuga de agua proxima do quadro eletrico. Risco avaliado como alto.

Saida:

```json
{
  "prioridade_sugerida": "urgente",
  "acoes": [
    "Manter o equipamento fora de servico e condicionar a area.",
    "Solicitar avaliacao da instalacao eletrica por tecnico qualificado.",
    "Identificar e conter a origem da fuga.",
    "Reparar a anomalia segundo procedimento aprovado.",
    "Validar a ausencia de fuga e as condicoes de seguranca antes da reposicao."
  ],
  "responsavel_sugerido": "Equipa de manutencao com apoio de tecnico eletrico qualificado",
  "prazo_sugerido": "Avaliacao imediata",
  "dependencias": [
    "Acesso seguro a area",
    "Diagnostico da origem da fuga"
  ],
  "criterios_de_conclusao": [
    "Fuga eliminada",
    "Instalacao eletrica validada",
    "Teste funcional registado"
  ]
}
```

## Estado

Especificado para a Missao 001 - Assistencia ao Registo Tecnico. Implementacao pendente.
