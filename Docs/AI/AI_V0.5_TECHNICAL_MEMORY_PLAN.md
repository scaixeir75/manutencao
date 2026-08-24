# v0.5 — Plano da Memória Técnica Assistida

## Objetivo

Evoluir o Assistente IA do PMP para uma memória técnica assistida: uma capacidade de recuperar, relacionar e explicar informação técnica já registada no PMP, com origem identificável, contexto temporal e limites claros de confiança.

O objetivo não é criar uma base de conhecimento autónoma nem permitir que a IA invente histórico. A memória deve apoiar a consulta do que existe nos dados do PMP e encaminhar o utilizador quando a informação for insuficiente ou ambígua.

## Problema a resolver

Os dados técnicos do PMP ficam distribuídos por registos diários, histórico de fichas, plano semanal, tarefas, classificações e anomalias. Uma pergunta técnica pode exigir cruzar essas fontes, distinguir passado de futuro e preservar o significado original do registo.

Na v0.5, o utilizador deve poder colocar questões naturais sobre intervenções, equipamentos, materiais, locais, anomalias e decisões anteriores, recebendo respostas rastreáveis e prudentes.

## Âmbito

Incluído na v0.5:

- pesquisa assistida sobre informação já existente no PMP;
- recuperação por entidade técnica: equipamento, local, sistema, material, anomalia ou intervenção;
- associação entre termos, períodos, classificações e origem dos dados;
- síntese curta de histórico técnico, sem alterar o conteúdo de origem;
- indicação da origem e do horizonte temporal da informação;
- pedidos de clarificação perante ambiguidade;
- resposta explícita quando não existirem dados suficientes.

Fora do âmbito da v0.5:

- criar automaticamente registos, tarefas, fichas ou decisões;
- inferir factos técnicos que não estejam registados;
- substituir validação humana em diagnósticos, segurança ou conformidade;
- alterar estruturas funcionais de código sem planeamento e validação próprios;
- expor detalhes internos de implementação ao utilizador.

## Princípios de produto

1. A memória é assistida, não inventada. A resposta deve apoiar-se em dados existentes.
2. A origem faz parte da resposta. Sempre que aplicável, indicar se o dado vem de Registos Diários, Histórico de Fichas, Plano Semanal, tarefas ou anomalias.
3. O tempo altera o significado. Passado, presente e futuro devem ser tratados separadamente.
4. A classificação é factual. `Importante`, `Tarefa` e outras classificações devem refletir o registo real.
5. A precisão prevalece sobre a aparência de certeza. Na dúvida, clarificar ou declarar limitação.
6. Resolver padrões, não frases isoladas. A evolução deve reutilizar mecanismos gerais de interpretação e recuperação.

## Modelo conceptual de memória

Cada elemento recuperável deve manter, quando disponível:

- termo ou entidade técnica principal;
- descrição e contexto do registo;
- data ou período;
- estado temporal: passado, presente ou futuro;
- origem do dado;
- classificação real;
- referências relacionadas: local, equipamento, material, tarefa, ficha ou anomalia;
- grau de correspondência e eventuais limitações.

A memória técnica não é uma cópia livre de texto. É uma vista assistida sobre registos existentes, em que as relações devem poder ser justificadas pela origem.

## Capacidades planeadas

### Consulta técnica contextual

Permitir perguntas como “o que foi feito nos elevadores?”, “há histórico da garagem?” ou “quando se aplicou sal?”, combinando termo, contexto e período sem depender de uma frase fixa.

### Linha temporal assistida

Resumir acontecimentos por ordem temporal, distinguindo:

- passado: intervenções concluídas e registos históricos;
- presente: pendências, anomalias e itens ainda abertos;
- futuro: tarefas planeadas e agendamentos do Plano Semanal.

### Relação entre entidades

Associar informação quando a relação estiver sustentada nos dados: por exemplo, uma tarefa ligada a um local, um material mencionado numa intervenção ou uma anomalia relacionada com um equipamento. Relações apenas plausíveis, mas não registadas, devem ser apresentadas como hipótese ou não ser apresentadas.

### Síntese com rastreabilidade

Produzir respostas curtas e úteis, seguidas da origem aplicável. Quando houver múltiplas fontes ou períodos, separar os resultados para evitar misturas de contexto.

### Clarificação orientada

