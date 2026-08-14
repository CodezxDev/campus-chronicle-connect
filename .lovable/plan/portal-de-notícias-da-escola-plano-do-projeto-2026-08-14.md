# Portal de Notícias da Escola — Plano do Projeto

Portal moderno para alunos, professores, pais e visitantes, com conteúdo público e um painel administrativo protegido.

## 1. Tecnologias

- **Front-end:** React 19 + TanStack Start (SSR, bom para SEO das notícias), Tailwind CSS v4, componentes shadcn, TanStack Query.
- **Back-end:** Lovable Cloud (banco Postgres, autenticação, storage de imagens/áudio e funções de servidor) — sem contas externas.
- **Busca:** busca full-text nativa do Postgres (português), com índice sobre título, resumo e conteúdo.
- **Mídia:** upload de imagens (galeria, capas) e áudio/links de podcast no storage.

## 2. Páginas (rotas)

Públicas:
- `/` — home: manchete principal, últimas notícias, avisos em destaque, próximos eventos, último episódio do podcast.
- `/noticias` e `/noticias/$slug`
- `/blog` e `/blog/$slug`
- `/podcast` e `/podcast/$slug` (player de áudio)
- `/eventos` (lista + calendário) e `/eventos/$slug`
- `/projetos` e `/projetos/$slug` (projetos dos alunos, com turma/disciplina/autores)
- `/avisos` (comunicados oficiais, com prioridade e validade)
- `/galeria` e `/galeria/$slug` (álbuns de fotos com lightbox)
- `/busca?q=` — resultados unificados, filtráveis por tipo
- `/sobre` e `/contato`
- `/auth` — login (apenas equipe; visitantes não precisam de conta)

Administrativas (protegidas, sob layout autenticado):
- `/admin` — visão geral (rascunhos, publicados, próximos eventos)
- `/admin/noticias`, `/admin/blog`, `/admin/podcast`, `/admin/eventos`, `/admin/projetos`, `/admin/avisos`, `/admin/galeria`
- `/admin/categorias`, `/admin/midias`, `/admin/usuarios` (papéis)

## 3. Banco de dados (tabelas principais)

- `profiles` — dados do usuário da equipe (nome, foto, cargo/bio).
- `user_roles` — papéis em tabela separada: `admin`, `editor`, `autor` (nunca no perfil, por segurança).
- `categories` — nome, slug, cor; usada por notícias/blog/projetos.
- `posts` — conteúdo editorial unificado com campo `type` (`noticia` | `blog`): título, slug, resumo, conteúdo, imagem de capa, categoria, autor, status (rascunho/publicado), destaque, data de publicação, visualizações.
- `podcast_episodes` — título, slug, descrição, número do episódio, URL do áudio, duração, capa, convidados, data.
- `events` — título, slug, descrição, início/fim, local, imagem, público-alvo, inscrições (link opcional).
- `student_projects` — título, slug, resumo, descrição, turma, disciplina, ano, autores (alunos), professor orientador, imagens.
- `announcements` — título, corpo, prioridade (normal/alta/urgente), público-alvo, vigência (início/fim), fixado.
- `galleries` + `gallery_photos` — álbum (título, capa, data, evento relacionado) e fotos (arquivo, legenda, ordem).
- `media_assets` — arquivos enviados (caminho no storage, tipo, tamanho, texto alternativo).

Regras de acesso: leitura pública apenas de itens publicados/vigentes; criação e edição restritas a equipe autenticada conforme papel (autor edita o próprio conteúdo, editor/admin editam tudo, admin gerencia papéis).

## 4. Funcionalidades

- Publicação com rascunho → revisão → publicado, agendamento por data e conteúdo em destaque.
- Categorias e tags, conteúdo relacionado no fim de cada matéria.
- Busca unificada com filtros por tipo, categoria e período.
- Avisos fixados no topo do site enquanto vigentes.
- Calendário de eventos com visão mensal e lista.
- Galeria com álbuns, lightbox e navegação por teclado.
- Player de podcast com lista de episódios e feed RSS.
- Contador de visualizações e seção "mais lidas".
- SEO: metadados por página, títulos e descrições próprios, dados estruturados de artigo, sitemap e robots.
- Acessibilidade e layout responsivo (mobile primeiro), modo de leitura confortável.
- Painel admin com editor de conteúdo, upload de mídia com pré-visualização e gestão de usuários.

## 5. Ordem de implementação sugerida

1. Design system + layout público (cabeçalho, rodapé, navegação) e home.
2. Lovable Cloud: banco, papéis, políticas de acesso e conteúdo de demonstração.
3. Notícias e blog (lista, detalhe, categorias).
4. Avisos, eventos e projetos dos alunos.
5. Podcast e galeria de fotos.
6. Busca unificada.
7. Painel administrativo completo.
8. SEO, desempenho e publicação.

## Decisões que precisam da sua confirmação

- Nome da escola, cores e logo (posso propor uma identidade caso não tenha).
- Se pais/alunos precisarão de login para alguma área restrita ou se todo o conteúdo público é aberto.
- Se comentários nas notícias devem existir.
