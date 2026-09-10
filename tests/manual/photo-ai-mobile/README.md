# PHOTO-AI mobile PoC

Esta pasta é isolada: não é carregada por `index.html` nem pelo painel PHOTO-AI.

`run-poc.mjs` usa a fixture sintética local e a cópia local de `eng.traineddata.gz` instalada no pacote npm. Não usa `fetch`, IndexedDB, Firebase, Cloudflare ou API de IA. O seu único output é uma métrica sanitizada; não contém texto OCR, imagem ou Base64.

`ocr-layout.worker.js` é a entrada para a futura execução num Web Worker. A app final terá de servir localmente o WASM, o worker e o idioma, com `cacheMethod: 'none'`; o atual PMP ainda não o serve nem o carrega.

Execute o teste local com `node tests/manual/photo-ai-mobile/run-poc.mjs`. O código de saída 2 significa stop-loss funcional, não uma falha de privacidade.
