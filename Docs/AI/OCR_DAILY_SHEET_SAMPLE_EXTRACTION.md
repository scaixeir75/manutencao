# OCR-002 — Simulação Manual de Extração

## Limites da simulação

Esta simulação é manual, não definitiva e não provém de OCR real. Não houve upload, armazenamento de imagem, chamada a API externa ou persistência. A fotografia hipotética seria temporária, processada em memória e descartada.

Os valores que não foram confirmados visualmente na folha são `null`, com confiança baixa e revisão humana obrigatória. Não representam dados técnicos reais.

## Exemplo conceptual

```json
{
  "schemaVersion": 1,
  "sheetId": null,
  "date": null,
  "time": null,
  "technicianName": null,
  "extractionSource": "photo_ocr",
  "imageStored": false,
  "imageDiscarded": true,
  "extractionMode": "manual_simulation",
  "extractionStatus": "review_required",
  "sourceImage": { "received": true, "stored": false, "discardedAfterProcessing": true, "retentionPolicy": "process_in_memory_only", "storagePath": null },
  "readings": {
    "generatorFuelLevel": { "label": "Grupo Gerador — Gasóleo", "value": null, "unit": null, "rawText": null, "confidence": "low", "requiresHumanReview": true },
    "electricityMeter": { "label": "Electricidade — Contagem", "value": null, "unit": "kWh", "rawText": null, "confidence": "low", "requiresHumanReview": true },
    "waterMeter": { "label": "Água — Contagem", "value": null, "unit": "m3", "rawText": null, "confidence": "low", "requiresHumanReview": true },
    "gasMeter": { "label": "Gás — Contagem", "value": null, "unit": "m3", "rawText": null, "confidence": "low", "requiresHumanReview": true },
    "aqsTemperatures": [],
    "dishwasherTemperature": { "label": "Máquina Lava-Loiça — Temperatura", "value": null, "unit": "°C", "rawText": null, "confidence": "low", "requiresHumanReview": true },
    "medicalVacuum": { "label": "Gases Medicinais — Central Vácuo", "value": null, "unit": null, "rawText": null, "confidence": "low", "requiresHumanReview": true },
    "waterAnalysis": {
      "freeChlorine": { "label": "Cloro Livre", "value": null, "unit": null, "rawText": null, "confidence": "low", "requiresHumanReview": true },
      "totalChlorine": { "label": "Cloro Total", "value": null, "unit": null, "rawText": null, "confidence": "low", "requiresHumanReview": true },
      "ph": { "label": "pH", "value": null, "unit": "pH", "rawText": null, "confidence": "low", "requiresHumanReview": true }
    }
  },
  "checks": [
    { "area": "Grupo Gerador", "status": "unclear", "rawMark": null, "confidence": "low", "requiresHumanReview": true },
    { "area": "Depósitos AQS", "status": "unclear", "rawMark": null, "confidence": "low", "requiresHumanReview": true },
    { "area": "Análise Água Cozinha", "status": "unclear", "rawMark": null, "confidence": "low", "requiresHumanReview": true }
  ],
  "operationalReport": {
    "rawText": null,
    "normalizedText": null,
    "confidence": "low",
    "requiresHumanReview": true,
    "suggestedDestinations": ["none"],
    "suggestedCategory": null,
    "suggestedVisibleAction": null,
    "humanConfirmationRequired": true
  },
  "confidence": { "identification": "low", "readings": "low", "checks": "low", "operationalReport": "low" },
  "requiresHumanReview": true,
  "createdAt": null,
  "validatedAt": null,
  "validatedByHuman": null,
  "validation": {
    "hasAmbiguousHandwriting": true,
    "hasAmbiguousNumbers": true,
    "hasPotentialOperationalImpact": false,
    "requiresHumanConfirmation": true,
    "validationNotes": ["Simulação documental: nenhum valor manuscrito foi assumido como confirmado.", "O relatório/anomalia só poderá originar ação visível após confirmação humana."]
  }
}
```

## Uso futuro

Depois de uma fase de gravação validada, o Assistente IA poderá consultar histórico técnico estruturado para perguntas sobre temperaturas AQS, contagens de água, valores de pH/cloro, estados NOK e evolução de gás. Essas respostas devem usar leituras estruturadas, não fotografias.
