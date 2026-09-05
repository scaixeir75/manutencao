# PHOTO-AI-002 — proxy

Implementação local, desativada por defeito. Não cria registos PMP. Não possui acesso de escrita à base de dados ou ao Storage.

## 1/2 — configurar

Node 22 ou superior. Na raiz, executar `npm ci --prefix server/photo-ai`. Usar as variáveis de `.env.example` no ambiente do serviço; o ficheiro não é carregado automaticamente.

`PHOTO_AI_ENABLED=false` mantém o envio bloqueado. Para ativar são obrigatórios chave, modelo, projeto Firebase, origens CORS exatas, lista de UIDs autorizados e Redis. O projeto de produção deve ser o mesmo do Firebase Auth existente. Tokens são verificados com revogação; usar Application Default Credentials no servidor e permissões mínimas para consulta de utilizadores Auth.

Produção exige `PHOTO_AI_RETENTION=zdr-verified`. Esta flag **não ativa nem verifica ZDR remotamente**: só pode ser configurada após verificar na conta do fornecedor a elegibilidade, endpoint, modelo e exceções aplicáveis. Não há modelo predefinido: fixar uma versão compatível com visão, JSON Schema estrito e política de retenção escolhida.

Desenvolvimento admite `NODE_ENV=development` e `PHOTO_AI_RETENTION=limited-test-verified`, após verificar a política da conta. Usar apenas folhas sintéticas neste modo; esta restrição é operacional, pois o servidor não consegue determinar se uma imagem contém dados reais. Os testes automatizados usam fornecedor simulado e não exigem chaves. Nunca usar o modo de desenvolvimento no serviço de produção.

Configurar Redis privado/TLS em produção, com acesso restrito. Guarda apenas contadores por hash de UID e lock temporário: 5 pedidos por janela de 60 segundos, 50 por janela de 24 horas, um pedido simultâneo por UID. As janelas começam no primeiro pedido, não à meia-noite. Falha de Redis bloqueia análise. Os limites funcionam entre instâncias; definir também limite de instâncias e orçamento do fornecedor.

## 2/2 — executar e integrar

Executar `npm start --prefix server/photo-ai`. Para Cloud Run, construir a imagem a partir da raiz: `docker build -f server/photo-ai/Dockerfile .`. Não foi efetuado deploy. Disponibilizar o endpoint HTTPS com a autenticação Firebase aplicada pelo handler; não confundir acesso HTTP ao serviço com autorização para analisar.

Após validar retenção e testes de ponta a ponta, preencher `photo-ai-config.js` com `enabled:true` e URL completa terminada em `/v1/photo-ai/analyze`. Esta configuração é pública e nunca contém segredos. A flag de frontend não substitui os bloqueios no backend.

Pedido JSON: `{image: base64, mime, context:{fichaId,equipment,week}}`, autenticado por Bearer Firebase ID token. Uma imagem JPEG/PNG/WebP até 8 MiB, 20 MP, não animada. Backend descodifica, corrige orientação e remove metadados. Sem upload para Files API, ferramentas, Storage ou escrita em disco. `store:false` e `background:false` sempre enviados à Responses API. Não ativar captura de corpos, prompts ou imagens em logs/APM da infraestrutura. Auditar também proxies e configuração de retenção do fornecedor antes de produção.

Frontend mantém fotografia apenas até análise terminar (sucesso ou erro) ou cancelamento. O rascunho textual pode permanecer para revisão humana. O original da galeria permanece no dispositivo. Limpar referências/buffers não garante apagamento físico instantâneo de RAM ou de cópias internas do runtime; a garantia PMP é ausência de persistência intencional.

Testar na raiz: `npm run test:photo-ai`, `npm run test:syntax` e `npm run test:ai:backtest`. Os testes locais não contactam Firebase nem OpenAI; autenticação e Redis usam substitutos de teste. Validação com serviços reais, folhas reais, política da conta e deploy continuam pendentes. Os testes de browser usam Edge no Windows; pode escolher outro canal com `PMP_PLAYWRIGHT_CHANNEL`.

Fontes: [imagens](https://developers.openai.com/api/docs/guides/images-vision), [JSON estruturado](https://developers.openai.com/api/docs/guides/structured-outputs), [retenção](https://developers.openai.com/api/docs/guides/your-data).
