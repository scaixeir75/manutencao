# Contexto Mestre do Sistema Operativo de IA

## Finalidade

O Sistema Operativo de IA do PMP apoia o técnico na criação de registos de manutenção mais claros, consistentes e rastreáveis. A IA produz sugestões; o técnico revê, corrige e confirma o conteúdo.

Este documento define os conceitos comuns a todas as missões. As regras funcionais do PMP continuam a ser determinadas pela documentação principal do projeto, nomeadamente o modelo de domínio, as regras de negócio, a arquitetura do sistema e o mapa da aplicação.

## Assistente IA

O Assistente IA é a interface entre o técnico e o sistema de IA. Recebe o pedido e o contexto disponível, apresenta o resultado consolidado e solicita confirmação quando necessário.

O Assistente IA não substitui o técnico, não grava dados autonomamente e não apresenta sugestões como decisões já tomadas.

## Orquestrador

O Orquestrador identifica a missão aplicável e coordena os agentes e ferramentas pela ordem definida no respetivo fluxo.

É responsável por:

- preparar o contexto necessário;
- encaminhar resultados entre componentes;
- registar lacunas, conflitos ou falhas;
- impedir a execução de componentes fora da missão;
- entregar os resultados ao agente de composição da resposta.

O Orquestrador não executa a análise especializada atribuída aos agentes.

## Missões

Uma missão representa um objetivo completo do utilizador. Cada missão define:

- quando deve ser usada;
- entradas obrigatórias e opcionais;
- agentes e ferramentas autorizados;
- ordem de execução;
- resultado esperado;
- limites e critérios de qualidade;
- testes de aceitação.

A missão atualmente definida é a **Missão 001 — Assistência ao Registo Técnico**.

Na versão v0.5, esta missão dispõe de inteligência simulada melhorada, com correspondência técnica no histórico, avaliação de risco por repetição e próxima ação ajustada ao sintoma.

Na versão v0.6, o painel visual do Assistente IA foi refinado sem alterar o layout global da aplicação.

Na versão v0.7, o controlo manual do técnico foi reforçado com a ação "Copiar sugestão completa", mantendo a regra de não alterar automaticamente campos do formulário.

Na versão v0.8, o painel Assistente IA passou a apresentar um estado visível antes da ativação e uma nota explícita quando o histórico é insuficiente para avaliar risco com confiança.

Na versão v0.8A, foi desenhada funcionalmente a ferramenta `consultar_historico_equipamento`, apenas em documentação, para consulta de registos anteriores associados a um equipamento.

Na versão v0.8B, a Supervisão Humana foi integrada como regra transversal, sem criação de agente executável.

Na versão v0.9, foi implementada de forma aditiva a função técnica `consultarHistoricoEquipamento`, preservando `consultHistory` e a Missão 001.

Na versão v1.0, a Missão 001 foi fechada documentalmente como experiência estável, simulada e controlada, sem integração externa.

## Agentes

Os agentes são componentes especializados com uma única responsabilidade principal. Na Missão 001 existem:

- Agente de Classificação;
- Agente de Resumo Técnico;
- Agente de Avaliação de Risco;
- Agente de Planeamento;
- Agente de Composição da Resposta.

Os contratos detalhados encontram-se em `agentes/<nome>/especificacao.md`.

## Ferramentas

As ferramentas permitem consultar informação interna do PMP de forma controlada. Na Missão 001 estão previstas:

- Consultar Histórico;
- Consultar Equipamento;
- Consultar Fotografias.
- Consultar Histórico do Equipamento, com implementação técnica inicial aditiva v0.9.

As ferramentas são apenas de leitura: não criam, editam ou eliminam registos.

Na versão v0.4, a ferramenta Consultar Histórico recebe os registos da aplicação por injeção de dependências. Não importa diretamente os dados seed nem altera o array recebido.

Na versão v0.5, a ferramenta devolve apenas ocorrências relevantes através de grupos simples de palavras-chave equivalentes para sintomas mecânicos, centrifugação, fuga de água, erro ou avaria, aquecimento e alimentação elétrica.

Na versão v0.8A, `consultar_historico_equipamento` foi definida como especialização documental de consulta por `equipamento_id`. Na versão v0.9, a função `consultarHistoricoEquipamento` foi implementada de forma aditiva e coexiste com `consultHistory`.

## Base de Conhecimento

