# MOBILE-002 — SmolVLM gate rejeitado e congelado

O objetivo original do PMP continua a ser a leitura automática da Ficha 44 a
partir de fotografia: campos técnicos, manuscrito livre e descrição operacional.
Esse objetivo **não está implementado**.

Esta PoC usou `HuggingFaceTB/SmolVLM-256M-Instruct`, Transformers.js 3.8.1 e
WebGPU. O modelo carregou no browser, com aproximadamente 321 MB de pesos, mas
a inferência real ultrapassou o limite operacional de 45 segundos. O gate foi
rejeitado; não é uma opção de produção no Galaxy S25.

Não executar `run-local.ps1`, não descarregar assets e não testar variantes de
modelo. A pasta permanece apenas como histórico técnico reproduzível.

O caminho ativo é o preenchimento humano assistido no PMP: preview editável,
confirmação humana, `saveDiaryCanonical`, espelho `diary_<id>` e
`structuredData`. Não é leitura automática nem IA de manuscrito.

A via automática só pode ser reaberta perante evidência nova e concreta de uma
solução que cubra simultaneamente manuscrito, documento estruturado, Galaxy S25,
desempenho operacional, privacidade e custo zero. Não basta um novo modelo ou
benchmark genérico.
