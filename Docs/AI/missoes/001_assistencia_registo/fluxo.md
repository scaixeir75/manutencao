# Fluxo da Missão 001 — Assistência ao Registo Técnico

## Identificador

`fluxo_001_assistencia_registo`

## Visão geral

```text
Técnico escreve registo
→ Assistente IA recebe contexto
→ Orquestrador identifica missão
→ Agente de Classificação
→ Agente de Resumo Técnico
→ Ferramenta Consultar Histórico
→ Agente de Avaliação de Risco
→ Agente de Planeamento
→ Agente de Composição da Resposta
→ Técnico recebe sugestão
```

## Passos

### 1. Técnico escreve o registo

O técnico introduz a descrição e a data. Pode também indicar equipamento, ficha, tipo inicial, fotografias e ações já realizadas.

### 2. Assistente IA recebe o contexto

O Assistente IA reúne os dados disponíveis sem os alterar e identifica lacunas obrigatórias, nomeadamente a ausência de data.

### 3. Orquestrador identifica a missão

O Orquestrador seleciona a Missão 001 quando o pedido consiste em apoiar a preparação de um registo técnico.

### 4. Agente de Classificação

Analisa a descrição e propõe `Tarefa`, `Visita` ou `Importante`, indicando confiança e necessidade de confirmação.

### 5. Agente de Resumo Técnico

Produz um resumo fiel, separando observações, ações realizadas, incertezas e informação em falta.

### 6. Ferramenta Consultar Histórico

Consulta registos anteriores relevantes com base no contexto disponível. O resultado deve indicar a origem e não pode alterar o histórico.

Quando existir equipamento identificado ou fotografias disponíveis, o Orquestrador pode recorrer às ferramentas complementares Consultar Equipamento e Consultar Fotografias.

### 7. Agente de Avaliação de Risco

Combina a descrição, o resumo e o contexto consultado para identificar riscos de segurança, ambiente, operação e agravamento.

### 8. Agente de Planeamento

Propõe ações ordenadas e proporcionais ao risco, distinguindo contenção, diagnóstico, intervenção e validação.

### 9. Agente de Composição da Resposta

Consolida classificação, resumo, risco, plano, lacunas e fontes numa sugestão única. Não altera os resultados recebidos nem oculta divergências.

### 10. Técnico recebe a sugestão

O técnico revê, corrige e confirma o conteúdo. A missão termina com a apresentação da sugestão; a gravação pertence ao fluxo normal da aplicação.

## Tratamento de exceções

- **Data em falta:** pedir o preenchimento antes de considerar o registo completo.
- **Descrição insuficiente:** apresentar as lacunas e solicitar clarificação.
- **Equipamento não identificado:** continuar sem associação, indicando essa ausência.
- **Histórico indisponível:** continuar com os restantes resultados e declarar que a consulta não foi concluída.
- **Resultados contraditórios:** não ocultar o conflito; pedir validação ao técnico.
- **Risco elevado:** destacar o alerta e recomendar escalamento humano.

## Condição de conclusão

O fluxo fica concluído quando o técnico recebe uma sugestão rastreável, com as incertezas visíveis e pronta para confirmação.

