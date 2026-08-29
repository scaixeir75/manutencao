# Estado Operacional Atual — IA PMP v0.8

**Atualizado:** 29/08/2026
**Referência estável publicada:** `v0.8`
**Commit de referência:** `806ca4c fix: reforcar normalizacao tecnica generica da ia`
**Implementação principal:** `index.html`

## Leitura obrigatória para continuidade

1. `AI_CURRENT_STATE.md` — estado implementado e limites atuais.
2. `AI_MASTER_CONTEXT.md` — princípios e regras transversais.
3. `AI_DECISIONS.md.txt` — decisões cronológicas.
4. `AI_MEMORY.md.txt` — memória operacional persistente.
5. `missoes/001_assistencia_registo/` — especificação histórica da Missão 001.

## Superfícies do Assistente IA

O Assistente IA está disponível no **Plano Semanal** e em **Registos Diários**. No estado inicial apresenta apenas o launcher `✨`, fixo no canto superior direito abaixo do logout. O launcher tem acabamento verde-prata e mantém rótulo acessível: `Abrir Assistente IA`.

Ao abrir, o assistente é apresentado como diálogo em destaque, com overlay escura e blur suave sobre a página. Fecha por `Recolher`, clique fora do painel ou `Esc`. O painel continua responsivo a 390px sem overflow horizontal.

Cada painel preserva:

- pergunta escrita e ditado;
- ação `Perguntar à IA` e `Limpar`;
- cópia de pergunta e resposta, com feedback visual;
- sugestões, reformulações clicáveis e edição manual;
- nota permanente de supervisão humana.

Abrir ou fechar o painel não altera Firebase, registos, plano ou campos de formulário.

## Consultas locais implementadas

As respostas são locais e determinísticas. Consultam apenas caches já carregadas de Registos Diários, histórico das fichas, catálogo e plano semanal. Não existe modelo externo, API externa, nova persistência ou memória artificial.

### Normalização técnica e pesquisa histórica

Antes da pesquisa, a IA normaliza acentos, maiúsculas/minúsculas, hífens, espaços, termos unidos e plural simples. A resolução de pequenas variações é limitada a um candidato técnico único presente no vocabulário disponível, para evitar falsos positivos.

Esta camada trata padrões reutilizáveis, não frases isoladas. Por exemplo, variantes como `d-trex`, `d trex`, `dtrex` e `detrex` podem convergir para o mesmo termo técnico quando existir um único candidato seguro. Termos ambíguos isolados, como `pêra`/`pera`, mantêm a resposta `Informação insuficiente.`; expressões com contexto técnico, como `pêra de chamada`, podem ser associadas à Ficha 14.

O filtro do Histórico de Fichas usa os mesmos termos fortes normalizados e pesquisa o conteúdo próprio de cada registo, sem considerar o nome da ficha como se estivesse presente em todas as ocorrências. Assim, uma sugestão de ficha não faz aparecer intervenções não relacionadas.

### Perguntas quantitativas e compostas

Consultas de sal reconhecem quantidades explícitas em kg. O termo é comparado por palavra completa (`sal` não corresponde a `sala`).

Exemplo: `quantos quilos de sal em 2026 e estão nos registos de tarefas?`

- calcula o total em kg a partir de quantidades explícitas;
- informa se o total é aproximado quando a origem contém indicador de aproximação;
- responde diretamente `Sim`, `Não` ou `Parcialmente` à componente `Tarefa`;
- usa a classificação realmente gravada: `Tarefa` (`info`), `Visita` (`aviso`) ou `Importante` (`urgente`);
- identifica entradas do Histórico de Fichas como sem classificação de Registo Diário;
- não inventa classificação nem quantidade em falta.

### Pesquisas curtas com período

Termo pesquisável + ano explícito é uma consulta válida, mesmo curta. Exemplo: `sal em 2026`.

A resposta curta contém apenas dados reais:

```text
Pesquisa por “sal” em 2026.

Total: N registos.
Total aproximado: X kg.

Origem:
- Registos Diários: N.

Detalhe:
- data — origem/classificação — resumo do registo
```

As origens com zero resultados são ocultadas. São mostrados até oito registos mais recentes; quando existirem mais, a resposta declara esse limite. Se não houver quantidade explícita, não calcula kg e informa a limitação.

## Limites e regras de segurança

- A IA não grava, edita ou elimina dados autonomamente.
- O técnico confirma todas as ações e interpretações operacionais.
- Pedidos de código, credenciais, chaves, prompts internos, bypass de login ou dados privados são recusados; repetições podem bloquear a sessão temporariamente.
- `Informação insuficiente.` mantém-se para texto genérico, referências de ficha incompletas ou ausência de contexto pesquisável.
- Correções de anomalias continuam a exigir ação humana explícita `Corrigir`.

## Validação de referência

- `npm.cmd run test:ai:backtest` passou para a linha v0.8.
- `git diff --check` passou antes do commit estável.
- Validação visual anterior confirmou launcher, spotlight, fecho por botão/clique fora/Esc e viewport móvel 390px.
- Validação em dados reais confirmou equivalência técnica Detrex, contexto de chamada de enfermeiro, pesquisa histórica de máquina de secar roupa, totais de sal, distinção `sal`/`sala`, anomalias pendentes de elevadores, extintores e resposta cautelosa para `máquinas`.
- O erro de atualização do Service Worker observado em `http://127.0.0.1:8095` pertence ao servidor local de validação e não à interpretação da IA.

## Commits que definem a linha v0.8

- `806ca4c` — normalização técnica genérica, pesquisa forte de histórico e proteção contra falsos positivos.
- `c72a971` — matriz genérica de regressão da IA.
- `3a24755` — normalização genérica inicial da pesquisa da IA.
- `eab00a6` — pesquisa histórica de máquina de secar/secador.
- `3031382` — data real na correção de anomalias.

- `33115ca` — respostas curtas e perguntas compostas da IA.
- `9d1d86e` — Assistente IA destacado no topo.
- `5a94344` — Assistente IA recolhível.
- `3902782` — alinhamento das contagens de reformulações.
- `efbde23` — reformulações clicáveis.
- `c156120` — sugestões orientadas ao utilizador.
- `06b3651` — ações de cópia no Assistente IA.
- `85800e4` — interpretação quantitativa reforçada.

## Próxima intervenção segura

Antes de alterar o motor local em `index.html`, preservar os contratos acima, adicionar um cenário ao backtest quando aplicável e não modificar Firebase/dados sem pedido explícito.
