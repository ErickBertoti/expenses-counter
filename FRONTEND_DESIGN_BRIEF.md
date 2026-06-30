# Front-End Design Brief

## Objetivo do documento

Este briefing descreve o front-end atual do **Contador de Despesas** e prepara um prompt para o Claude Design propor uma evolução visual antes de qualquer alteração de código. O app já tem regras de negócio, autenticação, persistência e fluxos principais funcionando; a próxima etapa deve melhorar clareza, hierarquia, densidade e acabamento visual sem mudar o produto.

## O que o app se propõe a fazer

O app é uma dashboard pessoal para acompanhar compras parceladas no cartão de crédito. Ele substitui uma planilha simples para responder perguntas como: quanto cai neste mês, quais compras ainda estão em andamento, quando uma compra termina e qual saldo ainda falta pagar.

Principais capacidades atuais:

- Autenticação por email e senha via Supabase, com fluxo de primeiro acesso/esqueci minha senha por link de recuperação.
- Dashboard privada por usuário.
- Criação e edição de compras parceladas com descrição, cartão, data da compra, mês da primeira parcela, número de parcelas, valor total e observações.
- Cálculo automático de parcelas já pagas, parcelas restantes, saldo restante, mês de conclusão e status da compra.
- Separação entre compras `Em andamento`, `Concluída` e `Desativada`.
- Mensalidades recorrentes para custos que entram automaticamente em todos os meses configurados.
- Resumo mensal com total em BRL, parcelas, mensalidades, gráficos e itens que compõem cada mês.
- Foco em um mês específico, usando o mês atual como padrão.
- Filtros por descrição, status, mês e cartão.
- Desativação e reativação de compras/mensalidades sem exclusão permanente pela UI.
- Logout.
- Estrutura de dados preparada para múltiplos cartões, mesmo que o app ainda crie apenas um cartão principal por padrão.

O app não tenta ser um gerenciador financeiro completo. Hoje ele não cobre orçamento mensal, categorias, receitas, fechamento real de fatura, vencimento de cartão, recorrências, conciliação bancária ou gráficos avançados. O foco é o controle rápido e confiável de compras parceladas.

## Mapa do front-end atual

### Entrada autenticada

- `src/app/page.tsx` é a home autenticada e força renderização dinâmica.
- A página busca os dados com `getDashboardData`, calcula o mês atual, prepara o caminho de retorno com filtros preservados e monta valores iniciais do formulário.
- Desktop e mobile são renderizados por componentes separados:
  - `DesktopDashboard`
  - `MobileDashboardShell`

### Dashboard desktop

Implementada em `src/components/dashboard/desktop-dashboard.tsx`.

A experiência desktop usa uma composição de painel operacional:

- Header com selo `Dashboard pessoal`, título, descrição, email do usuário e botão de sair.
- Seção `Visão do mês` com três métricas:
  - Total do mês.
  - Compras ativas.
  - Saldo restante.
- Bloco de filtros.
- Tabela de compras cadastradas.
- Tabela de resumo mensal.
- Formulário de nova compra/edição em uma coluna lateral sticky.

O layout principal usa duas colunas em telas grandes, com conteúdo analítico à esquerda e ação principal à direita.

### Dashboard mobile

Implementada em `src/components/dashboard/mobile-dashboard-shell.tsx`.

A experiência mobile é mais orientada a cards e sheets:

- Header compacto com título, mês em foco, email, botão de sair, CTA `Nova compra` e botão `Filtros`.
- Trilho horizontal de métricas com snap scroll.
- Controle segmentado entre `Compras` e `Resumo`.
- Badges com filtros ativos e ação para limpar filtros.
- Lista de compras em cards.
- Resumo mensal em cards.
- Drawer para filtros.
- Drawer para criação/edição de compra.

Essa separação mobile/desktop deve ser preservada porque o mobile tem interações próprias para reduzir fricção em telas pequenas.

### Formulário de compra

Implementado em `src/components/dashboard/purchase-form.tsx`.

Campos atuais:

- Descrição.
- Cartão.
- Data da compra.
- Mês da primeira parcela.
- Número de parcelas.
- Valor total.
- Observações.

O formulário usa server action, mensagens de erro por campo, loading no botão principal e comportamento especial no mobile para manter o campo focado visível dentro do drawer.

### Filtros

Implementados em `src/components/dashboard/purchase-filters.tsx`.

Filtros atuais:

- Busca por descrição.
- Status: todos, em andamento, concluídas.
- Mês.
- Cartão, quando existe mais de um cartão.

