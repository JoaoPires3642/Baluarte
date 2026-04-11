# Refatoração web responsiva com linguagem shadcn/ui

## Objetivo
Refatorar a camada de apresentação do projeto existente para que o produto funcione bem no web com responsividade real, mantendo o máximo de compartilhamento com mobile e sem alterar regras de negócio nem fluxos principais. A interface deve adotar a linguagem visual do `shadcn/ui` onde fizer sentido, mas de forma compatível com a base atual em `Expo + react-native-web`.

## Escopo
Abrange tudo que já existe no app web atual:
- catálogo/vitrine
- customização
- checkout
- área admin

O foco é migrar componentes e layouts para um padrão visual e estrutural adequado para web e mobile, sem expandir escopo para novas funcionalidades.

## Restrições
- Preservar fluxos e regras de negócio atuais.
- Dar o mesmo peso para mobile e desktop nas decisões de UX.
- Forçar o máximo de compartilhamento entre mobile e web.
- Evitar duplicação desnecessária de telas inteiras.
- Só criar variações específicas por plataforma quando a UX web realmente exigir.

## Arquitetura proposta
A refatoração não reescreve o app. Ela reorganiza a camada de apresentação em três níveis:

1. **Primitives compartilhadas**
   Componentes base como button, input, card, dialog, sheet, badge, tabs e controles de formulário devem ser refatorados para uma biblioteca interna alinhada à linguagem do `shadcn/ui`.

2. **Componentes compostos**
   Blocos reutilizáveis como header, cards de produto, grids, etapas de checkout e blocos de customização devem passar a consumir as primitives novas.

3. **Screens/pages**
   Catálogo, customização, checkout e admin devem usar containers e composição responsiva explícita, em vez de depender de ajustes pontuais soltos.

Negócio, estado, serviços e fluxos permanecem compartilhados. A responsividade vira responsabilidade explícita da camada de layout e da composição dos componentes.

## Estratégia de componentes
Como o projeto usa `Expo + react-native-web`, a adoção de `shadcn/ui` deve seguir a linguagem visual e a ergonomia dos componentes, não uma troca mecânica e literal de implementação em todos os pontos.

A estratégia é:
- padronizar spacing, radius, border, shadow, tipografia e estados visuais
- migrar componentes atuais para uma camada compatível e compartilhável
- aproveitar padrões reais do `shadcn/ui` no web quando forem viáveis sem comprometer o compartilhamento
- refatorar componentes excessivamente mobile-first para uma API mais neutra e adaptável

## Responsividade
Os layouts devem se comportar corretamente em mobile, tablet e desktop.

Diretrizes:
- listas usam stack no mobile e grid adaptável no desktop
- formulários usam uma coluna no mobile e podem ir para duas colunas em telas maiores quando fizer sentido
- ações secundárias podem ficar em menu ou sheet no mobile e aparecer inline no desktop
- containers de páginas densas devem ter largura máxima, espaçamento e alinhamento adequados para web

A regra é manter o mesmo fluxo e a mesma lógica, ajustando a ergonomia conforme o viewport.

## Comportamento esperado por área

### Catálogo / vitrine
- cards, filtros, busca e navegação devem funcionar bem em mobile e desktop
- desktop deve aproveitar melhor a largura com grid e distribuição de conteúdo
- mobile mantém navegação compacta e clara

### Customização
- separar melhor preview, controles e resumo/configuração
- empilhamento no mobile
- distribuição lateral no desktop quando houver espaço

### Checkout
- manter fluxo atual
- melhorar hierarquia visual dos formulários e do resumo
- usar melhor organização espacial em telas maiores

### Admin
- adotar aparência e organização mais adequadas para painel web
- melhorar tabelas, filtros, ações e formulários no desktop
- manter funcionamento aceitável no mobile sem depender de scroll horizontal em todos os casos

## Critério de pronto
O trabalho será considerado pronto quando:
- todas as telas atuais continuarem funcionando
- não houver mudança de regra de negócio nos fluxos principais
- a interface estiver consistente com a linguagem do `shadcn/ui`
- a experiência estiver boa em mobile e desktop com o mesmo peso
- os componentes deixarem de depender estruturalmente de decisões apenas mobile
- os principais breakpoints de mobile, tablet e desktop estiverem cobertos

## Validação
A validação deve incluir:
- revisão das telas principais em larguras diferentes
- validação manual dos fluxos críticos de navegação, formulários, customização, checkout e admin
- execução dos testes existentes relevantes
- registro explícito de exceções localizadas quando algum componente exigir tratamento específico por plataforma

## Fora de escopo
- criar novas funcionalidades
- alterar regras de negócio
- reescrever toda a aplicação
- duplicar por padrão as telas entre mobile e web

## Abordagem recomendada
Seguir uma estratégia de base compartilhada com primitives e componentes compostos refatorados. Isso maximiza reaproveitamento, reduz risco de regressão e permite uma migração visual e estrutural consistente para web responsivo.