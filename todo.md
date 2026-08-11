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
- [x] Substituir o seletor separado por busca e dropdown por um componente de Autocomplete fluido e intuitivo para seleção de itens do catálogo na Nova Requisição.
- [x] Testar a digitação de part number ou descrição e a seleção do item correspondente.
- [x] Salvar checkpoint da melhoria de usabilidade.
- [x] Adicionar cobertura automatizada da lógica do autocomplete para busca por part number, descrição, limite de sugestões e seleção do item.
- [x] Validar que o formulário não envia uma requisição quando há texto digitado sem item do catálogo selecionado.
- [x] Isolar a preparação do payload da Nova Requisição e testar que texto digitado sem reqItemId não gera mutation.
- [x] Configurar credenciais do administrador (`almoxadm@suporte.com` / `Admsuporte@1`) no backend.
- [x] Implementar procedimento tRPC para login customizado do administrador.
- [x] Adicionar formulário de Acesso Administrativo na tela de login, ao lado do botão de acesso Forvia.
- [x] Testar autenticação do administrador e persistência de sessão.
- [x] Salvar checkpoint da entrega final com duplo método de acesso.
- [x] Ajustar o layout da entrada para exibir o acesso Forvia e o acesso administrativo lado a lado em telas maiores.
- [x] Testar que o cookie emitido pelo login administrativo resolve o usuário admin em uma requisição subsequente autenticada.
- [x] Registrar a validação por compilação, build e captura visual autenticada do painel admin, incluindo o menu com os módulos administrativos.
## Correção de Erros no Dashboard e Requisições

- [x] Inspecionar os logs do servidor em `.manus-logs/devserver.log` para identificar a causa raiz dos erros em `stock.stats` e `requisition.list`.
- [x] Corrigir as queries no backend para lidar com tabelas ou campos vazios sem lançar exceções 500.
- [x] Ajustar o tratamento de erros no frontend para exibir estados vazios elegantes em vez de mensagens genéricas de falha.
- [x] Adicionar teste automatizado para garantir que `stock.stats` e `requisition.list` retornam dados válidos mesmo sem registros ou após novas requisições.
- [x] Validar a correção com pnpm check, testes e salvamento de checkpoint.
- [x] Corrigir o login administrativo para espelhar a sessão no fallback Authorization usado pelo preview e por navegadores que bloqueiam cookies em iframe.
- [x] Garantir que Dashboard e Requisições consultem dados após login administrativo e após criar uma requisição.
- [x] Adicionar regressão para sessão admin em chamada protegida e estado vazio de requisições.
- [x] Reexecutar check, testes, build e captura visual antes do checkpoint.