Os filtros são refletidos na URL e preservados ao editar, criar, cancelar edição e voltar para a dashboard.

### Login

Implementado em `src/app/auth/login/page.tsx` e `src/components/auth/login-form.tsx`.

A tela de login usa uma composição em duas áreas:

- Área editorial com proposta do app e dois cards explicando parcelas antigas e resumo por mês.
- Área de formulário com email, senha, primeiro acesso/esqueci senha, estados de sucesso/erro e botão com loading.

## Base de design atual

### Stack visual

- Next.js App Router.
- React 19.
- Tailwind CSS v4.
- shadcn/ui com estilo `base-nova`.
- Base UI para primitives como botão, drawer, select e alert dialog.
- lucide-react para ícones.
- sonner para toasts.
- Fontes:
  - Manrope para interface e títulos.
  - IBM Plex Mono disponível como fonte mono.

### Tokens e tema

Os tokens ficam em `src/app/globals.css` usando variáveis CSS e cores OKLCH.

Características atuais:

- Fundo claro levemente quente.
- Primária em verde/teal.
- Neutros suaves para cards, bordas, muted e inputs.
- Tema dark definido, mas sem troca de tema visível no app.
- Radius base de `0.625rem`, com muitos overrides maiores no layout.
- Background global com gradientes radiais sutis.

### Linguagem visual

O visual atual comunica um produto pessoal, calmo e funcional:

- Muitos painéis arredondados entre `24px` e `30px`.
- Superfícies translúcidas com `bg-background/85`, `bg-background/90`, `bg-background/95` e `backdrop-blur`.
- Bordas suaves com `border-border/70`.
- Sombras leves.
- Badges para contexto, status e filtros.
- Labels de métricas em uppercase com tracking largo.
- Números financeiros com `tabular-nums` em alguns pontos.
- Tabelas no desktop e cards no mobile.
- Drawers mobile com rodapé fixo para ações.

### Pontos fortes

- Fluxo principal está completo e direto.
- Há boa separação entre desktop e mobile.
- As ações críticas têm estados explícitos: loading, erro, empty state, confirmação de exclusão e toast.
- A UI já tem uma base consistente de componentes.
- O conteúdo textual explica bem o cálculo das parcelas.
- O app preserva filtros na navegação, o que ajuda a sensação de continuidade.

### Pontos a melhorar no redesign

- A hierarquia visual dos números principais pode ser mais forte e mais financeira.
- A dashboard desktop parece um conjunto de cards arredondados semelhantes; precisa de mais contraste entre áreas de decisão, navegação e dados.
- A tabela de compras pode ficar mais escaneável, com melhor densidade, alinhamento de valores e distinção entre metadados.
- Os status `Em andamento` e `Concluída` podem ter diferenciação visual mais clara.
- O mobile pode aproveitar melhor a prioridade entre total do mês, saldo restante e ações frequentes.
- A tela de login pode parecer mais refinada sem virar landing page.
- O design deve evitar um visual genérico de dashboard shadcn e assumir uma identidade de finanças pessoais modernas.

## Prompt para Claude Design

Use o prompt abaixo como entrada para o Claude Design.

