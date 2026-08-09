# Ferramenta — Consultar Histórico do Equipamento

Documentação funcional e técnica inicial da ferramenta `consultar_historico_equipamento`.

## Estado

**Versão:** v0.9
**Estado:** implementação técnica inicial aditiva.

## Implementação

A função técnica criada é `consultarHistoricoEquipamento`, em `SRC/features/ai/tools/historyTool.ts`.

A implementação é local, determinística e apenas de leitura. Não substitui `consultHistory` e não altera o comportamento atual da Missão 001.

## Limite confirmado

O campo `estado` permanece **A confirmar**, porque não existe em `MaintenanceRecord`. Por isso, a implementação técnica v0.9 não devolve `estado` como dado real.

A especificação completa encontra-se em `especificacao.md`.