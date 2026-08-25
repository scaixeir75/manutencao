# v0.6 — Desenho da Memória Técnica Assistida

## Objetivo

Definir uma memória técnica futura, supervisionada e rastreável, para conservar conhecimento confirmado a partir de dados reais do PMP. Esta fase é apenas de desenho: não cria persistência, não grava em Firebase e não altera regras funcionais da IA.

## Princípio de controlo humano

A IA pode identificar um padrão e sugerir uma memória, mas nunca a pode guardar, aplicar ou promover sem uma ação humana explícita. A sugestão deve ser visível, explicável, rejeitável e, futuramente, editável e apagável.

## Tipos de memória

- **Facto observado** — dado literal recuperado de registos, como intervenção, classificação ou data.
- **Inferência assistida** — leitura prudente baseada em factos, como indício de recorrência ou pendência sem resolução confirmada.
- **Recomendação operacional** — próximo passo prudente para a situação atual; não é uma memória nem uma regra permanente.
- **Regra sugerida** — formulação proposta para revisão humana; não influencia respostas futuras.
- **Regra confirmada** — regra aprovada por utilizador autorizado, com evidência e decisão rastreáveis.
- **Relação técnica confirmada** — associação aprovada entre ficha, equipamento, local, material ou ocorrência.

Não devem ser guardados diagnósticos não confirmados, texto sem origem, credenciais, dados pessoais desnecessários, opiniões sem suporte ou conclusões retiradas apenas da ausência de registos. Nenhuma memória pode apagar, reescrever ou alterar registos existentes: a memória só referencia a evidência e nunca a substitui.

## Modelo conceptual

```text
id
titulo
descricao
origem
fichaId
fichaNome
termosRelacionados
tipo
estado
criadaEm
criadaPor
confirmadaEm
confirmadaPor
baseadaEmRegistos
observacao
```

Campos recomendados: `versao`, `confianca`, `justificacao`, `rejeitadaEm`, `rejeitadaPor`, `motivoRejeicao`, `editadaEm`, `editadaPor` e `substituiMemoriaId`.

`baseadaEmRegistos` deve conter referências estáveis aos registos que sustentam a proposta. A memória deve manter origem, ficha, período, classificação e justificação; nunca ser uma cópia livre sem evidência.

## Estados

| Estado | Significado | Influencia respostas? |
| --- | --- | --- |
| `sugerida` | Aguarda revisão humana. | Não. |
| `confirmada` | Aprovada explicitamente com evidência. | Sim, identificada como regra confirmada. |
| `rejeitada` | Não aceite; conserva auditoria. | Não. |
| `substituida` | Ultrapassada por versão posterior. | Não. |
| `arquivada` | Retida para histórico. | Não. |

## Fluxo seguro futuro

1. A IA apresenta factos recuperados, origem e limitações.
2. Se houver padrão suficiente, mostra uma **regra sugerida** separada dos factos.
3. O técnico revê texto, ficha, termos e registos de base.
4. O técnico aprova, rejeita ou pede reformulação de forma explícita.
5. Só uma regra confirmada pode ser persistida e usada como contexto futuro.
6. Respostas futuras distinguem sempre facto, inferência, recomendação operacional e regra confirmada.

## Onde sugerir memória

Depois de evidência suficiente, por exemplo:

- recorrência na mesma ficha/equipamento;
- anomalia semântica com necessidade técnica reconhecível, como carregamento de extintor;
- classificação `Importante` ou `Urgente` sem resolução posterior identificada;
- relação repetida entre equipamento, intervenção e acompanhamento.

Não sugerir memória perante frase ambígua, falta de origem, dados contraditórios, termo sem ficha/contexto ou apenas porque uma regra parece plausível.

## Confirmações humanas obrigatórias

- Visualizar a regra completa e a classificação: facto, inferência ou regra.
- Confirmar ficha/equipamento e registos usados como base.
- Confirmar que o texto não declara resolução, causa ou risco sem evidência.
- Aprovar ou rejeitar explicitamente; nenhuma ação automática.
- Registar autor, data/hora e observação da decisão.
- Permitir corrigir o texto antes de aprovar.

## Exemplos de propostas futuras

| Situação | Regra sugerida |
| --- | --- |
| Solicitação de carregamento de extintor | Solicitações de carregamento de extintores podem indicar anomalia ou necessidade de intervenção técnica, devendo ser confirmadas pelo responsável. |
| Avarias repetidas no elevador 1 | Ocorrências repetidas no elevador 1 devem ser tratadas como possível recorrência até confirmação técnica de resolução. |
| Importante/Urgente sem resolução posterior | Registos marcados como Importante ou Urgente sem resolução posterior devem ser apresentados como pendentes a confirmar. |

Estes são candidatos a revisão; não são regras ativas nesta fase.

## Proteções contra regras inventadas

- Não criar sugestão sem `baseadaEmRegistos`.
- Não converter inferência em facto ou regra confirmada.
- Não usar ausência de dados como prova de resolução, causa ou inexistência.
- Não aplicar sugestões em respostas futuras.
- Usar linguagem cautelosa: “indício”, “pode indicar”, “a confirmar”.
- Preservar separação lexical e semântica, como `sal` e `sala`.
- Nunca expor detalhes internos da aplicação ao utilizador.

## Riscos

| Risco | Mitigação |
| --- | --- |
| Regra ampla a partir de caso isolado | Exigir evidência múltipla ou confirmação explícita do âmbito. |
| Confundir observação com diagnóstico | Separar visualmente facto, inferência e regra sugerida. |
| Regra obsoleta | Versionar, substituir e arquivar. |
| Evidência perdida | Guardar referências e decisão de aprovação. |
| Alteração silenciosa de comportamento | Nunca usar memória sugerida como contexto. |

## Fora de âmbito agora

- Firebase ou qualquer persistência.
- Botão definitivo de guardar, edição, eliminação ou painel de gestão.
- Sincronização, automações, criação de registos ou fecho de pendências.
- Aprendizagem automática, regras permanentes ou alteração autónoma da interpretação.

## Decisões antes da implementação

1. Perfis autorizados a aprovar, editar, arquivar e apagar memórias.
2. Armazenamento e validação das referências aos registos.
3. Interface que distingue sugestão, regra confirmada e facto.
4. Auditoria, reversão e retenção de versões.
5. Casos positivos, negativos e ambíguos a incluir na matriz de regressão.
