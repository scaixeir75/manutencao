# PHOTO-AI — decisão sobre leitura automática da Ficha 44

## Estado

O objetivo original mantém-se: fotografia da Ficha 44, extração dos campos
técnicos e do relatório manuscrito, preview editável e confirmação humana. Não
está implementado. Novas PoCs de leitura automática estão congeladas.

O fluxo ativo é apenas o preenchimento humano assistido. Usa `structuredData`,
preview, confirmação, `saveDiaryCanonical`, `registos_diarios` e o espelho
`diary_<id>`. A fotografia é temporária e não é persistida.

## Evidência encerrada

- MOBILE-001 / Tesseract: localização segura do formulário falhou.
- MOBILE-002 / SmolVLM-256M: inferência acima de 45 segundos; gate rejeitado.
- MOBILE-003 / PaddleOCR: modo necessário não demonstrado no caminho auditado.
- MOBILE-004 / Tesseract por crops: 0 corretos em 13 campos, 10 incorretos e 3
  abstenções.
- Cloudflare Vision: caminho congelado por inconsistência de integração e por
  não estabelecer as garantias de privacidade exigidas.

## Regra para reabrir

Só reabrir com evidência nova, concreta e comparável para manuscrito e documento
estruturado da Ficha 44 no Galaxy S25, cobrindo desempenho operacional,
privacidade e custo zero. Não reabrir por existir outro OCR, VLM, cloud ou
benchmark genérico.
