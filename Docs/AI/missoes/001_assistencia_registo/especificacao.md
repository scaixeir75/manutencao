# Missão 001 — Assistência ao Registo Técnico

## Objetivo

Apoiar o técnico na transformação de uma descrição livre num registo de manutenção claro, consistente e pronto para validação.

## Quando utilizar

Utilizar quando o técnico estiver a criar um registo diário ou um registo associado a uma ficha de manutenção e solicitar apoio para organizar a informação.

## Entrada

### Obrigatória

- descrição textual fornecida pelo técnico;
- data do registo.

### Opcional

- equipamento associado;
- ficha de manutenção de origem;
- tipo inicialmente selecionado;
- fotografias associadas ou disponíveis;
- contexto relevante do histórico;
- ações já realizadas.

## Resultado esperado

Uma sugestão consolidada com:

- tipo proposto: `Tarefa`, `Visita` ou `Importante`;
- resumo técnico;
- avaliação de risco e respetivas evidências;
- próximos passos sugeridos;
- informação em falta;
- indicação das fontes internas consultadas;
- pedido de confirmação ao técnico.

## Agentes

1. **Agente de Classificação:** propõe o tipo do registo.
2. **Agente de Resumo Técnico:** organiza a descrição numa formulação técnica fiel.
3. **Agente de Avaliação de Risco:** identifica sinais de risco e necessidade de escalamento.
4. **Agente de Planeamento:** propõe próximos passos proporcionais ao contexto.
5. **Agente de Composição da Resposta:** reúne os resultados para apresentação ao técnico.

## Ferramentas

- **Consultar Histórico:** obtém registos anteriores relevantes para o contexto recebido.
- **Consultar Equipamento:** obtém dados do equipamento quando este estiver identificado.
- **Consultar Fotografias:** obtém informação das fotografias associadas quando estiverem disponíveis.

A consulta do histórico faz parte do fluxo principal. As restantes ferramentas são complementares e só são usadas quando o contexto o justificar.

## Regras

- Não inventar factos, causas, medições ou ações.
- Preservar a descrição original e a origem dos dados.
- Distinguir factos confirmados, inferências e sugestões.
- Manter a data obrigatória e a associação ao equipamento opcional.
- Consultar apenas fontes internas autorizadas.
- Assinalar informação insuficiente ou contraditória.
- Destacar riscos elevados sem substituir uma avaliação técnica especializada.
- Solicitar confirmação antes da gravação do registo.

## O que a missão não faz

- Não cria, altera ou elimina registos.
- Não executa intervenções nem agenda trabalhos.
- Não substitui técnicos qualificados ou procedimentos de segurança.
- Não analisa informação que não tenha sido fornecida ou consultada.
- Não determina autonomamente que uma sugestão é definitiva.

## Critérios de qualidade

- A sugestão é fiel à entrada do técnico.
- O tipo proposto pertence ao conjunto permitido pelo PMP.
- O resumo é claro, conciso e tecnicamente neutro.
- A avaliação de risco apresenta evidências e lacunas.
- O plano é proporcional ao risco e ao contexto conhecido.
- Todas as consultas e conclusões permanecem rastreáveis.
- O técnico consegue confirmar ou corrigir o resultado.

## Estado

Planeada. A arquitetura documental está definida; a lógica de IA ainda não está implementada.

