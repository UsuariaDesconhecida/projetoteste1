# Projeto Almoxarifado Forvia - TODO

- [x] Atualizar o esquema do banco de dados (drizzle/schema.ts) com tabelas para Materiais/EPIs, Requisições e Movimentações de Estoque, além de ajustar usuários e papéis.
- [x] Executar migração do banco de dados via drizzle-kit e webdev_execute_sql.
- [x] Implementar rotas e procedimentos tRPC (server/routers.ts) para autenticação customizada (incluindo login admin almoxadm / admsuporte), gerenciamento de estoque, requisições, entradas/saídas e estatísticas.
- [x] Criar componentes de UI refinados e elegantes para o sistema corporativo.
- [x] Implementar a tela de Nova Requisição para o Solicitante (com seleção de itens do catálogo e validações).
- [x] Implementar o Painel do Administrador (KPIs, aprovação/recusa de requisições, controle de estoque com entradas/saídas, e gráficos de consumo por área e item).
- [x] Escrever testes automatizados em Vitest (server/almoxarifado.test.ts) para validar regras de negócio, autenticação e estoque.
- [x] Criar checkpoint do projeto (webdev_save_checkpoint).
- [x] Ajustar segurança tRPC para proteger listagem de requisições e garantir separação de perfis (solicitante vs admin).
- [x] Adicionar validação estrita de estoque e transação segura ao aprovar requisições.
- [x] Adicionar gráfico de consumo por item no painel do administrador.
- [x] Atualizar testes em Vitest para cobrir regras de aprovação e estoque insuficiente.
