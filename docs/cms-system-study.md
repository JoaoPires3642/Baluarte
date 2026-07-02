# CMS System — Baluarte Site Customization

> Estudo de viabilidade para um sistema CMS que permita customizar **100% do site** sem necessidade de profissional front-end, acessível apenas por usuários com role `SUPER_ADMIN` (distinto do admin comum).

---

## Sumário

1. [Estado Atual](#1-estado-atual)
2. [O que é um CMS de Site Completo?](#2-o-que-é-um-cms-de-site-completo)
3. [Modelo de Dados Proposto](#3-modelo-de-dados-proposto)
4. [Role SUPER_ADMIN](#4-role-super_admin)
5. [Arquitetura de Implementação](#5-arquitetura-de-implementação)
6. [Estimativa de Armazenamento e Custos](#6-estimativa-de-armazenamento-e-custos)
7. [Nível de Dificuldade](#7-nível-de-dificuldade)
8. [Riscos e Considerações](#8-riscos-e-considerações)
9. [Roadmap Recomendado](#9-roadmap-recomendado)

---

## 1. Estado Atual

### O que já existe de customizável

| Funcionalidade | Como é hoje | Limitação |
|---|---|---|
| **Páginas institucionais** (privacidade, termos, trocas) | Tabela `site_page` (slug, title, content TEXT) — editável via admin com HTML | Apenas texto/HTML bruto, sem preview |
| **Configurações de contato** (email, telefone, WhatsApp, redes sociais) | Tabela `site_contact_settings` — editável via admin | Só texto, sem validação visual |
| **Mensagem do rodapé** | Campo `footerMessage` nas configs de contato | Texto simples |
| **Frete grátis** | Campo `free_shipping_min_value` | Valor mínimo para frete grátis |
| **Imagem e cor da categoria** | Colunas `image_url` e `color` na tabela `category` | Só categorias |
| **Logos dos times** | Coluna `logo` na tabela `team` | Só times |

### O que é fixo (hardcoded no front-end)

| Componente | Arquivo | O que faz |
|---|---|---|
| **Header** (logo, navegação, busca, carrinho) | `src/components/layout/header.tsx` | Menu principal, links fixos (Categorias, Times, Seleções) |
| **Footer** (links, categorias, contato) | `src/components/layout/footer.tsx` | Links fixos para páginas, categorias hardcoded |
| **Home hero** (banner principal) | `app/page.tsx` | Background image, título, descrição, botões, estatísticas fixas |
| **Seção de Categorias na Home** | `app/page.tsx` | Grid de categorias, link "Ver catálogo" |
| **Seção de Times na Home** | `app/page.tsx` | Grid de times em destaque |
| **Seção "Destaques"** | `app/page.tsx` | Produtos featured |
| **Seção "Mais Vendidos"** | `app/page.tsx` | Produtos best-sellers |
| **Seção "Por que comprar conosco"** | `app/page.tsx` | Card fixo com texto |
| **Seção "Frete grátis"** | `app/page.tsx` | Card com valor do frete grátis |
| **Newsletter** | `app/page.tsx` | Input de email, botão |
| **Navbar de categorias** | `app/page.tsx` | Links "Categorias", "Times", "Seleções" |

### Autenticação e Roles

```java
// InternalRole.java — atual
public enum InternalRole {
    ADMIN,
    CUSTOMER
}

// AuthUserJpaEntity — coluna role
// Valores possíveis: "admin", "client"
```

O role `ADMIN` atual dá acesso a **todas** as rotas `/api/v1/admin/*` sem distinção de granularidade. O filtro `AdminAuthFilter` simplesmente verifica se o role resolvido é `ADMIN`.

---

## 2. O que é um CMS de Site Completo?

Um CMS que permita 100% de customização visual sem front-end profissional precisa cobrir:

### 2.1 Seções Gerenciáveis

```
┌─────────────────────────────────────────────────────┐
│  HEADER                                             │
│  ├─ Logo (upload)                                   │
│  ├─ Nome da loja (texto)                            │
│  ├─ Itens do menu (links gerenciáveis)              │
│  ├─ Cores (primária, secundária, hover)             │
│  └─ Comportamento (sticky, compacto)                │
├─────────────────────────────────────────────────────┤
│  HOME PAGE (seções ordenáveis)                      │
│  ├─ Hero Banner                                     │
│  │   ├─ Background image/video                      │
│  │   ├─ Título / Subtítulo                          │
│  │   ├─ CTA button (texto + link)                   │
│  │   └─ Overlay color / opacity                     │
│  ├─ Seção: Grid de Categorias                       │
│  │   ├─ Título da seção                             │
│  │   ├─ Quais categorias mostrar                    │
│  │   └─ Layout (grid 2/3/4 colunas)                 │
│  ├─ Seção: Grid de Times                            │
│  │   ├─ Título                                      │
│  │   └─ Quantidade de times                         │
│  ├─ Seção: Produtos em Destaque                     │
│  │   ├─ Título                                      │
│  │   ├─ Critério (featured / manual / best-sellers) │
│  │   └─ Limite de produtos                          │
│  ├─ Seção: Banner Promocional                       │
│  │   ├─ Background image/color                      │
│  │   ├─ Título / Descrição                          │
│  │   ├─ CTA button                                  │
│  │   └─ Posição (antes/depois de X)                 │
│  ├─ Seção: Newsletter                               │
│  └─ Seção: HTML Livre                              │
├─────────────────────────────────────────────────────┤
│  FOOTER                                             │
│  ├─ Logo / Nome                                     │
│  ├─ Colunas de links (título + links)               │
│  ├─ Texto copyright                                 │
│  └─ Cores de fundo / texto                          │
├─────────────────────────────────────────────────────┤
│  CSS / TEMA                                         │
│  ├─ Cores do tema (primary, secondary, accent)      │
│  ├─ Fontes (títulos, corpo)                         │
│  ├─ Border radius                                   │
│  ├─ Espaçamentos                                    │
│  └─ CSS customizado (avançado)                      │
├─────────────────────────────────────────────────────┤
│  MEDIA LIBRARY                                      │
│  ├─ Upload de imagens                               │
│  ├─ Crop / resize (via URL params)                  │
│  └─ Organização por pasta                           │
└─────────────────────────────────────────────────────┘
```

### 2.2 Experiência do SUPER_ADMIN

O SUPER_ADMIN deve poder:

1. **Gerenciar seções da Home** — adicionar, remover, reordenar seções via drag-and-drop
2. **Editar cada seção** — sem precisar abrir código, usando formulários com preview
3. **Gerenciar Header e Footer** — links do menu, logos, cores
4. **Gerenciar Tema** — paleta de cores, fontes
5. **Gerenciar Mídia** — upload e seleção de imagens
6. **Ver preview ao vivo** antes de publicar
7. **Publicar / Rascunho** — versionamento básico (opcional na v1)

---

## 3. Modelo de Dados Proposto

### 3.1 Tabelas Novas

```sql
-- ================================================
-- CMS: Temas
-- ================================================
CREATE TABLE cms_theme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL DEFAULT 'default',
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Cores
    color_primary VARCHAR(7) NOT NULL DEFAULT '#0f274d',
    color_secondary VARCHAR(7) NOT NULL DEFAULT '#c3222a',
    color_accent VARCHAR(7) NOT NULL DEFAULT '#1657a3',
    color_background VARCHAR(7) NOT NULL DEFAULT '#ffffff',
    color_text VARCHAR(7) NOT NULL DEFAULT '#1e293b',
    color_text_muted VARCHAR(7) NOT NULL DEFAULT '#64748b',
    
    -- Fontes
    font_heading VARCHAR(100) NOT NULL DEFAULT 'Inter',
    font_body VARCHAR(100) NOT NULL DEFAULT 'Inter',
    
    -- Bordas / Espaçamento
    border_radius VARCHAR(10) NOT NULL DEFAULT '0.5rem',
    spacing_unit VARCHAR(10) NOT NULL DEFAULT '1rem',
    
    -- Custom CSS (uso avançado)
    custom_css TEXT DEFAULT '',
    
    -- Header
    header_style VARCHAR(20) NOT NULL DEFAULT 'sticky', -- sticky | static | floating
    header_background VARCHAR(20) NOT NULL DEFAULT 'white', -- white | transparent | primary
    
    -- Footer
    footer_background VARCHAR(20) NOT NULL DEFAULT 'primary', -- primary | dark | white
    footer_text_color VARCHAR(20) NOT NULL DEFAULT 'light', -- light | dark
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- CMS: Seções da Home Page
-- ================================================
CREATE TABLE cms_home_section (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_type VARCHAR(40) NOT NULL,          -- hero, categories, teams, featured, best_sellers, promo_banner, newsletter, custom_html
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_draft BOOLEAN NOT NULL DEFAULT true,     -- rascunho vs publicado
    config JSONB NOT NULL DEFAULT '{}',          -- configuração específica do tipo
    /*
      Config examples:
      
      hero: {
        "backgroundImage": "https://...",
        "backgroundColor": "#07162f",
        "overlayOpacity": 0.82,
        "title": "Baluarte Artigos Esportivos",
        "subtitle": "Camisetas oficiais...",
        "ctaText": "Ver categorias",
        "ctaLink": "/categorias",
        "secondaryCtaText": "Explorar catálogo",
        "secondaryCtaLink": "/busca",
        "stats": [
          {"value": "+12 mil", "label": "Clientes atendidos"},
          {"value": "24h", "label": "Envio prioritário"},
          {"value": "Premium", "label": "Curadoria oficial"}
        ]
      }
      
      categories: {
        "title": "Categorias",
        "subtitle": "Explore",
        "categoryIds": [],       // vazio = todas
        "columns": 4,
        "showViewAll": true
      }
      
      promo_banner: {
        "backgroundImage": "https://...",
        "backgroundColor": "#0f274d",
        "title": "Por que comprar conosco",
        "description": "Trabalhamos com...",
        "ctaText": "Falar com a equipe",
        "ctaLink": "/contato",
        "layout": "side-by-side" | "centered"
      }
      
      custom_html: {
        "html": "<div class='...'>...</div>"
      }
    */
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cms_home_section_order ON cms_home_section(sort_order);

-- ================================================
-- CMS: Header / Navigation Links
-- ================================================
CREATE TABLE cms_nav_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES cms_nav_link(id) ON DELETE CASCADE,
    location VARCHAR(20) NOT NULL DEFAULT 'header', -- header | footer | mobile
    sort_order INT NOT NULL DEFAULT 0,
    label VARCHAR(100) NOT NULL,
    href VARCHAR(500) NOT NULL,
    is_external BOOLEAN NOT NULL DEFAULT false,
    icon VARCHAR(50),                              -- nome do ícone (lucide-react)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cms_nav_link_location ON cms_nav_link(location, sort_order);

-- ================================================
-- CMS: Site Settings (meta, SEO)
-- ================================================
CREATE TABLE cms_site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(100) NOT NULL DEFAULT 'Baluarte',
    site_tagline VARCHAR(200) DEFAULT 'Artigos esportivos',
    site_description TEXT DEFAULT '',
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    og_image_url VARCHAR(500),
    seo_default_title VARCHAR(200),
    seo_default_description TEXT,
    seo_default_keywords TEXT,
    google_analytics_id VARCHAR(50),
    google_tag_manager_id VARCHAR(50),
    enable_pwa BOOLEAN DEFAULT false,
    maintenance_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Garantir que só tenha uma linha
CREATE UNIQUE INDEX idx_cms_site_settings_singleton ON cms_site_settings((true));

-- ================================================
-- CMS: Media Library (referência para uploads)
-- ================================================
CREATE TABLE cms_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INT,
    height INT,
    alt_text VARCHAR(300),
    folder VARCHAR(100) DEFAULT '/',
    url VARCHAR(500) NOT NULL,
    created_by VARCHAR(120),                     -- user_id do SUPER_ADMIN
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Tabelas Modificadas

```sql
-- Adicionar role SUPER_ADMIN à tabela auth_user
-- (já existe coluna role VARCHAR(16) — só expandir valores possíveis)

-- Opcional: adicionar coluna is_super_admin
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;
```

### 3.3 Impacto no Banco Existente

| Tabela | Impacto |
|---|---|
| `auth_user` | Adicionar `is_super_admin` ou expandir role para `super_admin` |
| `site_page` | **Manter** — integrada ao CMS como seção de páginas |
| `site_contact_settings` | **Manter** — integrada às configs de contato do CMS |
| `category` | **Manter** — consumo das seções do CMS |
| `team` | **Manter** — consumo das seções do CMS |

**Migration necessária:** 1 nova (V40) para criar as 6 tabelas acima.

---

## 4. Role SUPER_ADMIN

### 4.1 Definição

```
SUPER_ADMIN = ADMIN + acesso ao CMS completo
```

| Permissão | ADMIN | SUPER_ADMIN |
|---|---|---|
| Gerenciar produtos | ✅ | ✅ |
| Gerenciar pedidos | ✅ | ✅ |
| Gerenciar categorias/times | ✅ | ✅ |
| Gerenciar contato | ✅ | ✅ |
| Editar páginas (texto) | ✅ | ✅ |
| **Gerenciar layout da Home** | ❌ | ✅ |
| **Gerenciar Header/Footer** | ❌ | ✅ |
| **Gerenciar Tema (cores/fontes)** | ❌ | ✅ |
| **Gerenciar Mídia** | ❌ | ✅ |
| **Gerenciar SUPER_ADMINs** | ❌ | ✅ |
| **CSS customizado** | ❌ | ✅ |
| **Modo de manutenção** | ❌ | ✅ |

### 4.2 Implementação no Backend

**Passo 1:** Adicionar role ao enum:

```java
public enum InternalRole {
    SUPER_ADMIN,
    ADMIN,
    CUSTOMER
}
```

**Passo 2:** Modificar `InternalRoleResolver` para reconhecer SUPER_ADMIN:

```java
// Lista separada de super-admin emails/userIds
// Ou campo is_super_admin na tabela auth_user

// No InternalRoleResolver, após resolver ADMIN:
if (user.isSuperAdmin()) {
    return InternalRole.SUPER_ADMIN;
}
```

**Passo 3:** Criar `SuperAdminAuthFilter` ou modificar `AdminAuthFilter` para rotas de CMS:

```java
// Rotas /api/v1/admin/cms/* exigem SUPER_ADMIN
// Rotas /api/v1/admin/* existentes continuam com ADMIN
```

Ou usar anotação `@SuperAdminOnly` nos controllers do CMS.

**Passo 4:** Adicionar configuração para lista de SUPER_ADMINs:

```yaml
app:
  auth:
    super-admin-emails: ${APP_AUTH_SUPER_ADMIN_EMAILS:}
    super-admin-user-ids: ${APP_AUTH_SUPER_ADMIN_USER_IDS:}
```

### 4.3 Gerenciamento de SUPER_ADMINs

Quem cria o primeiro SUPER_ADMIN?
1. **Ambiente:** via variável de ambiente `APP_AUTH_SUPER_ADMIN_EMAILS`
2. **Painel:** após o primeiro login como SUPER_ADMIN, ele pode promover outros pelo próprio CMS

### 4.4 Frontend: Navbar do SUPER_ADMIN

O menu do admin atual ganha uma seção extra **"CMS"** visível apenas para SUPER_ADMIN:

```
Admin Navbar (ADMIN):
  Dashboard | Produtos | Pedidos | Categorias | Times || Frete | Estações | Contato | Páginas

Admin Navbar (SUPER_ADMIN):
  Dashboard | Produtos | Pedidos | Categorias | Times || Frete | Estações | Contato | Páginas | CMS ▼
    ├─ Home Page
    ├─ Header & Footer
    ├─ Tema
    ├─ Mídia
    ├─ SEO
    └─ SUPER_ADMINs
```

---

## 5. Arquitetura de Implementação

### 5.1 Backend (Spring Boot)

**Novos módulos:**

```
br.com.baluarte.core.modules.cms/
├── api/
│   ├── CmsHomeSectionController.java      ← CRUD seções da Home
│   ├── CmsThemeController.java            ← CRUD tema
│   ├── CmsNavLinkController.java          ← CRUD links navegação
│   ├── CmsSiteSettingsController.java     ← SEO, metadados
│   ├── CmsMediaController.java            ← Upload + CRUD mídia
│   └── CmsSuperAdminController.java       ← Gerenciar SUPER_ADMINs
├── application/
│   └── ...
├── domain/
│   └── CmsHomeSection.java, CmsTheme.java, ...
└── infrastructure/
    ├── CmsHomeSectionJpaEntity.java
    ├── CmsThemeJpaEntity.java
    ├── CmsNavLinkJpaEntity.java
    ├── CmsSiteSettingsJpaEntity.java
    ├── CmsMediaJpaEntity.java
    └── *Repository.java / *RepositoryAdapter.java
```

**Endpoints:**

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/api/v1/cms/sections` | Público | Seções da Home (apenas published) |
| GET | `/api/v1/admin/cms/sections` | SUPER_ADMIN | Todas as seções |
| POST | `/api/v1/admin/cms/sections` | SUPER_ADMIN | Criar seção |
| PUT | `/api/v1/admin/cms/sections/{id}` | SUPER_ADMIN | Atualizar seção |
| DELETE | `/api/v1/admin/cms/sections/{id}` | SUPER_ADMIN | Remover seção |
| PATCH | `/api/v1/admin/cms/sections/reorder` | SUPER_ADMIN | Reordenar seções |
| GET | `/api/v1/admin/cms/theme` | SUPER_ADMIN | Obter tema ativo |
| PUT | `/api/v1/admin/cms/theme` | SUPER_ADMIN | Atualizar tema |
| GET | `/api/v1/cms/theme` | Público | Obter tema ativo |
| GET | `/api/v1/admin/cms/nav-links` | SUPER_ADMIN | Links de navegação |
| PUT | `/api/v1/admin/cms/nav-links` | SUPER_ADMIN | Atualizar links |
| GET | `/api/v1/cms/nav-links` | Público | Links de navegação |
| GET/PUT | `/api/v1/admin/cms/site-settings` | SUPER_ADMIN | SEO/Site settings |
| POST | `/api/v1/admin/cms/media/upload` | SUPER_ADMIN | Upload de mídia |
| GET | `/api/v1/admin/cms/media` | SUPER_ADMIN | Listar mídia |
| DELETE | `/api/v1/admin/cms/media/{id}` | SUPER_ADMIN | Remover mídia |

### 5.2 Frontend (Next.js)

**Novas páginas admin (protegidas por SUPER_ADMIN):**

```
app/admin/cms/
├── layout.tsx                            ← verifica SUPER_ADMIN
├── page.tsx                              ← Dashboard do CMS
├── home/
│   ├── page.tsx                          ← Gerenciar seções da Home
│   ├── section-editor.tsx                ← Editor individual de seção
│   └── section-preview.tsx              ← Preview da seção
├── theme/
│   └── page.tsx                          ← Editor de tema (cores, fontes)
├── navigation/
│   └── page.tsx                          ← Links do header/footer
├── media/
│   └── page.tsx                          ← Media library
├── seo/
│   └── page.tsx                          ← SEO / site settings
├── super-admins/
│   └── page.tsx                          ← Gerenciar SUPER_ADMINs
```

**Componentes compartilhados:**

```
src/components/cms/
├── section-list.tsx                      ← Lista ordenável (drag & drop)
├── section-config-form.tsx              ← Form dinâmico por tipo
├── theme-color-picker.tsx               ← Seletor de cores
├── media-picker.tsx                     ← Seletor de mídia
├── preview-iframe.tsx                   ← Preview em tempo real
└── publish-bar.tsx                      ← Botão publicar / reverter
```

**API Client (frontend para CMS):**

```typescript
// src/lib/cms-api.ts
export async function fetchHomeSections() { ... }
export async function createHomeSection(config: HomeSectionConfig) { ... }
export async function updateHomeSection(id: string, config: Partial<HomeSectionConfig>) { ... }
export async function reorderHomeSections(order: string[]) { ... }
export async function fetchTheme() { ... }
export async function updateTheme(theme: ThemeConfig) { ... }
// ...
```

### 5.3 Integração com a Home Page Existente

A home page atual (`app/page.tsx`) precisa ser refatorada para consumir as seções do CMS:

```tsx
// app/page.tsx (refatorado)
export default async function Home() {
  const sections = await fetchHomeSections() // GET /api/v1/cms/sections
  const theme = await fetchTheme()           // GET /api/v1/cms/theme
  
  return (
    <ThemeProvider theme={theme}>
      <div className="space-y-14 py-6 md:space-y-20 md:py-10">
        {sections.map(section => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </ThemeProvider>
  )
}
```

```tsx
// componentes que renderizam cada tipo de seção
const SECTION_RENDERERS: Record<string, React.ComponentType<{ config: SectionConfig }>> = {
  hero: HeroSection,
  categories: CategoriesSection,
  teams: TeamsSection,
  featured: FeaturedSection,
  best_sellers: BestSellersSection,
  promo_banner: PromoBannerSection,
  newsletter: NewsletterSection,
  custom_html: CustomHtmlSection,
}
```

### 5.4 Renderização do Header/Footer

O header e footer precisam ser refatorados para consumir `cms_nav_link` e `cms_theme`:

```tsx
// Header agora recebe os links do CMS
export async function Header() {
  const navLinks = await fetchNavLinks('header')
  const theme = await fetchTheme()
  
  return (
    <header style={{ backgroundColor: theme.headerBackground === 'primary' ? theme.colorPrimary : '#fff' }}>
      {/* Links dinâmicos em vez de hardcoded */}
      <nav>{navLinks.map(link => <Link key={link.id} href={link.href}>{link.label}</Link>)}</nav>
    </header>
  )
}
```

---

## 6. Estimativa de Armazenamento e Custos

### 6.1 Banco de Dados (PostgreSQL)

| Tabela | Registros Esperados | Tamanho por Row | Total Estimado |
|---|---|---|---|
| `cms_theme` | 1-3 | ~2 KB | ~6 KB |
| `cms_home_section` | 5-15 | ~5 KB (JSONB) | ~75 KB |
| `cms_nav_link` | 10-30 | ~0.5 KB | ~15 KB |
| `cms_site_settings` | 1 | ~1 KB | ~1 KB |
| `cms_media` (metadados) | 50-500 | ~0.5 KB | ~250 KB |
| **Total banco** | | | **< 1 MB** |

> **Custo de armazenamento PostgreSQL: irrelevante.** Planos gratis (Neon, Supabase, Railway) oferecem 500MB+.

### 6.2 Armazenamento de Mídia (S3 Compatible — R2/Cloudflare)

O custo real está nas **imagens** (uploads de banners, logos, backgrounds).

| Cenário | Imagens | Tamanho Médio | Total | Custo Aproximado (R2) |
|---|---|---|---|---|
| Mínimo | 20 imagens | 200 KB | 4 MB | ~$0.00/mês (free tier 10GB) |
| Médio | 100 imagens | 300 KB | 30 MB | ~$0.00/mês |
| Alto (com históricos) | 500 imagens | 400 KB | 200 MB | ~$0.00/mês (free tier 10GB) |

**Cloudflare R2:** $0.015/GB/mês após 10GB free → mesmo com 1GB < $0.02/mês

### 6.3 Cache (Redis / Vercel Edge Config)

Para performance, as configs do CMS devem ser cacheadas:

- Seções da Home: cache de 5 min ou revalidação via webhook
- Tema: cache de 60 min
- Nav links: cache de 60 min

**Custo:**
- Vercel Edge Config: $0.10/GB/mês (free tier incluso)
- Redis (Upstash): free tier 10MB → suficiente

### 6.4 Custo Total Estimado

| Item | Custo/mês |
|---|---|
| Banco (extra) | $0 |
| Storage (R2) | $0 — $0.02 |
| Cache | $0 (free tier) |
| **Total** | **$0 — $0.02/mês** |

---

## 7. Nível de Dificuldade

### 7.1 Estimativa Geral

```
Dificuldade: MÉDIA (6/10)
Tempo estimado: 4-6 semanas (1 dev full-stack)
```

### 7.2 Detalhamento por Camada

| Camada | Complexidade | Horas Estimadas | Observações |
|---|---|---|---|
| **Backend — Modelo de dados** | 🔵 Baixa | 8h | 6 tabelas, JSONB, migrations Flyway |
| **Backend — CRUD de seções** | 🔵 Baixa | 16h | Controller → Service → Repository padrão |
| **Backend — SUPER_ADMIN role** | 🟡 Média | 8h | Modificar resolver, criar filter, testar |
| **Backend — Upload de mídia** | 🟡 Média | 8h | Já existe `MediaUploadController`, reusar |
| **Backend — API pública** | 🔵 Baixa | 8h | Endpoints GET para o front-end consumir |
| **Frontend — Editor de seções** | 🔴 Alta | 40h | Drag & drop, formulários dinâmicos, preview |
| **Frontend — Editor de tema** | 🟡 Média | 16h | Color picker, preview de cores, fonte |
| **Frontend — Gerenciador de links** | 🟡 Média | 8h | CRUD de links, ordenação |
| **Frontend — Media picker** | 🟡 Média | 12h | Grid de imagens, upload, seleção |
| **Frontend — Refatorar Home Page** | 🔴 Alta | 24h | Quebrar em componentes, consumir CMS |
| **Frontend — Refatorar Header/Footer** | 🟡 Média | 16h | Consumir links dinâmicos |
| **Frontend — Admin layout SUPER_ADMIN** | 🔵 Baixa | 4h | Navbar condicional, proteção de rota |
| **Testes** | 🟡 Média | 16h | Testes de integração backend + frontend |
| **Total** | | **~184h (4-6 semanas)** | |

### 7.3 Fatores de Risco

| Fator | Risco | Mitigação |
|---|---|---|
| JSONB complexo nas seções | 🟡 | Usar schema validation no backend + type safe no frontend |
| Drag & drop | 🟡 | Usar `@dnd-kit/core` (já é padrão React) |
| Preview em tempo real | 🔴 | Começar com preview simple (recarregar iframe), não live |
| Refatorar header/footer sem quebrar | 🟡 | Testes visuais + feature flags |
| Performance da Home | 🟡 | Cache + ISR na Vercel |
| SUPER_ADMIN role security | 🔴 | Testar exaustivamente (ninguém sem role acessa) |

---

## 8. Riscos e Considerações

### 8.1 Performance

**Problema:** A Home Page atualmente é server-rendered com dados do catálogo. Adicionar fetching de seções CMS + tema pode aumentar o tempo de renderização.

**Solução:**
1. Cache agressivo (`next: { revalidate: 300 }`) nas rotas públicas do CMS
2. Usar `unstale-while-revalidate` para tema (muda raramente)
3. Se necessário, colapsar configs do CMS em um único endpoint `/api/v1/cms/full-page`

### 8.2 Consistência de Dados

**Problema:** JSONB permite qualquer estrutura. Seção do tipo `hero` pode receber config de `promo_banner`.

**Solução:**
1. Validar schema no backend (Jakarta Validation + validator específico por tipo)
2. TypeScript discriminated unions no frontend
3. Testes de integração para cada tipo de seção

### 8.3 Segurança

**Problema:** SUPER_ADMIN pode injetar HTML/JS arbitrário via `custom_html` ou CSS customizado.

**Solução:**
1. Sanitizar HTML com DOMPurify (frontend + backend)
2. CSP já configurado no `next.config.ts` — **não remover**
3. CSS customizado é seguro por natureza (só afeta estilo)
4. Logar todas as alterações do CMS (para auditoria)

### 8.4 Experiência do Usuário Não-Técnico

**Problema:** Um SUPER_ADMIN sem conhecimento técnico pode quebrar o layout do site.

**Solução:**
1. **Sistema de rascunho/publicação:** todas as alterações ficam em draft até aprovação
2. **Preview:** botão "Visualizar" que abre o site com as alterações draft
3. **Reset:** botão "Restaurar padrão" por seção
4. **Validação visual:** cada seção tem um preview mínimo no editor

### 8.5 Custom_Html Sections

HTML livre é o recurso mais poderoso e mais perigoso. Idealmente o CMS cobre 95% dos casos com seções estruturadas, e o `custom_html` é um recurso avançado documentado.

---

## 9. Roadmap Recomendado

### Fase 1 — Fundação (Semana 1-2)

- [ ] Criar role `SUPER_ADMIN` no backend
- [ ] Migrations Flyway para tabelas do CMS
- [ ] CRUD básico de seções da Home (backend)
- [ ] CRUD de tema (backend)
- [ ] CRUD de nav-links (backend)
- [ ] Endpoints públicos para o front-end
- [ ] Variáveis de ambiente: `APP_AUTH_SUPER_ADMIN_EMAILS`

### Fase 2 — Admin CMS Frontend (Semana 2-4)

- [ ] Proteção de rota SUPER_ADMIN no front-end
- [ ] Navbar do CMS (visível apenas para SUPER_ADMIN)
- [ ] Editor de seções (lista + formulário por tipo)
- [ ] Drag & drop de seções
- [ ] Media library (upload + seleção)
- [ ] Editor de tema (cores, fontes)
- [ ] Gerenciador de links de navegação
- [ ] Painel SEO / Site Settings

### Fase 3 — Refatoração do Site (Semana 4-5)

- [ ] Refatorar `app/page.tsx` para consumir seções do CMS
- [ ] Refatorar `Header` para consumir `cms_nav_link`
- [ ] Refatorar `Footer` para consumir `cms_nav_link` + tema
- [ ] Aplicar tema (cores, fontes) via CSS variables no `<html>`
- [ ] Garantir fallback: se CMS vazio, usar layout atual hardcoded

### Fase 4 — Polimento (Semana 5-6)

- [ ] Sistema de rascunho / publicação
- [ ] Preview ao vivo
- [ ] Reset de seção para padrão
- [ ] Testes de integração
- [ ] Documentação do CMS para SUPER_ADMIN
- [ ] Auditoria de segurança (XSS, role bypass)

---

## Apêndice A: Comparação de Abordagens

| Abordagem | Esforço | Flexibilidade | Manutenção | Recomendação |
|---|---|---|---|---|
| **Seções estruturadas** (JSONB + tipos fixos) | Médio | Alta (cobre 95%) | Baixa | ✅ **Recomendado** |
| **HTML/CSS livre** (editor WYSIWYG) | Baixo | Total | Alta | ❌ Perigoso sem supervisão |
| **Headless CMS externo** (Strapi, Sanity) | Médio | Alta | Média | ❌ Outra infra para gerenciar |
| **Git-based CMS** (Decap CMS, TinaCMS) | Médio | Alta | Média | ❌ Requer git flow |
| **Componentes por configuração** (proposto) | Médio | Alta | Baixa | ✅ Melhor custo-benefício |

## Apêndice B: Exemplo de Fluxo — Criar Seção Hero

```
SUPER_ADMIN abre /admin/cms/home
  → clica "Adicionar Seção"
  → escolhe tipo "Hero Banner"
  → formulário dinâmico aparece:
      ├─ Background: [Upload ou URL] [Cor sólida]
      ├─ Título: [texto rico]
      ├─ Subtítulo: [textarea]
      ├─ CTA primário: [texto] [link]
      ├─ CTA secundário: [texto] [link]
      ├─ Estatísticas: [adicionar linha: valor + label]
      └─ Overlay: [opacidade 0-100%] [cor]
  → "Salvar como Rascunho"
  → "Visualizar" → abre preview
  → "Publicar"
```

## Apêndice C: Exemplo de JSON de Config (Hero Section)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sectionType": "hero",
  "sortOrder": 1,
  "isActive": true,
  "isDraft": false,
  "config": {
    "backgroundImage": "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
    "backgroundColor": "#07162f",
    "overlayColor": "#07162f",
    "overlayOpacity": 0.82,
    "title": "Baluarte\nartigos esportivos",
    "subtitle": "Camisetas oficiais dos maiores clubes do Brasil e do mundo.",
    "ctaText": "Ver categorias",
    "ctaLink": "/categorias",
    "secondaryCtaText": "Explorar catálogo",
    "secondaryCtaLink": "/busca",
    "badgeText": "Curadoria Baluarte",
    "stats": [
      { "value": "+12 mil", "label": "Clientes atendidos" },
      { "value": "24h", "label": "Envio prioritário" },
      { "value": "Premium", "label": "Curadoria oficial" }
    ]
  }
}
```
