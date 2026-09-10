# UX mobile do PMP

## Objetivo

Manter o PMP confortável e operacional em telemóvel, com o Galaxy S25 como
referência. Esta linha trata UX e responsividade; não altera regras de negócio,
Firebase, dados ou os fluxos funcionais existentes.

`UX-MOBILE` é independente de `MOBILE-001`, identificador histórico da PoC
Tesseract de PHOTO-AI.

## Estratégia de larguras

- Layout fluido por defeito, até ao contentor atual de 760 px.
- `560px` mantém-se como breakpoint estrutural para o calendário, o modal de
  Ficha e o Assistente.
- `390px` e `420px` são larguras de validação. Não recebem regras próprias sem
  uma falha reproduzível que CSS fluido não resolva.
- O desktop atual continua a ser uma largura de validação.

## UX-MOBILE-001 — definição

O Plano Semanal é o ecrã inicial. A navegação atual mantém Plano Semanal e
Registos Diários no topo; Histórico e Fichas conservam os acessos existentes;
o Assistente continua a abrir pelo launcher discreto. Não há evidência para
bottom navigation ou drawer.

## UX-MOBILE-002 — casca, navegação e Plano Semanal

Concluído nesta linha:

- cabeçalho reserva uma área própria para terminar sessão, sem sobrepor o
  título;
- o alvo isolado de terminar sessão mede pelo menos 44 × 44 px;
- tabs, calendário, mudança de semana, cartões, abertura de Ficha e launcher
  do Assistente foram validados a 390 × 844, 420 × 900, 560 × 900 e desktop;
- o calendário mantém quatro colunas abaixo de 560 px; não foi necessário
  criar breakpoint a 420 px.

## Próximos blocos

- **UX-MOBILE-003 — Registos Diários:** formulário, edição, classificação,
  fotografias, filtros e teclado.
- **UX-MOBILE-004 — Histórico e Fichas:** filtros de relatório, conteúdo longo,
  bottom sheet, scroll e fotografias.

## Critérios de aceitação mobile

Em 390 px, 420 px, 560 px e desktop, os ecrãs abrangidos devem garantir:

- ausência de scroll horizontal e sobreposição;
- ações isoladas relevantes com alvo confortável, aproximadamente 44 × 44 px;
- campos, ações principais e confirmação acessíveis com teclado virtual;
- modais completos, com scroll interno quando necessário;
- texto longo legível sem ocultar dados operacionais;
- fluxos principais completos sem alterar dados fora de ação humana explícita.