A Base de Conhecimento é o conjunto de fontes autorizadas que permite interpretar corretamente o domínio do PMP:

- documentação funcional em `Docs/Core/`;
- fichas e registos de manutenção disponíveis no sistema;
- dados de equipamentos;
- histórico de registos;
- fotografias associadas aos registos;
- especificações aprovadas em `Docs/AI/`.

Uma fonte só pode ser usada quando estiver disponível e tiver sido efetivamente consultada.

## Memória

A Memória preserva contexto relevante para manter continuidade e consistência entre interações. Deve distinguir informação confirmada de hipóteses e respeitar a origem dos dados.

A memória não substitui a Base de Conhecimento, não deve guardar conclusões não confirmadas como factos e não autoriza alterações aos dados do PMP.

## Modelo de funcionamento

```text
Técnico
→ Assistente IA
→ Orquestrador
→ Missão
→ Agentes e ferramentas autorizados
→ Composição da resposta
→ Técnico valida
```

## Regras transversais

- A data é obrigatória num registo de manutenção.
- A associação a equipamento é opcional.
- Os tipos reconhecidos são `Tarefa`, `Visita` e `Importante`.
- A implementação simulada pode propor a classificação técnica `Anomalia / Corretiva`, sujeita a confirmação humana.
- Um registo pode conter descrição livre e zero ou mais fotografias.
- O histórico agrega todos os registos, independentemente da origem.
- Factos, inferências e sugestões devem permanecer separados.
- Informação em falta deve ser assinalada.
- A confirmação humana precede qualquer gravação.
- Qualquer ação crítica exige validação humana explícita.
- A IA deve separar factos observados, inferências e recomendações.
- Quando faltar contexto, deve indicar `Informação insuficiente`.
- A recomendação final deve ser apresentada como sugestão, não como decisão automática.

## Limites atuais

Existe uma implementação técnica simulada da Missão 001 em `SRC/features/ai/`. Esta implementação:

- executa o fluxo completo através da missão e do orquestrador;
- usa respostas locais e determinísticas;
- não realiza chamadas externas;
- não utiliza modelos ou fornecedores de IA;
- apresenta um painel discreto no ecrã de Registos Diários;
- antes da ativação, informa que são necessários pelo menos 12 caracteres de descrição;
- continua a executar a missão apenas quando a descrição tem pelo menos 12 caracteres;
- apresenta prioridade e risco com etiquetas legíveis em Português de Portugal;
- apresenta a informação em falta como lista;
- indica de forma explícita que é necessária confirmação do técnico;
- comunica que a sugestão não altera registos nem executa ações críticas;
- apresenta apenas sugestões e nunca altera o texto do técnico;
- recebe o histórico em memória através de `historyRecords`;
- trata o histórico como `readonly MaintenanceRecord[]`;
- converte os registos recebidos em entradas de histórico para a IA;
- seleciona apenas ocorrências com grupos técnicos equivalentes ao texto atual;
- atribui risco indeterminado sem ocorrências relevantes, médio com uma ocorrência e alto com duas ou mais;
- comunica explicitamente quando o histórico é insuficiente para avaliar risco com confiança;
- propõe uma próxima ação específica para sintomas mecânicos, fuga de água, falha de aquecimento ou falha de alimentação;
- usa uma lista vazia como fallback quando o histórico não é fornecido;
- prevê uma mensagem simples de indisponibilidade;
- apresenta badges para tipo, prioridade e risco;
- apresenta resumo e próxima ação em blocos próprios;
- inclui botões pequenos para copiar o resumo e a próxima ação;
- inclui um botão para copiar a sugestão completa em texto formatado;
- inclui nota de supervisão humana na sugestão completa;
- usa fallback defensivo quando a cópia não está disponível;
- mantém ajustes móveis restritos ao painel IA;
- não cria campos novos no formulário;
- não altera automaticamente descrição, tipo, prioridade ou qualquer outro campo;
- não grava dados nem altera a lógica de gravação;
- não acrescenta dependências.

O teste ponta a ponta encontra-se em `SRC/features/ai/tests/assistTechnicalRecordMission.test.ts`.

## Estado técnico

**Versão:** v1.0

**Estado:** Fecho estável documental da Missão 001 simulada/controlada.

O cenário validado classifica um ruído durante a centrifugação como `Anomalia / Corretiva`, atribui prioridade média e mantém o risco indeterminado por ausência de histórico. O resultado identifica modelo, fotografia e histórico como informação em falta e exige confirmação humana.