Quando o pedido puder referir vários locais, equipamentos, períodos ou sentidos, a IA deve perguntar pelo elemento em falta. Pode sugerir reformulações concretas, como “refere-se ao histórico dos elevadores ou às tarefas planeadas para eles?”.

## Fluxo de resposta

1. Identificar a intenção: pesquisa, histórico, estado atual, planeamento, classificação ou origem.
2. Extrair entidades, período e qualificadores do pedido.
3. Determinar o horizonte temporal e as fontes elegíveis.
4. Recuperar correspondências relevantes sem confundir termos lexical ou semanticamente distintos.
5. Validar classificação, estado e origem antes da síntese.
6. Responder com os factos encontrados, a origem e as limitações relevantes.
7. Pedir clarificação quando existir ambiguidade material ou falta de critérios de pesquisa.

## Regras de segurança e qualidade

- Não inventar dados, causas técnicas, quantidades, datas, classificações ou relações.
- Não tratar uma ausência de resultados como confirmação de que algo nunca ocorreu.
- Não confundir termos próximos, como `sal` e `sala`, nem assuntos semanticamente distintos.
- Não misturar dados planeados com trabalho concluído ou anomalias abertas.
- Não usar linguagem interna como `cache`, `diaryCache` ou `LOGS` nas respostas ao utilizador.
- Manter a resposta proporcional aos dados disponíveis e indicar incerteza quando necessário.

## Validação planeada

A validação deve estender a matriz genérica existente em [AI_REGRESSION_MATRIX.md](AI_REGRESSION_MATRIX.md), com casos positivos, negativos e ambíguos para:

- consulta por entidade + período;
- histórico de intervenções e materiais;
- origem correta entre Registos Diários, Histórico de Fichas e Plano Semanal;
- separação passado/presente/futuro;
- classificações reais;
- relações entre equipamento, local, tarefa, anomalia e intervenção;
- termos próximos e falsos positivos;
- dados ausentes;
- perguntas com mais de uma interpretação plausível.

Cada correção deve adicionar regressões que validem o padrão geral, não apenas a formulação que revelou o problema.

## Fases de execução propostas

### Fase 1 — Inventário e contrato de dados

Mapear as fontes existentes, os campos técnicos recuperáveis e as regras de precedência. Definir o contrato de origem, tempo, classificação e estado que cada resposta deve preservar.

### Fase 2 — Interpretação e recuperação geral

Implementar a interpretação de entidades, períodos, intenção e ambiguidade, aplicando separação lexical e semântica antes da síntese.

### Fase 3 — Síntese rastreável

Compor respostas orientadas ao utilizador, com origem, horizonte temporal e limitações explícitas. Rever linguagem para garantir que não revela detalhes internos.

### Fase 4 — Regressão e endurecimento

Adicionar cobertura positiva, negativa e ambígua à matriz de regressão; testar combinações de fontes, ausência de dados e perguntas compostas.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Resposta baseada em dado errado ou semelhante | Separação lexical/semântica e validação da origem antes da resposta. |
| Mistura de histórico, pendências e plano | Horizonte temporal obrigatório na interpretação e na síntese. |
| Alucinação técnica | Responder apenas com dados recuperados; declarar ausência ou incerteza. |
| Relações técnicas incorretas | Exigir suporte explícito dos registos para estabelecer relações. |
| Correções demasiado específicas | Regressões por padrão na matriz genérica de validação. |

## Critérios de saída da v0.5

- A IA recupera informação técnica existente por entidade, período e origem sem depender de frases fixas.
- A IA distingue passado, presente e futuro de forma consistente.
- A IA apresenta classificação e origem reais quando os dados as disponibilizam.
- A IA pede clarificação em pedidos materialmente ambíguos.
- A IA declara ausência de dados sem inventar informação.
- A matriz de regressão cobre os padrões críticos de memória técnica assistida.
- A validação confirma que nenhum mecanismo interno é exposto na linguagem ao utilizador.

## Decisões a fechar antes de implementação

- Quais as fontes que entram na primeira versão da memória técnica e qual a respetiva precedência.
- Que entidades técnicas terão normalização explícita na v0.5.
- Como apresentar múltiplos resultados sem perder origem, período e classificação.
- Qual o limiar de ambiguidade que exige clarificação obrigatória.
- Que casos reais representativos devem integrar a regressão crítica inicial.
