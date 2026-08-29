# Matriz Genérica de Validação da IA

## Objetivo

Esta matriz serve para validar comportamentos gerais da IA do PMP, e não a resposta a frases fixas ou a exemplos isolados. Os testes devem confirmar que a IA interpreta corretamente diferentes formulações, fontes de dados, classificações e horizontes temporais.

## Princípio central

Resolver padrões, não exemplos.

Uma correção deve melhorar o mecanismo de interpretação e recuperação de dados para toda a família de pedidos relacionada, sem criar respostas especiais para uma frase específica.

## Como usar esta matriz

Para cada alteração à interpretação da IA, identificar primeiro o padrão afetado — termo, período, quantidade, classificação, origem ou horizonte temporal. Depois, selecionar ou adicionar pelo menos um caso positivo, um negativo e um ambíguo que representem esse padrão. Os exemplos deste documento são representativos e não constituem uma lista fechada de frases a testar.

## Padrões de validação

### 1. Pesquisa curta por termo + período

Validar variações naturais de um termo associado a um ano ou período:

- `[termo] em [ano]`
- `[termo] [ano]`
- `sal em 2026`
- `sala em 2026`
- `elevadores 2026`
- `garagem 2026`

### 2. Pesquisa quantitativa

Validar pedidos que exigem contagem, soma ou outra quantificação explícita:

- `quantos [unidade] de [termo] em [período]`
- `total de [termo] em [período]`
- `quantos quilos de sal em 2026`

### 3. Perguntas compostas

Validar pedidos com duas intenções relacionadas na mesma pergunta:

- `[pergunta A] e [pergunta B]`
- `quantos quilos de sal em 2026 e estão nos registos de tarefas?`

### 4. Classificação real

Validar a classificação efetivamente registada, sem inferir uma classificação a partir do texto:

- `está como Tarefa?`
- `está como Importante?`
- `está registado como [classificação]?`

### 5. Origem dos dados

Validar se a IA identifica corretamente a origem do dado:

- `onde está registado?`
- `está nos Registos Diários?`
- `está no Histórico de Fichas?`
- `está no Plano Semanal?`

### 6. Separação lexical e semântica

Validar que termos parecidos ou contextos diferentes não são confundidos:

- `sal ≠ sala`
- `sala ≠ sal`
- `água ≠ corte da relva`

### 7. Ambiguidade

Quando houver várias interpretações plausíveis, a IA deve pedir clarificação ou sugerir reformulações. Não deve escolher silenciosamente uma interpretação que possa produzir uma resposta enganadora.

### 8. Validação por horizonte temporal

Validar que a IA consulta o conjunto de dados adequado ao horizonte temporal:

- passado: Registos Diários / Histórico de Fichas;
- presente: pendências / anomalias abertas;
- futuro: Plano Semanal / tarefas agendadas.

## Casos positivos

Os casos positivos devem cobrir diferentes formulações do mesmo padrão e confirmar que a IA encontra os dados corretos, responde à intenção completa, identifica a origem e preserva as classificações reais. Devem incluir variações de capitalização, ordem das palavras, termos equivalentes e perguntas curtas ou compostas.

## Casos negativos

Os casos negativos devem confirmar que a IA não mistura termos lexicalmente próximos, não atribui classificações inexistentes, não consulta a origem errada, não transforma ausência de dados em confirmação e não inventa valores, datas ou registos.

## Casos de ambiguidade

Os casos de ambiguidade devem confirmar que a IA reconhece pedidos incompletos ou com mais de uma interpretação plausível. O resultado esperado é uma pergunta de clarificação ou uma reformulação sugerida, com indicação clara do que falta para responder com segurança.

## Regressões críticas

Devem ser mantidas regressões para, pelo menos:

- pesquisa curta por termo e período;
- pesquisas quantitativas e totais aproximados;
- perguntas compostas;
- classificação real `Importante`/`Tarefa`;
- identificação da origem dos dados;
- distinção `sal`/`sala`;
- distinção entre água e corte da relva;
- passado, presente e futuro;
- pedidos ambíguos;
- ausência de dados e prevenção de invenções.

## Regras para futuras correções

- nunca corrigir apenas o exemplo isolado;
- identificar causa estrutural;
- corrigir mecanismo geral;
- criar regressões positivas, negativas e ambíguas;
- não aumentar falsos positivos;
- não inventar dados;
- não usar linguagem interna como `cache`, `diaryCache` ou `LOGS`.

## Estado v0.4

v0.4 já inclui:

- Assistente IA recolhível;
- launcher ✨;
- spotlight;
- perguntas curtas;
- perguntas compostas;
- distinção sal/sala;
- total aproximado de sal;
- classificação real Importante/Tarefa;
- guard genérico de interpretação;
- documentação v0.4;
- tag v0.4.
