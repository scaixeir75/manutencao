# Regra Transversal — Supervisão Humana

## Estado

**Versão:** v0.8B  
**Estado:** Regra transversal documentada, sem agente executável.

## Definição

Supervisão Humana é uma regra transversal do Sistema Operativo de IA do PMP. Não é um agente executável nesta fase.

A IA pode apresentar sugestões, resumir informação, organizar contexto e propor próximos passos, mas não pode executar ações críticas sem validação humana explícita.

## Ações críticas

As seguintes ações exigem aprovação humana:

- Criar alerta preventivo.
- Alterar prioridade de uma intervenção.
- Fechar registo.
- Gerar relatório oficial.
- Sugerir paragem de equipamento.

## Regras obrigatórias

- Nunca executar ações críticas sem validação humana.
- Explicar sempre o motivo da recomendação.
- Separar factos observados de inferências.
- Usar "Informação insuficiente" quando faltar contexto.
- Apresentar a recomendação final como sugestão, não como decisão automática.

## Limites

- Não cria, altera, fecha ou apaga registos.
- Não altera prioridade automaticamente.
- Não gera alertas automaticamente.
- Não substitui validação humana.
- Não assume sensores, telemetria ou dados preditivos.
- Não autoriza ações fora das permissões definidas pela missão.

## Aplicação atual

Na v0.8B, o painel Assistente IA comunica explicitamente:

```text
Supervisão humana necessária: esta sugestão não altera registos nem executa ações críticas.
```

A sugestão completa copiada pelo técnico inclui:

```text
Nota: Supervisão humana necessária antes de qualquer ação crítica.
```

## Validação

A regra deve ser validada em qualquer missão que produza recomendações, planos, prioridades, alertas, relatórios ou ações sobre equipamentos.