```text
Você é um designer de produto sênior especializado em dashboards financeiros pessoais e interfaces SaaS utilitárias. Quero melhorar o design visual e a experiência do front-end de um app Next.js chamado "Contador de Despesas".

Contexto do produto:
O app ajuda uma pessoa a controlar compras parceladas no cartão de crédito. O usuário entra com email e senha, podendo criar ou redefinir a senha por link de recuperação, cadastra compras antigas ou atuais, informa data da compra, mês da primeira parcela, quantidade de parcelas e valor total, e também registra mensalidades recorrentes. O sistema calcula automaticamente parcelas já pagas, parcelas restantes, saldo restante, mês de conclusão, status da compra e totais por mês. A proposta é substituir uma planilha simples para entender quanto cai em cada mês e quais compras ainda estão em andamento.

Stack e restrições:
- Next.js App Router, React 19, Tailwind CSS v4.
- shadcn/ui com estilo base-nova.
- Base UI para primitives.
- lucide-react para ícones.
- sonner para toasts.
- Fontes atuais: Manrope e IBM Plex Mono.
- Linguagem do app: pt-BR.
- Não mude regras de negócio, nomes de campos, dados disponíveis, rotas ou ações.
- Preserve todos os fluxos atuais: login, logout, criação, edição, desativação/reativação, filtros, lista de compras, mensalidades, resumo mensal, estados vazios, erros de formulário e loading.
- Preserve a estratégia responsiva atual: desktop com dashboard em duas colunas e mobile com cards/drawers.
- Não transforme a home autenticada em landing page. A primeira tela após login deve continuar sendo a ferramenta.

Telas e componentes atuais:
- Login por email e senha com área editorial, formulário e CTA de primeiro acesso/esqueci senha.
- Dashboard desktop com header, métricas do mês, filtros, gráficos/resumo analítico, tabela de compras, mensalidades, tabela de resumo mensal e formulários laterais sticky.
- Dashboard mobile com header compacto, CTA "Nova compra", CTA "Mensalidade", botão "Filtros", trilho de métricas, controle segmentado "Compras/Resumo/Mensais", cards de compras, cards de resumo, cards de mensalidades, drawer de filtros e drawers de formulário.
- Formulário de compra com campos: descrição, cartão, data da compra, mês da primeira parcela, número de parcelas, valor total e observações.
- Compra exibe: descrição, cartão, data, período de parcelas, parcela do mês em foco, progresso, total, saldo restante e status.
- Resumo mensal exibe: mês, total, quantidade de compras e quantidade de parcelas.

Base visual atual:
- Fundo claro levemente quente.
- Primária em verde/teal.
- Cards grandes com borda suave, transparência, blur e radius alto.
- Badges para contexto, status e filtros.
- Títulos em Manrope.
- Tabelas no desktop e cards no mobile.

Objetivo do redesign:
Proponha uma direção visual mais moderna, clara e específica para finanças pessoais. Quero que o app pareça uma ferramenta de controle financeiro bem acabada, não apenas uma coleção genérica de cards arredondados.

Melhore especialmente:
- Hierarquia dos totais mensais.
- Leitura e densidade da tabela de compras.
- Leitura dos cards no mobile.
- Diferença visual entre compras ativas e concluídas.
- Organização dos filtros.
- Priorização da ação de registrar nova compra.
- Refinamento da tela de login sem exagerar em marketing.
- Consistência de espaçamento, radius, bordas, sombras, badges e estados.

Direção desejada:
- Interface calma, utilitária, precisa e pessoal.
- Visual de "finanças pessoais modernas".
- Mais escaneável e denso no desktop.
- Mais direto e acionável no mobile.
- Cores com contraste funcional, sem dominar tudo com uma única família de tons.
- Evite orbs, blobs decorativos, hero genérico, gradientes excessivos e cartões dentro de cartões.
- Use ícones apenas quando ajudarem reconhecimento de ação ou estado.
- Mantenha acessibilidade: foco visível, estados disabled/loading, contraste, labels claros e botões com área de toque confortável.

Entregue:
1. Uma proposta de direção visual com paleta, tipografia, radius, sombras, espaçamento e estilo de componentes.
2. Um redesenho conceitual por tela: login, dashboard desktop e dashboard mobile.
3. Recomendações específicas para métricas, tabelas, cards, filtros, formulário, estados vazios e confirmação de exclusão.
4. Um plano de aplicação em código usando Tailwind/shadcn sem mudar regras de negócio.
5. Critérios de aceite visuais para conferir se o redesign ficou bom.

Importante:
Não remova dados existentes. Não invente funcionalidades como orçamento, categorias, gráficos complexos, vencimento de fatura ou gestão completa de cartões. Você pode sugerir melhorias visuais que acomodem futuras funcionalidades, mas a proposta principal deve funcionar com os dados atuais.
```

## Checklist para avaliar a resposta do Claude Design

Antes de aplicar qualquer proposta visual, valide se ela:

- Mantém todos os fluxos existentes.
- Não exige novos dados que o app ainda não possui.
- Preserva pt-BR.
- Funciona para desktop e mobile.
- Melhora escaneabilidade real, não apenas decoração.
- Dá prioridade clara para total do mês, saldo restante e nova compra.
- Trata estados vazios, erros, loading e exclusão.
- Pode ser aplicada com Tailwind, shadcn/ui, Base UI e lucide-react.
- Não cria uma landing page no lugar da ferramenta.
- Não depende de assets externos obrigatórios.

## Arquivos de referência

- `src/app/page.tsx`
- `src/components/dashboard/desktop-dashboard.tsx`
- `src/components/dashboard/mobile-dashboard-shell.tsx`
- `src/components/dashboard/purchase-form.tsx`
- `src/components/dashboard/purchase-filters.tsx`
- `src/components/dashboard/delete-purchase-button.tsx`
- `src/app/auth/login/page.tsx`
- `src/components/auth/login-form.tsx`
- `src/app/globals.css`
- `src/lib/dashboard.ts`
- `src/lib/purchases.ts`
- `src/app/actions.ts`
