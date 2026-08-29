# Sistema Operativo de IA do PMP

Esta pasta contém a documentação oficial do Sistema Operativo de Inteligência Artificial do Plano de Manutenção Preventiva (PMP).

O seu objetivo é explicar, de forma rastreável, como o Assistente IA recebe um pedido, seleciona uma missão, coordena agentes e ferramentas e apresenta uma sugestão ao técnico. Esta pasta contém especificações e documentação; não contém implementação executável.

## Princípios

- O técnico mantém o controlo e valida as sugestões antes de qualquer gravação.
- A IA não inventa factos nem transforma hipóteses em certezas.
- Todas as conclusões devem ser rastreáveis até ao registo ou às fontes internas consultadas.
- Cada agente tem uma responsabilidade delimitada.
- As ferramentas consultam dados, mas não os alteram.
- A documentação deve permanecer simples, modular e legível.

## Componentes

- **Assistente IA:** ponto de contacto entre o técnico e o Sistema Operativo de IA.
- **Orquestrador:** identifica a missão adequada e coordena a ordem de execução.
- **Missões:** objetivos completos que respondem a uma necessidade do utilizador.
- **Agentes:** unidades especializadas de análise ou composição.
- **Ferramentas:** operações autorizadas para consultar informação do PMP.
- **Base de Conhecimento:** documentação funcional, regras de negócio e dados autorizados do PMP.
- **Memória:** contexto relevante preservado de forma controlada para apoiar continuidade e consistência.

## Estrutura

```text
Docs/AI/
├── AI_MASTER_CONTEXT.md
├── catalogos/
├── missoes/
├── agentes/
├── ferramentas/
└── testes/
```

## Ordem de leitura

1. `README.md`
2. `AI_MASTER_CONTEXT.md`
3. `catalogos/missoes.md`
4. `missoes/001_assistencia_registo/especificacao.md`
5. `missoes/001_assistencia_registo/fluxo.md`
6. Especificações dos agentes e ferramentas envolvidos
7. Ficheiros de testes

## Estado atual

Está documentada a **Missão 001 — Assistência ao Registo Técnico**, composta por cinco agentes e três ferramentas de consulta.

O estado implementado mais recente da aplicação, incluindo o Assistente IA transversal, o launcher/spotlight, as consultas locais curtas e compostas e a normalização técnica genérica, está em `AI_CURRENT_STATE.md` (referência estável publicada v0.8).

