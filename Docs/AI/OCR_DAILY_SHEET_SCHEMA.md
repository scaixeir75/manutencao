# OCR-002 — JSON Schema da Folha Diária

## Finalidade e limites

Este schema é conceptual e suporta uma futura extração de uma fotografia temporária da folha diária. Não implementa OCR, upload, APIs externas, persistência ou paths Firebase. A imagem é processada apenas em memória, não é guardada nem associada ao histórico.

## Separação de destinos

- `readings` e `checks` representam histórico técnico futuro, consultável pelo Assistente IA sem mostrar todas as leituras na interface diária.
- `operationalReport` representa relatório/anomalia e só poderá originar Registo Diário, Subtarefas, Importante, Visitas ou Anomalia pendente após confirmação humana.
- `historico_tecnico_diario` e `leituras_diarias` são apenas nomes conceptuais futuros, separados de `registos_diarios`, `registos_fichas` e `memoria_tecnica`.

## JSON Schema conceptual

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PMP Daily Sheet Extraction",
  "type": "object",
  "required": ["schemaVersion", "date", "extractionSource", "sourceImage", "imageStored", "imageDiscarded", "readings", "checks", "operationalReport", "confidence", "requiresHumanReview", "validation"],
  "properties": {
    "schemaVersion": { "const": 1 },
    "sheetId": { "type": ["string", "null"] },
    "date": { "type": ["string", "null"], "format": "date" },
    "time": { "type": ["string", "null"] },
    "technicianName": { "type": ["string", "null"] },
    "extractionSource": { "const": "photo_ocr" },
    "imageStored": { "const": false },
    "imageDiscarded": { "const": true },
    "extractionMode": { "enum": ["manual_simulation", "ocr_future", "human_review"] },
    "extractionStatus": { "enum": ["draft", "review_required", "validated", "rejected"] },
    "sourceImage": {
      "type": "object",
      "required": ["received", "stored", "discardedAfterProcessing", "retentionPolicy", "storagePath"],
      "properties": {
        "received": { "type": "boolean" },
        "stored": { "const": false },
        "discardedAfterProcessing": { "const": true },
        "retentionPolicy": { "const": "process_in_memory_only" },
        "storagePath": { "const": null }
      }
    },
    "readings": {
      "type": "object",
      "properties": {
        "generatorFuelLevel": { "$ref": "#/$defs/reading" },
        "electricityMeter": { "$ref": "#/$defs/reading" },
        "waterMeter": { "$ref": "#/$defs/reading" },
        "gasMeter": { "$ref": "#/$defs/reading" },
        "aqsTemperatures": { "type": "array", "items": { "$ref": "#/$defs/aqsTemperature" } },
        "dishwasherTemperature": { "$ref": "#/$defs/reading" },
        "medicalVacuum": { "$ref": "#/$defs/reading" },
        "waterAnalysis": {
          "type": "object",
          "properties": { "freeChlorine": { "$ref": "#/$defs/reading" }, "totalChlorine": { "$ref": "#/$defs/reading" }, "ph": { "$ref": "#/$defs/reading" } }
        }
      }
    },
    "checks": { "type": "array", "items": { "$ref": "#/$defs/check" } },
    "operationalReport": {
      "type": "object",
      "required": ["rawText", "normalizedText", "confidence", "requiresHumanReview", "suggestedDestinations", "suggestedCategory", "suggestedVisibleAction", "humanConfirmationRequired"],
      "properties": {
        "rawText": { "type": ["string", "null"] },
        "normalizedText": { "type": ["string", "null"] },
        "confidence": { "$ref": "#/$defs/confidence" },
        "requiresHumanReview": { "type": "boolean" },
        "suggestedDestinations": { "type": "array", "items": { "enum": ["registo_diario", "subtarefa", "importante", "visita", "anomalia_pendente", "none"] } },
        "suggestedCategory": { "type": ["string", "null"] },
        "suggestedVisibleAction": { "type": ["string", "null"] },
        "humanConfirmationRequired": { "const": true }
      }
    },
    "confidence": { "type": "object", "additionalProperties": { "$ref": "#/$defs/confidence" } },
    "requiresHumanReview": { "type": "boolean" },
    "createdAt": { "type": ["string", "null"], "format": "date-time" },
    "validatedAt": { "type": ["string", "null"], "format": "date-time" },
    "validatedByHuman": { "type": ["boolean", "null"] },
    "validation": {
      "type": "object",
      "required": ["hasAmbiguousHandwriting", "hasAmbiguousNumbers", "hasPotentialOperationalImpact", "requiresHumanConfirmation", "validationNotes"],
      "properties": {
        "hasAmbiguousHandwriting": { "type": "boolean" },
        "hasAmbiguousNumbers": { "type": "boolean" },
        "hasPotentialOperationalImpact": { "type": "boolean" },
        "requiresHumanConfirmation": { "type": "boolean" },
        "validationNotes": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "$defs": {
    "confidence": { "enum": ["low", "medium", "high"] },
    "reading": { "type": "object", "required": ["label", "value", "unit", "rawText", "confidence", "requiresHumanReview"], "properties": { "label": { "type": "string" }, "value": { "type": ["number", "string", "null"] }, "unit": { "type": ["string", "null"] }, "rawText": { "type": ["string", "null"] }, "confidence": { "$ref": "#/$defs/confidence" }, "requiresHumanReview": { "type": "boolean" } } },
    "aqsTemperature": { "allOf": [{ "$ref": "#/$defs/reading" }, { "type": "object", "properties": { "equipmentCode": { "type": ["string", "null"] }, "equipmentName": { "type": "string" } } }] },
    "check": { "type": "object", "required": ["area", "status", "rawMark", "confidence", "requiresHumanReview"], "properties": { "area": { "type": "string" }, "status": { "enum": ["ok", "nok", "not_observed", "unclear"] }, "rawMark": { "type": ["string", "null"] }, "confidence": { "$ref": "#/$defs/confidence" }, "requiresHumanReview": { "type": "boolean" } } }
  }
}
```

## Revisão humana

Caligrafia ambígua, números incertos, marcas OK/NOK pouco claras e qualquer potencial ação operacional exigem revisão humana. O Assistente IA futuro deve consultar dados estruturados, nunca imagens.
