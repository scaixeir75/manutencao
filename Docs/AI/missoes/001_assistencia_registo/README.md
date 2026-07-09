# Missão 001 — Assistência ao Registo Técnico

## Objetivo

Apoiar o técnico na preparação de um registo de manutenção claro, classificado e acompanhado por uma avaliação prudente de risco e próximos passos.

## Estado atual

**Versão:** v0.4  
**Commit:** `26625bb03ce68cde079e95b1ff1ccccdd0dedf93`  
**Estado:** Ligação ao histórico em memória concluída.

## Integração

A missão está disponível como apoio no ecrã de Registos Diários:

- o painel aparece quando a descrição tem pelo menos 12 caracteres;
- a Missão 001 simulada é executada através do orquestrador;
- são apresentados tipo, prioridade, resumo, risco, próxima ação, informação em falta e confirmação humana;
- a prioridade `media` é apresentada como `Média`;
- o risco `indeterminado` é apresentado como `Indeterminado`;
- a informação em falta é apresentada como lista;
- a confirmação é apresentada como `Confirmação do técnico necessária`;
- o texto escrito pelo técnico nunca é alterado;
- os registos em memória são fornecidos à missão através de `historyRecords`;
- a ferramenta Consultar Histórico converte esses registos sem os alterar;
- sem histórico disponível, a missão continua com uma lista vazia;
- a IA apenas sugere e não grava dados;
- em caso de falha, é apresentada uma mensagem de indisponibilidade.

## Limites

- Sem chamadas externas.
- Sem modelos ou fornecedores externos de IA.
- Sem dependências novas.
- Sem alteração automática de campos.
- Sem alteração da lógica de gravação.
- Sem importação direta de `initialRecords` pela IA.
- Sem persistência nova.

## Validação

- TypeScript sem erros.
- Fluxo simulado ponta a ponta validado.
- Apresentação validada em desktop e móvel.
- Sem sobreposições ou deslocamento horizontal.
- Sem erros no browser.
- Teste da Missão 001 concluído com sucesso.
- `git diff --check` sem problemas.
- Risco médio quando existe uma ocorrência semelhante.
- Risco indeterminado quando não existe histórico.
- Sem alterações em `seed.ts`, `package.json` ou `package-lock.json`.

## Documentos relacionados

- `especificacao.md`
- `fluxo.md`
- `testes.md`
