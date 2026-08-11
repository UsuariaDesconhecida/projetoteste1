# Projeto Almoxarifado Forvia — TODO

## Implementação inicial

- [x] Estruturar tabelas de usuários, itens, requisições e movimentações.
- [x] Aplicar migrações e configurar seed inicial.
- [x] Implementar catálogo, nova requisição, aprovação/recusa e movimentações.
- [x] Implementar Dashboard, Materiais & EPIs, Entrada Estoque e Relatórios.
- [x] Implementar autenticação corporativa Forvia sem login administrativo visível.
- [x] Restringir Solicitante a Nova Requisição.
- [x] Restringir funções administrativas ao perfil admin.
- [x] Promover almoxsuporte@forvia.com a admin no upsert OAuth.
- [x] Tornar a aprovação com baixa de estoque transacional.
- [x] Criar testes de autorização, menus, estoque e fluxo de requisição.
- [x] Salvar checkpoint de acesso corporativo: 8408e674.

## Importação do catálogo corporativo

- [x] Ler o arquivo fornecido com Part Number, Descrição e Quantidade Disponível.
- [x] Validar part numbers e tratar quantidades com separador de milhares.
- [x] Importar 8.319 linhas reais e manter códigos únicos.
- [x] Atualizar nomes e saldos por código sem sobrescrever o histórico de categoria/unidade dos itens existentes.
- [x] Confirmar no banco 8.329 itens totais, incluindo 10 itens legados do seed inicial.
- [x] Confirmar total de 439.270 unidades, 6.036 itens com saldo zero e 2.293 com saldo positivo.
- [x] Otimizar a seleção da requisição para mostrar até 150 resultados e exigir refinamento por busca quando necessário.
- [x] Otimizar Materiais & EPIs para exibir até 120 cards e indicar a quantidade de resultados.
- [x] Corrigir o teste de aprovação para selecionar um item com estoque positivo do catálogo real.
- [x] Executar testes automatizados após a importação com sucesso total.
- [x] Salvar checkpoint final da importação e atualização do catálogo.