Sem histórico relevante, o risco permanece indeterminado. Uma ocorrência semelhante resulta em risco médio e duas ou mais ocorrências semelhantes resultam em risco alto. A validação humana continua obrigatória.

Não existe persistência nova: os dados continuam a ser os registos em memória já fornecidos pela aplicação. Não foram alterados `seed.ts`, `package.json` ou `package-lock.json`, não existem chamadas externas e não foram acrescentadas dependências.

Na v0.6, o commit `4442e7ca8443156112cf2375e37684eecfcad9cb` refinou apenas a apresentação interna do painel Assistente IA. Não foram alterados a navegação, o formulário, os cards exteriores, a lógica de gravação ou o layout global da aplicação.

Na v0.7, o painel passou a permitir copiar a sugestão completa, incluindo tipo, prioridade, resumo, risco, próxima ação, informação em falta e nota de confirmação humana. A ação é manual e explícita; a IA continua apenas a sugerir.

Na v0.8, o painel passou a estar sempre visível no ecrã de Registos Diários. A ativação da análise continua dependente de pelo menos 12 caracteres na descrição, e o risco indeterminado passa a ser acompanhado por uma nota discreta de histórico insuficiente. O formulário, os dados e a lógica de gravação permanecem inalterados.

Na v0.8A, não existe implementação técnica nova. A ferramenta `consultar_historico_equipamento` fica documentada como apenas de leitura, com entrada obrigatória `equipamento_id`, entrada opcional `limite`, saída limitada a `data`, `tipo_registo`, `descricao` e `estado`, e erros `equipamento_inexistente`, `historico_indisponivel` e `identificador_em_falta`.

Na v0.8B, Supervisão Humana é uma regra transversal documentada em `Docs/AI/regras/supervisao_humana.md`. Não existe agente executável novo. Ações críticas, como criar alerta preventivo, alterar prioridade, fechar registo, gerar relatório oficial ou sugerir paragem de equipamento, exigem aprovação humana.

Na v0.9, `consultarHistoricoEquipamento` filtra registos por `equipmentId`, ordena por data descendente quando possível, aplica `limite` positivo e devolve `entries`, `error` e `message` quando aplicável. O campo `estado` permanece A confirmar, porque não existe em `MaintenanceRecord`. Não foram alterados orquestrador, Missão 001, domínio, seed, ecrãs ou lógica de gravação.

## Fecho v1.0 da Missão 001

A v1.0 fecha documentalmente a Missão 001 — Assistência ao Registo Técnico como experiência simulada/controlada estável.

### Implementado

- Assistente IA integrado no ecrã de Registos Diários.
- Painel IA visível com estados de ativação, análise, sugestão pronta e erro discreto.
- Ativação da análise com pelo menos 12 caracteres na descrição.
- Classificação simulada/controlada.
- Resumo técnico.
- Consulta de histórico através de `consultHistory`.
- Avaliação de risco.
- Próxima ação sugerida.
- Informação em falta.
- Cópia manual de resumo, próxima ação e sugestão completa.
- Supervisão humana visível no painel.
- Nenhum campo alterado automaticamente.
- Nenhuma ação crítica executada automaticamente.

### Documentado

- `consultarHistoricoEquipamento` existe tecnicamente desde v0.9.
- A ferramenta é aditiva, apenas de leitura e filtra registos por equipamento.
- A ferramenta não inventa o campo `estado`; esse campo permanece A confirmar.
- A ferramenta ainda não é usada pela Missão 001.

### Limites

- Não existe modelo real de IA.
- Não existe API externa.
- Não existe persistência nova.
- Não existe alteração automática do formulário.
- Não existe criação automática de alertas.
- Não existe fecho automático de registos.
- Não existe validação real de equipamento inexistente.
- `equipamentoId` ainda não é recolhido no formulário de Registos Diários.

### Futuro

A v1.1 ou v1.2 poderá preparar a Missão 002 — Resumo de Equipamento, incluindo eventual integração de `consultarHistoricoEquipamento` num fluxo próprio. Qualquer ação crítica continuará sujeita a supervisão humana.

## Fecho do ciclo de anomalias pendentes IA

Em 14/08/2026 ficou validado o ciclo operacional de anomalias pendentes no Assistente IA e nos cartões das fichas.

