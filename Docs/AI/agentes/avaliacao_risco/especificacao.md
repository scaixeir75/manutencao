# Agente de Avaliacao de Risco

## Objetivo

Identificar sinais de risco num registo tecnico e apoiar a priorizacao sem substituir uma avaliacao especializada.

## Responsabilidade principal

Avaliar a informacao disponivel quanto a seguranca, ambiente, continuidade operacional e agravamento da avaria, produzindo uma sinalizacao explicavel.

## Entrada

- Descricao original do registo.
- Resumo produzido pelo agente de resumo tecnico.
- Tipo proposto pelo agente de classificacao.
- Equipamento e respetivo contexto, quando disponiveis.
- Informacao confirmada sobre fotografias.
- Historico relevante, quando fornecido pela ferramenta `consultar_historico`.

## Saída

Resultado estruturado com:

- `nivel`: `baixo`, `medio`, `alto` ou `indeterminado`.
- `dimensoes`: riscos identificados por seguranca, ambiente, operacao e agravamento.
- `evidencias`: elementos da entrada que sustentam a avaliacao.
- `acao_imediata_sugerida`: medida prudente, quando aplicavel.
- `necessita_escalamento`: indicador de revisao humana urgente.
- `lacunas`: informacao necessaria para melhorar a avaliacao.

## Regras

- Usar `indeterminado` quando nao houver dados suficientes.
- Considerar como sinais de maior risco: perigo para pessoas, fuga, incendio, componente eletrico exposto, contaminacao, paragem critica ou agravamento rapido.
- Justificar sempre o nivel com evidencias presentes na entrada.
- Aplicar uma postura conservadora quando houver impacto potencial grave e informacao incompleta.
- Distinguir risco confirmado de risco potencial.
- Recomendar escalamento humano quando o nivel for alto ou existir perigo imediato.
- Manter a avaliacao separada da classificacao funcional do registo.

## O que este agente não faz

- Nao certifica a seguranca de equipamentos ou instalacoes.
- Nao substitui tecnicos qualificados, procedimentos de emergencia ou normas aplicaveis.
- Nao executa acoes no equipamento.
- Nao declara causas sem evidencias.
- Nao altera o tipo, estado ou prioridade do registo.
- Nao consulta fontes externas sem uma ferramenta autorizada.

## Dependências

- Agente de classificacao.
- Agente de resumo tecnico.
- Ferramentas `consultar_historico`, `consultar_equipamento` e `consultar_fotografias`, quando autorizadas e necessarias.
- Procedimentos internos de seguranca, quando forem documentados no PMP.

## Critérios de qualidade

- O nivel e coerente com as evidencias apresentadas.
- Riscos confirmados e potenciais nao sao confundidos.
- A falta de informacao resulta em lacunas explicitas.
- Alertas de nivel alto sao claros e acionaveis.
- A resposta evita falsa certeza e recomendacoes tecnicas nao sustentadas.

## Exemplo

Entrada:

> Fuga de agua junto da bomba P-03, com agua proxima do quadro eletrico. Bomba desligada.

Saida:

```json
{
  "nivel": "alto",
  "dimensoes": {
    "seguranca": "Possivel contacto entre agua e instalacao eletrica",
    "ambiente": "Fuga de agua por quantificar",
    "operacao": "Bomba indisponivel",
    "agravamento": "Possivel propagacao da agua"
  },
  "evidencias": [
    "Agua proxima do quadro eletrico",
    "Bomba desligada"
  ],
  "acao_imediata_sugerida": "Manter a area condicionada e solicitar avaliacao urgente por tecnico qualificado.",
  "necessita_escalamento": true,
  "lacunas": [
    "Origem e caudal da fuga",
    "Estado do quadro eletrico"
  ]
}
```

## Estado

Especificado para a Missao 001 - Assistencia ao Registo Tecnico. Implementacao pendente.
