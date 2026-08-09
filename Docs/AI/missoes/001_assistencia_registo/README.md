# Missão 001 — Assistência ao Registo Técnico

## Objetivo

Apoiar o técnico na preparação de um registo de manutenção claro, classificado e acompanhado por uma avaliação prudente de risco e próximos passos.

## Estado atual

**Versão:** v0.8B

**Estado:** Supervisão Humana refletida no painel Assistente IA.

## Integração

A missão está disponível como apoio no ecrã de Registos Diários:

- o painel está sempre visível no ecrã de Registos Diários;
- antes da ativação, informa que são necessários pelo menos 12 caracteres;
- a análise continua a ser executada apenas quando a descrição tem pelo menos 12 caracteres;
- a Missão 001 simulada é executada através do orquestrador;
- são apresentados tipo, prioridade, resumo, risco, próxima ação, informação em falta e confirmação humana;
- a prioridade `media` é apresentada como `Média`;
- o risco `indeterminado` é apresentado como `Indeterminado`;
- quando o risco é indeterminado, é apresentada nota de histórico insuficiente;
- o tipo, a prioridade e o risco são apresentados com badges;
- o resumo e a próxima ação têm blocos próprios;
- existem botões pequenos para copiar o resumo e a próxima ação;
- existe um botão para copiar a sugestão completa;
- a sugestão completa é formatada para apoio ao registo técnico;
- a sugestão completa inclui nota de supervisão humana antes de ações críticas;
- existe fallback defensivo quando a cópia não está disponível;
- a informação em falta é apresentada como lista;
- a confirmação é apresentada como `Confirmação do técnico necessária`;
- é apresentada nota discreta de supervisão humana;
- o painel comunica que a sugestão não altera registos nem executa ações críticas;
- o texto escrito pelo técnico nunca é alterado;
- os registos em memória são fornecidos à missão através de `historyRecords`;
- a ferramenta Consultar Histórico converte esses registos sem os alterar;
- apenas ocorrências com palavras-chave técnicas equivalentes são devolvidas;
- o risco varia entre indeterminado, médio e alto conforme o número de ocorrências semelhantes;
- a próxima ação é ajustada ao sintoma identificado;
- sem histórico disponível, a missão continua com uma lista vazia;
- a IA apenas sugere e não grava dados;
- em caso de falha, é apresentada uma mensagem de indisponibilidade.

## Limites

- Sem chamadas externas.
- Sem modelos ou fornecedores externos de IA.
- Sem dependências novas.
- Sem alteração automática de campos.
- Sem criação de campos novos.
- Sem alteração da lógica de gravação.
- Sem importação direta de `initialRecords` pela IA.
- Sem persistência nova.
- Sem alteração do layout global da aplicação.
- Sem alteração da navegação, formulário, cards exteriores ou lógica de gravação.
- Sem alteração de agentes, ferramentas, orquestrador ou tipos.
- Sem aplicação automática de tipo, prioridade, resumo ou próxima ação.
- Sem execução de ações críticas sem validação humana.
- Sem criação de agente executável de supervisão humana nesta fase.

## Validação

- TypeScript sem erros.
- Fluxo simulado ponta a ponta validado.
- Apresentação validada em desktop e móvel.
- Sem sobreposições ou deslocamento horizontal.
- Sem erros no browser.
- Sem warnings no browser.
- Móvel 390x844 validado sem overflow horizontal.
- Controlo manual por cópia validado.
- Estado inicial com menos de 12 caracteres validado.
- Nota de histórico insuficiente validada.
- Nota de supervisão humana validada.
- Sugestão completa com nota de supervisão humana validada.
- Teste da Missão 001 concluído com sucesso.
- `git diff --check` sem problemas.
- Risco médio quando existe uma ocorrência semelhante.
- Risco indeterminado quando não existe histórico.
- Risco alto quando existem duas ou mais ocorrências semelhantes.
- Ações específicas validadas para sintomas mecânicos, fuga de água, aquecimento e alimentação elétrica.
- Imutabilidade dos registos históricos validada.
- Sem alterações em `seed.ts`, `package.json` ou `package-lock.json`.

## Documentos relacionados

- `especificacao.md`
- `fluxo.md`
- `testes.md`
