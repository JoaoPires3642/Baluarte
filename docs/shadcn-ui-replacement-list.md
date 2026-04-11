# Lista de Componentes Manuais - Substituição shadcn/ui

## Componentes de Layout

| Componente Manual | shadcn/ui Equivalent | Status |
|-------------------|---------------------|--------|
| `AppHeader.tsx` | - | Header custom |
| `BottomNav.tsx` | Navigation Menu | Sidebar desktop ✓ |
| `SkeletonCard.tsx` | Skeleton | Loading states |

## Componentes de Formulário

| Componente Manual | shadcn/ui Equivalent | Status |
|-------------------|---------------------|--------|
| `SelectField.tsx` | Select | Dropdown |
| `ProductFormStepOne.tsx` | Form + Input | Cadastro produto |
| `ProductFormStepTwo.tsx` | Form + Input | Cadastro produto |
| `ProductFormStepThree.tsx` | Form + Input | Cadastro produto |
| `ProductFormModal.tsx` | Dialog + Form | Modal form |
| `SimpleFormModal.tsx` | Dialog | Modal genérico |
| `ErrorBanner.tsx` | Alert / Toast | Erros |
| `AddressManager.tsx` | Form + Input | Endereços |

## Componentes Storefront

| Componente Manual | shadcn/ui Equivalent | Status |
|-------------------|---------------------|--------|
| `JerseyPreview.tsx` | - | Preview produto |
| `OrderTimeline.tsx` | Timeline | Histórico pedidos |
| `PaymentPixPanel.tsx` | - | Pagamento PIX |
| `PaymentCardForm.tsx` | Form + Input | Pagamento cartão |

## Componentes Admin

| Componente Manual | shadcn/ui Equivalent | Status |
|-------------------|---------------------|--------|
| `AdminDashboardScreen.tsx` | - | Dashboard admin |
| `AdminProductsScreen.tsx` | Data Table | Lista produtos |
| `AdminOrdersScreen.tsx` | Data Table | Lista pedidos |
| `ProductFormProgressBar.tsx` | Progress | Step indicator |
| `TemplateMappingTool.tsx` | - | Tool custom |
| `NotificationCenter.tsx` | Popover | Notificações |
| `OrderFilter.tsx` | Dropdown Menu | Filtros |
| `BulkEditModal.tsx` | Dialog | Edição em massa |
| `BestSellersAnalytics.tsx` | Card | KPIs |
| `RestockActionSheet.tsx` | Sheet | Ação restock |

## Componentes UI Base (a criar)

| Componente shadcn/ui | Descrição |
|---------------------|-----------|
| Button | Botão primário/secundário/ghost |
| Card | Container com sombra/borda |
| Input | Campo de texto |
| Label | Label de formulário |
| Checkbox | checkmark |
| Radio Group | opções únicas |
| Switch | toggle on/off |
| Badge |标签 |
| Avatar | Imagem de perfil |
| Dropdown Menu | Menu suspensso |
| Dialog | Modal |
| Sheet | Panel deslizante |
| Toast | Notificações |
| Table | Lista dados |
| Tabs | Abas |
| Separator | Divisor |
| Skeleton | Loading |

## Prioridade de Substituição

1. **Alta** - Form inputs, Buttons, Cards (usados em todas telas)
2. **Média** - Modals, Dialogs, Dropdowns
3. **Baixa** - Componentes específicos (Admin, Dashboard)

## Notas

- shadcn/ui usa Tailwind CSS - precisa adaptar para React Native
- Os componentes devem seguir o padrão de design atual (cores, radius, shadows)
- Manter a API existente para minimizar refatoração