Estado validado:

- Login e PWA funcionam após correção de sintaxe e atualização da cache PWA.
- A pesquisa `corte de água` filtra resultados irrelevantes como relva, iluminação e luminárias.
- Texto genérico como `Problema para identificar` devolve apenas `Informação insuficiente.`
- `Autoclismo` identifica a Ficha 29 — Instalações Sanitárias.
- `Autoclismo com fuga de água` identifica a Ficha 29 com histórico e recorrência quando existem dados.
- Anomalias pendentes aparecem como itens/cartões vermelhos individuais na resposta da IA.
- Cada anomalia pendente tem ação humana explícita `Corrigir`.
- A ação `Corrigir` cria novo registo de correção e preserva o registo original da anomalia.
- Anomalias corrigidas manualmente deixam de contar como pendentes.
- O badge `⚠ ANOMALIA` nos cartões das fichas usa a mesma lista global de pendentes da IA.
- A Ficha 20 foi validada: a anomalia original do forno permanece no histórico, a correção manual foi criada, deixou de aparecer como pendente e o cartão deixou de mostrar `⚠ ANOMALIA`.
- O histórico continua a ser a memória técnica pesquisável; não existe memória artificial separada.

Commits relevantes:

- `64ed732` — `fix: resolver anomalias corrigidas manualmente`
- `caef69b` — `fix: mostrar possiveis anomalias como pendentes`
- `03c78f3` — `fix: manter possiveis anomalias como pendentes`
- `22ebc77` — `fix: tornar resolucao de anomalias mais especifica`
- `bad5b86` — `fix: alinhar badge com lista global de pendentes`
- `987b04c` — `fix: atualizar cache da pwa`
- `b51933e` — `fix: corrigir sintaxe que bloqueava login`

## Versão estável IA v0.3

Em 15/08/2026 foi criada e publicada a tag estável `v0.3-ai-historico-seguranca-robustez-stable`.

Estado validado:

- app publicada validada após push para `origin/main`;
- headed remoto concluído com `9 passed`;
- backtest concluído com sucesso;
- working tree limpa no momento da criação da tag;
- versão publicada alinhada com a validação local e remota.

Objetivo da v0.3:

- fechar uma base estável do Assistente IA transversal ao PMP;
- consolidar histórico, segurança, robustez linguística e pendências reais;
- garantir validação rastreável antes de novos blocos funcionais.

Melhorias principais consolidadas:

- histórico IA por ficha com perguntas sobre última intervenção, histórico e contagens;
- parser robusto de ficha explícita, incluindo variantes como `Ficha #20`, `Ficha: 20`, `ficha_20` e `ficha-20`;
- contagens por ficha com resposta baseada em dados reais;
- pesquisa por palavra completa, preservando regras como `sal ≠ sala`;
- pesquisa relacional mais criteriosa, preservando regras como `corte de água ≠ corte da relva`;
- anomalias pendentes com lógica comum entre IA, histórico e badge visual;
- ação humana `Corrigir` com criação de registo posterior e preservação do histórico original;
- elevadores associados à Ficha 19 quando existem registos fortes sem `fichaId` explícito;
- badge `⚠ ANOMALIA` coerente com a lista global de pendências;
- prompts longos de autoclismo focados em Ficha 29 — Instalações Sanitárias;
- segurança e anti-exfiltração com resposta formal, recusa reforçada e bloqueio temporário por sessão;
- automação Playwright com `storageState`, autenticação manual e suite dividida em grupos estáveis.

Riscos resolvidos na v0.3:

- login bloqueado por erro de sintaxe local;
- PWA instalada presa a cache antiga;
- falsas sugestões de ficha em texto genérico;
- confusão entre badge histórico e pendência real;
- correções não relacionadas a fechar anomalias indevidamente;
- falhas por substring simples na pesquisa (`sal`/`sala`);
- timeout remoto no grupo de anti-exfiltração;
- confusão entre elevadores e cozinha em perguntas ambíguas.

Próximos blocos sugeridos:

- melhorar explicabilidade das respostas IA, separando melhor factos, inferências e limites;
- criar painel de pendências por ficha com navegação mais direta;
- documentar o mapa de estados das anomalias pendentes, possíveis e resolvidas;
- separar gradualmente o motor IA do `index.html` para testes unitários mais fortes;
- continuar a expandir testes com novos casos sem repetir cenários já cobertos.
