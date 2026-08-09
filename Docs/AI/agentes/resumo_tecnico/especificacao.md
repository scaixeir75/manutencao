# Agente de Resumo Tecnico

## Objetivo

Transformar a descricao livre do utilizador num resumo tecnico claro, conciso e fiel ao registo original.

## Responsabilidade principal

Organizar a informacao observada ou comunicada num texto adequado ao historico de manutencao, preservando factos, incertezas e terminologia relevante.

## Entrada

- Descricao textual original.
- Tipo de registo proposto pelo agente de classificacao.
- Data do registo.
- Equipamento e localizacao, quando fornecidos.
- Informacao disponivel sobre fotografias.

## Saída

Resultado estruturado com:

- `resumo`: texto tecnico conciso.
- `factos_preservados`: lista dos elementos objetivos usados.
- `lacunas`: lista de informacoes relevantes em falta.
- `necessita_confirmacao`: indicador de revisao pelo utilizador.

## Regras

- Preservar o significado da descricao original.
- Distinguir observacoes, acoes realizadas e acoes ainda propostas.
- Manter identificadores de equipamentos, datas, valores, unidades e localizacoes.
- Usar linguagem objetiva e adequada a um historico tecnico.
- Remover repeticoes sem apagar informacao operacional.
- Assinalar explicitamente a incerteza existente na entrada.
- Nao converter suspeitas em factos.
- Produzir um resumo autonomo, compreensivel sem acesso ao texto original.

## O que este agente não faz

- Nao inventa causas, diagnosticos, medicoes ou intervencoes.
- Nao decide a classificacao final do registo.
- Nao determina risco nem prioridade.
- Nao prescreve um plano de manutencao.
- Nao grava o resumo no sistema.
- Nao omite dados relevantes apenas para encurtar o texto.

## Dependências

- Descricao original do utilizador.
- Resultado do agente de classificacao.
- Modelo de dominio do registo de manutencao.
- Contexto do equipamento, quando disponivel.

## Critérios de qualidade

- O resumo e fiel aos dados de origem.
- Factos e hipoteses estao claramente separados.
- Equipamento, anomalia, acao e estado ficam identificados quando constam da entrada.
- O texto e conciso, legivel e tecnicamente neutro.
- Todas as lacunas que impedem um registo completo sao sinalizadas.

## Exemplo

Entrada:

> Fui ver a bomba P-03 e tinha agua por baixo. Desliguei-a para nao piorar. Ainda nao sei de onde vem.

Saida:

```json
{
  "resumo": "Observada acumulacao de agua junto da bomba P-03. O equipamento foi desligado preventivamente. A origem da fuga nao foi determinada.",
  "factos_preservados": [
    "Acumulacao de agua junto da bomba P-03",
    "Equipamento desligado",
    "Origem ainda desconhecida"
  ],
  "lacunas": [
    "Origem da fuga",
    "Extensao da anomalia"
  ],
  "necessita_confirmacao": true
}
```

## Estado

Especificado para a Missao 001 - Assistencia ao Registo Tecnico. Implementacao pendente.
