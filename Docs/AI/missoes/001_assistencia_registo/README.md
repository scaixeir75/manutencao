# Missão 001 — Assistência ao Registo Técnico

## Objetivo

Apoiar o técnico na preparação de um registo de manutenção claro, classificado e acompanhado por uma avaliação prudente de risco e próximos passos.

## Estado atual

**Versão:** v0.2  
**Estado:** Integração visual controlada concluída.

## Integração

A missão está disponível como apoio no ecrã de Registos Diários:

- o painel aparece quando a descrição tem pelo menos 12 caracteres;
- a Missão 001 simulada é executada através do orquestrador;
- são apresentados tipo, prioridade, resumo, risco, próxima ação, informação em falta e confirmação humana;
- o texto escrito pelo técnico nunca é alterado;
- a IA apenas sugere e não grava dados;
- em caso de falha, é apresentada uma mensagem de indisponibilidade.

## Limites

- Sem chamadas externas.
- Sem modelos ou fornecedores externos de IA.
- Sem dependências novas.
- Sem alteração automática de campos.
- Sem alteração da lógica de gravação.

## Validação

- TypeScript sem erros.
- Fluxo simulado ponta a ponta validado.
- Apresentação validada em desktop e móvel.
- Sem sobreposições ou deslocamento horizontal.
- Sem erros no browser.

## Documentos relacionados

- `especificacao.md`
- `fluxo.md`
- `testes.md`

