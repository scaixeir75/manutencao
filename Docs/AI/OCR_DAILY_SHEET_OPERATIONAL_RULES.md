# OCR-005B.1 — Regras Operacionais do Relatório / Anomalia

## Objetivo

Definir como o campo “Relatório ou participação de anomalia detectada” de uma folha diária deve, numa fase futura, originar uma ação operacional no PMP. Estas regras evitam estruturas duplicadas e preservam a confirmação humana obrigatória.

Este documento não implementa OCR, upload de imagem, persistência, paths Firebase ou ações reais.

## Estruturas existentes a reutilizar

O PMP já possui Registos Diários com três severidades. Não devem ser criadas coleções paralelas para categorias que já são representadas nesse fluxo.

| Situação operacional | Estrutura a usar | Severidade |
| --- | --- | --- |
| Tarefa simples | Registo Diário | `info` |
| Visita | Registo Diário | `aviso` |
| Importante | Registo Diário | `urgente` |

Subtarefas não são atualmente suportadas: não existe UI, função de criação ou path Firebase para esse conceito. A IA não deve propor criar uma Subtarefa como ação executável até existir um desenho técnico próprio.

## Anomalia pendente

Anomalia pendente não deve ser gravada como entidade própria. É um estado inferido pelo histórico: um registo associado a uma ficha pode ser considerado pendente enquanto não houver confirmação técnica de correção relacionada.

Quando o relatório confirmado indicar uma anomalia:

1. Criar um Registo Diário associado à ficha correta, após confirmação humana explícita.
2. Escolher a severidade adequada, normalmente `urgente` quando a situação exigir acompanhamento prioritário.
3. Permitir que a lógica existente infira a pendência a partir do histórico.

O Registo Diário associado a uma ficha é espelhado pelo fluxo existente no Histórico de Fichas. Esse espelho não é uma estrutura operacional nova e não deve ser duplicado por outro mecanismo OCR.

## Regras para IA e revisão humana

- Se a letra manuscrita, número ou frase não forem claros, a IA deve marcar o conteúdo como **por confirmar**.
- Se a categoria não for segura, a IA deve perguntar ao técnico antes de propor um destino.
- A IA nunca deve inventar texto, ficha, categoria, empresa, equipamento ou prioridade.
- Um relatório sem texto operacional confirmado não pode originar ação real.
- A IA pode apresentar destinos possíveis, mas não pode criar Registo Diário, Visita, Importante ou Anomalia por iniciativa própria.

## Pré-visualização obrigatória

Antes de qualquer criação operacional futura, a app deve apresentar uma pré-visualização que identifique claramente:

- texto lido/confirmado;
- confiança da leitura;
- ficha associada, apenas se confirmada;
- categoria e severidade sugeridas;
- destino proposto: Registo Diário;
- aviso de que a criação ainda não foi executada.

Qualquer criação operacional exige uma ação humana explícita de confirmação. A confirmação deve indicar o destino e avisar que um Registo Diário associado à ficha pode ser espelhado no Histórico de Fichas pelo mecanismo já existente.

## Limites desta fase

Não criar paths novos para Subtarefas, Visitas, Importantes ou Anomalias pendentes. Não guardar imagens. Não criar ações reais a partir de simulações OCR. A implementação funcional fica reservada para o bloco OCR-005B, depois de a pré-visualização conter texto operacional confirmado e o técnico escolher o destino.
