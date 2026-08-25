# Proposta de Firebase Rules — Memória Técnica

## Estado atual identificado

O PMP usa Firebase Realtime Database e Firebase Authentication por email/password. O código usa os paths `registos_diarios` e `registos_fichas/{fichaId}`. As Rules atualmente ativas não estão no repositório e não foi identificada uma área `memoria_tecnica`.

## Risco de implementar sem Rules

O cliente não prova permissões. Criar persistência sem rever as Rules remotas pode falhar para utilizadores autenticados ou, pior, deixar escrita pública indevida. Esta proposta não substitui, altera ou faz deploy de Rules existentes.

## Novo path proposto

`memoria_tecnica`

Este path deve permanecer separado de `registos_diarios` e `registos_fichas`. Só deve receber memórias aprovadas manualmente, nunca sugestões, rejeições ou dados de registo originais.

## Permissão mínima pretendida

O bloco a integrar nas Rules existentes deve ser equivalente a:

```json
{
  "memoria_tecnica": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

Este bloco é apenas uma proposta parcial. Não deve ser usado como Rules globais nem aplicado sem preservar as regras atuais dos restantes paths.

## Validação de dados recomendada

Numa revisão futura das Rules, a escrita deve também exigir, quando a estrutura final estiver definida:

- `newData.child('status').val() === 'approved'`;
- `newData.child('approvedByHuman').val() === true`;
- campos obrigatórios como regra, base, ficha/pergunta e datas;
- ausência de dados sensíveis desnecessários.

## Dados permitidos

Memória aprovada: regra, base, ficha relacionada, pergunta de origem, referências mínimas aos registos, tipo, versão, aprovação humana e datas de auditoria.

## Dados proibidos

Credenciais, tokens, passwords, dados pessoais desnecessários, conteúdo interno da app, sugestões não aprovadas, rejeições desta sessão e cópias que alterem ou substituam os registos existentes.

## Passos manuais na consola Firebase

1. Abrir o projeto Firebase correspondente ao PMP.
2. Ir a Realtime Database → Rules.
3. Copiar e guardar localmente as Rules atuais antes de qualquer alteração.
4. Confirmar se `auth != null` corresponde ao modelo de acesso pretendido.
5. Integrar apenas o bloco `memoria_tecnica` dentro da árvore atual, sem substituir regras de registos existentes.
6. Rever e publicar as Rules manualmente na consola.
7. Testar leitura/escrita autenticada e negação de acesso não autenticado antes de ativar a app.

## Próximo passo recomendado

IA-MEMORY-APPROVAL-001 permanece bloqueado até as Rules atuais serem fornecidas/revistas e a regra final de `memoria_tecnica` ser aprovada e publicada manualmente.
