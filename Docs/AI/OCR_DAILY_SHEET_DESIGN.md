# OCR_DAILY_SHEET_DESIGN.md

## 1. Objetivo

Esta funcionalidade futura permitirá ao técnico fotografar uma folha diária física de manutenção para a IA extrair dados estruturados. A fotografia é apenas uma entrada temporária de extração: não é guardada.

## 2. Contexto funcional

A folha diária física contém identificação do técnico, data, hora, leituras técnicas, contadores, temperaturas, verificações OK/NOK e um campo final de relatório ou participação de anomalia detectada.

## 3. Regra fundamental sobre a imagem

- A imagem é temporária e serve apenas para OCR/extracção.
- Não é guardada em Firebase, no histórico ou associada a qualquer registo.
- Deve ser descartada após o processamento.
- Não deve acumular armazenamento digital diário.

## 4. Campos observados na folha física

### Identificação

- Nome
- Hora
- Data

### Leituras técnicas

- Grupo Gerador — Gasóleo
- Electricidade — Contagem kWh
- Água — Contagem m3
- Gás — Contagem m3
- Depósitos AQS / Termoacumuladores — temperaturas
- Máquina Lava-Loiça — temperatura
- Gases Medicinais — Central Vácuo
- Análise Água Cozinha — Cloro Livre
- Análise Água Cozinha — Cloro Total
- Análise Água Cozinha — pH

### Verificações OK/NOK

- Grupo Gerador; Bastidores IT; Electricidade; Água; Gás; Depósitos AQS; Máquina Lava-Loiça; Gases Medicinais; Bombas Incêndio; Análise Água Cozinha; Central Deteção Incêndio; Central Deteção Gás; Central Deteção Monóxido; Central Bombagem AVAC; Caldeiras; Sistema Rega Jardim; Caderno Pedidos Manutenção.

### Campo operacional

- Relatório ou participação de anomalia detectada.

## 5. Separação dos destinos dos dados

### 5.1 Dados técnicos de histórico

Leituras, temperaturas, contagens, valores de pH e cloro e verificações OK/NOK devem, numa fase futura, ficar em histórico técnico de fundo para consulta pelo Assistente IA. Exemplos: temperaturas AQS por mês, contagens de água/electricidade/gás e dias com NOK. Estes dados não devem aparecer todos os dias na interface principal.

### 5.2 Campo relatório/anomalia

O relatório manuscrito exige tratamento operacional imediato. A IA poderá propor integração em Registo Diário, Subtarefas, Importante, Visitas ou Anomalia pendente. A criação de qualquer entrada visível exige confirmação humana explícita.

## 6. Modelo conceptual de dados

Uma futura extração poderá conter `sheetId`, `date`, `technicianName`, `source`, `imageStored: false`, `imageDiscarded: true`, `readings`, `checks`, `operationalReport`, `confidence`, `requiresHumanReview`, `createdAt`, `validatedAt` e `validatedByHuman`.

## 7. JSON Schema inicial

```json
{
  "type": "object",
  "required": ["sheetId", "source", "imageStored", "imageDiscarded", "readings", "checks", "confidence", "requiresHumanReview"],
  "properties": {
    "sheetId": { "type": "string" },
    "date": { "type": ["string", "null"], "format": "date" },
    "technicianName": { "type": ["string", "null"] },
    "source": { "const": "daily_sheet_ocr" },
    "imageStored": { "const": false },
    "imageDiscarded": { "const": true },
    "readings": {
      "type": "object",
      "properties": {
        "generatorDiesel": { "type": ["number", "null"] },
        "electricityKwh": { "type": ["number", "null"] },
        "waterM3": { "type": ["number", "null"] },
        "gasM3": { "type": ["number", "null"] },
        "aqsTemperatures": { "type": "object", "additionalProperties": { "type": ["number", "null"] } },
        "dishwasherTemperature": { "type": ["number", "null"] },
        "vacuumCentral": { "type": ["number", "string", "null"] },
        "freeChlorine": { "type": ["number", "null"] },
        "totalChlorine": { "type": ["number", "null"] },
        "ph": { "type": ["number", "null"] }
      }
    },
    "checks": { "type": "object", "additionalProperties": { "enum": ["OK", "NOK", "unknown"] } },
    "operationalReport": { "type": ["string", "null"] },
    "confidence": { "type": "object", "additionalProperties": { "type": "number", "minimum": 0, "maximum": 1 } },
    "requiresHumanReview": { "type": "boolean" },
    "createdAt": { "type": ["string", "null"], "format": "date-time" },
    "validatedAt": { "type": ["string", "null"], "format": "date-time" },
    "validatedByHuman": { "type": ["boolean", "null"] }
  }
}
```

Qualquer número, estado ou texto incerto deve ter confiança baixa e exigir revisão humana.

## 8. Paths Firebase conceptuais

Possíveis nomes futuros: `historico_tecnico_diario` ou `leituras_diarias`. São apenas propostas conceptuais; nenhum path é criado neste bloco. Devem permanecer separados de `registos_diarios`, `registos_fichas` e `memoria_tecnica`.

## 9. Consulta futura pelo Assistente IA

Exemplos futuros:

- “Dá-me as temperaturas dos depósitos AQS de maio.”
- “Mostra as contagens de água e luz do mês de agosto.”
- “Houve algum depósito AQS abaixo de 60 graus?”
- “Mostra os valores de pH e cloro do mês.”
- “Que dias tiveram verificações NOK?”

## 10. Regras de validação humana

A IA deve exigir validação humana quando a caligrafia for ambígua, um número não for claro, houver dúvida entre OK e NOK, o relatório manuscrito tiver baixa confiança ou houver potencial criação de tarefa, visita, importante ou anomalia.

## 11. Segurança e arquitetura futura

O PMP está publicado em GitHub Pages. Não devem ser colocadas chaves de IA/OCR no `index.html`. OCR real deverá usar um backend seguro, Cloud Function, endpoint autenticado ou serviço intermédio. Este bloco não implementa OCR nem integração real.

## 12. Plano de implementação por fases

1. OCR-001 — documentação da folha e modelo de dados.
2. OCR-002 — JSON Schema e simulação manual sem OCR real.
3. OCR-003 — interface de pré-visualização dos dados extraídos.
4. OCR-004 — gravação das leituras em histórico técnico.
5. OCR-005 — tratamento operacional do campo relatório/anomalia.
6. OCR-006 — consulta das leituras históricas pelo Assistente IA.
7. OCR-007 — OCR real via backend seguro.

## Critérios de validação

O desenho é aprovado se preservar a fotografia apenas temporariamente, separar leituras históricas do relatório/anomalia, exigir confirmação humana para criações operacionais, não criar paths reais, não alterar a app ou Firebase e não expor chaves de OCR/IA no frontend.
