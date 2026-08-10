# Testes da Missão 001 — Assistência ao Registo Técnico

## Estado atual

**Versão:** v1.0

**Estado:** testes mínimos da Missão 001 simulada/controlada validados.

A v1.0 fecha documentalmente a Missão 001 no estado estável atual. Os testes continuam locais, determinísticos e sem chamadas externas.

## Teste ponta a ponta da Missão 001

- **Ficheiro:** `SRC/features/ai/tests/assistTechnicalRecordMission.test.ts`
- **Objetivo:** validar a execução completa da Missão 001 através do orquestrador.
- **Tipo:** teste técnico local com respostas simuladas.
- **Chamadas externas:** não.
- **Integração visual automatizada:** não.
- **Alteração de ecrãs:** não.

### Entrada base

```text
Máquina de lavar faz ruído durante a centrifugação.
```

### Resultado esperado

- **Tipo:** Anomalia / Corretiva.
- **Prioridade:** média.
- **Resumo:** Ruído anormal durante a centrifugação.
- **Risco:** indeterminado quando não existe histórico semelhante; médio com uma ocorrência semelhante; alto com duas ou mais ocorrências semelhantes.
- **Próxima ação:** verificar rolamentos, fixações, carga e sistema de transmissão para sintomas mecânicos.
- **Informação em falta:** modelo do equipamento, fotografia e histórico recente quando o contexto é insuficiente.
- **Validação humana:** obrigatória.

## Cenários cobertos

- Registo com ruído e sem histórico relevante resulta em risco indeterminado.
- Registo com ruído e uma ocorrência semelhante resulta em risco médio.
- Registo com ruído e duas ocorrências semelhantes resulta em risco alto.
- Registo com fuga de água recomenda verificar mangueiras, uniões, vedantes e drenagem.
- Registo com falha de aquecimento recomenda verificar resistência, termóstato, sensor de temperatura e alimentação.
- Registo com falha de alimentação recomenda verificar alimentação elétrica, disjuntor, cabo, ficha e painel.
- Sintoma mecânico recomenda verificar rolamentos, fixações, carga e transmissão.
- A validação humana continua obrigatória.
- Os registos históricos recebidos não são alterados.
- A ferramenta `consultHistory` continua a devolver origem `records`.

## Teste da ferramenta Consultar Histórico do Equipamento

- **Ficheiro:** `SRC/features/ai/tests/equipmentHistoryTool.test.ts`
- **Objetivo:** validar a função técnica aditiva `consultarHistoricoEquipamento` sem alterar a Missão 001.
- **Estado:** implementado desde v0.9.
- **Integração na Missão 001:** não integrada na v1.0.

### Cenários cobertos

- Devolve `identificador_em_falta` quando não existe `equipamentoId`.
- Devolve lista filtrada por equipamento.
- Não devolve registos de outro equipamento.
- Aplica `limite` positivo.
- Devolve `historico_indisponivel` e `Informação insuficiente` quando não há resultados.
- Não inclui o campo `estado`, porque este campo não existe em `MaintenanceRecord`.
- Confirma que `consultHistory` continua a funcionar como antes.

## Validações visuais registadas

- Painel Assistente IA integrado no ecrã de Registos Diários.
- Painel visível antes da ativação.
- Mensagem inicial apresentada com menos de 12 caracteres.
- Análise ativada com pelo menos 12 caracteres.
- Estado de análise com a mensagem `A analisar o registo...`.
- Sugestão pronta com tipo, prioridade, resumo, risco, próxima ação, informação em falta e confirmação humana.
- Nota de histórico insuficiente quando o risco é indeterminado.
- Nota de supervisão humana visível no painel.
- Botões de cópia de resumo, próxima ação e sugestão completa com feedback visual.
- Desktop e móvel 390x844 validados em marcos anteriores.

## Limites validados

- Nenhum campo do formulário é alterado automaticamente.
- A descrição original do técnico permanece inalterada.
- O tipo e a prioridade não são alterados pela IA.
- Nenhuma ação crítica é executada.
- A lógica de gravação não foi alterada.
- Não existem chamadas externas.
- Não existem dependências novas.
- Não existe persistência nova.
- `seed.ts`, `domain.ts`, `package.json` e `package-lock.json` permanecem fora da implementação da Missão 001.

## A confirmar

- Teste automatizado visual para o painel IA.
- Integração futura de `consultarHistoricoEquipamento` num fluxo com `equipamentoId` confirmado.
- Validação real de equipamento inexistente.

## Conclusão v1.0

Os testes existentes cobrem o mínimo necessário para fechar a Missão 001 como experiência simulada/controlada: fluxo ponta a ponta, risco por histórico, ações por sintoma, validação humana, imutabilidade do histórico e ferramenta aditiva de histórico por equipamento.