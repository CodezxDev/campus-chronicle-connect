import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  addGalleryPhoto,
  createAnnouncement,
  createGallery,
  createPost,
  createVideo,
  getAdminOverview,
  getPublishOptions,
  setPostStatus,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Portal Aurora" },
      {
        name: "description",
        content: "Painel da equipe para publicar conteúdos e avisos do Portal Aurora.",
      },
      { property: "og:title", content: "Painel administrativo — Portal Aurora" },
      { property: "og:description", content: "Gestão editorial do portal da Escola Aurora." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const updateStatus = useServerFn(setPostStatus);
  const addAnnouncement = useServerFn(createAnnouncement);
  const fetchOptions = useServerFn(getPublishOptions);
  const addPost = useServerFn(createPost);
  const addVideo = useServerFn(createVideo);
  const addGallery = useServerFn(createGallery);
  const addPhoto = useServerFn(addGalleryPhoto);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [audience, setAudience] = useState("Toda a comunidade");
  const [saving, setSaving] = useState(false);

  const options = useQuery({ queryKey: ["publish-options"], queryFn: () => fetchOptions() });
  const categories = options.data?.categories ?? [];
  const galleries = options.data?.galleries ?? [];

  const [tab, setTab] = useState<"noticia" | "foto" | "video">("noticia");
  const [busy, setBusy] = useState(false);

  const [news, setNews] = useState({
    title: "",
    excerpt: "",
    content: "",
    type: "noticia" as "noticia" | "blog",
    categoryId: "",
    coverUrl: "",
    authorName: "Redação Aurora",
  });
  const [video, setVideo] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    categoryId: "",
  });
  const [photo, setPhoto] = useState({ galleryId: "", imageUrl: "", caption: "" });
  const [newAlbum, setNewAlbum] = useState({ title: "", description: "", coverUrl: "" });

  async function refreshAll() {
    await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    await queryClient.invalidateQueries({ queryKey: ["publish-options"] });
    router.invalidate();
  }

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      await refreshAll();
      toast.success(success);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitNews(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => addPost({ data: news }), "Publicação criada.");
    if (ok) setNews({ ...news, title: "", excerpt: "", content: "", coverUrl: "" });
  }

  async function submitVideo(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => addVideo({ data: video }), "Vídeo publicado.");
    if (ok) setVideo({ ...video, title: "", description: "", videoUrl: "", thumbnailUrl: "" });
  }

  async function submitPhoto(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => addPhoto({ data: photo }), "Foto adicionada ao álbum.");
    if (ok) setPhoto({ ...photo, imageUrl: "", caption: "" });
  }

  async function submitAlbum(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => addGallery({ data: newAlbum }), "Álbum criado.");
    if (ok) setNewAlbum({ title: "", description: "", coverUrl: "" });
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function togglePost(id: string, status: string) {
    try {
      await updateStatus({
        data: { id, status: status === "publicado" ? "rascunho" : "publicado" },
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      router.invalidate();
      toast.success("Status atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar.");
    }
  }

  async function submitAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addAnnouncement({ data: { title, body, priority, audience } });
      setTitle("");
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      router.invalidate();
      toast.success("Aviso publicado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao publicar o aviso.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <div className="container-page py-20 text-muted-foreground">Carregando painel...</div>;
  }
  if (error || !data) {
    return (
      <div className="container-page py-20 text-muted-foreground">
        Não foi possível carregar o painel.
      </div>
    );
  }

  const stats = [
    { label: "Publicações", value: data.posts.length },
    { label: "Episódios", value: data.counts.episodes },
    { label: "Eventos", value: data.counts.events },
    { label: "Projetos", value: data.counts.projects },
    { label: "Álbuns", value: data.counts.galleries },
    { label: "Avisos", value: data.announcements.length },
  ];

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Área restrita</p>
          <h1 className="mt-2 text-4xl">Painel administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.name ? `Olá, ${data.name}. ` : ""}
            {data.roles.length ? `Perfil: ${data.roles.join(", ")}.` : "Perfil: leitor."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Ver o site</Link>
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <p className="text-3xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-2xl">Publicar conteúdo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha o canal e envie notícias, fotos ou vídeos para o portal.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["noticia", "Notícia / Blog"],
              ["foto", "Fotos"],
              ["video", "Vídeos"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={tab === key ? "default" : "outline"}
              onClick={() => setTab(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {tab === "noticia" && (
          <form onSubmit={submitNews} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="n-title">Título</Label>
              <Input
                id="n-title"
                value={news.title}
                onChange={(e) => setNews({ ...news, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-type">Formato</Label>
              <select
                id="n-type"
                value={news.type}
                onChange={(e) => setNews({ ...news, type: e.target.value as "noticia" | "blog" })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="noticia">Notícia</option>
                <option value="blog">Blog</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-cat">Canal</Label>
              <select
                id="n-cat"
                value={news.categoryId}
                onChange={(e) => setNews({ ...news, categoryId: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sem canal</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="n-excerpt">Resumo</Label>
              <Textarea
                id="n-excerpt"
                rows={2}
                value={news.excerpt}
                onChange={(e) => setNews({ ...news, excerpt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="n-content">Texto</Label>
              <Textarea
                id="n-content"
                rows={6}
                value={news.content}
                onChange={(e) => setNews({ ...news, content: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-cover">Endereço da imagem de capa</Label>
              <Input
                id="n-cover"
                placeholder="https://... ou /images/foto.jpg"
                value={news.coverUrl}
                onChange={(e) => setNews({ ...news, coverUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n-author">Autoria</Label>
              <Input
                id="n-author"
                value={news.authorName}
                onChange={(e) => setNews({ ...news, authorName: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={busy} className="md:col-span-2">
              {busy ? "Publicando..." : "Publicar"}
            </Button>
          </form>
        )}

        {tab === "foto" && (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <form onSubmit={submitPhoto} className="space-y-4">
              <h3 className="text-lg">Adicionar foto a um álbum</h3>
              <div className="space-y-1.5">
                <Label htmlFor="f-album">Álbum</Label>
                <select
                  id="f-album"
                  value={photo.galleryId}
                  onChange={(e) => setPhoto({ ...photo, galleryId: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Escolha um álbum</option>
                  {galleries.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-url">Endereço da foto</Label>
                <Input
                  id="f-url"
                  placeholder="https://... ou /images/foto.jpg"
                  value={photo.imageUrl}
                  onChange={(e) => setPhoto({ ...photo, imageUrl: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-caption">Legenda</Label>
                <Input
                  id="f-caption"
                  value={photo.caption}
                  onChange={(e) => setPhoto({ ...photo, caption: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Enviando..." : "Adicionar foto"}
              </Button>
            </form>

            <form onSubmit={submitAlbum} className="space-y-4">
              <h3 className="text-lg">Criar novo álbum</h3>
              <div className="space-y-1.5">
                <Label htmlFor="al-title">Nome do álbum</Label>
                <Input
                  id="al-title"
                  value={newAlbum.title}
                  onChange={(e) => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="al-desc">Descrição</Label>
                <Textarea
                  id="al-desc"
                  rows={3}
                  value={newAlbum.description}
                  onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="al-cover">Endereço da capa</Label>
                <Input
                  id="al-cover"
                  value={newAlbum.coverUrl}
                  onChange={(e) => setNewAlbum({ ...newAlbum, coverUrl: e.target.value })}
                />
              </div>
              <Button type="submit" variant="outline" disabled={busy} className="w-full">
                {busy ? "Criando..." : "Criar álbum"}
              </Button>
            </form>
          </div>
        )}

        {tab === "video" && (
          <form onSubmit={submitVideo} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="v-title">Título</Label>
              <Input
                id="v-title"
                value={video.title}
                onChange={(e) => setVideo({ ...video, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-url">Endereço do vídeo (YouTube, Vimeo ou arquivo)</Label>
              <Input
                id="v-url"
                placeholder="https://youtu.be/..."
                value={video.videoUrl}
                onChange={(e) => setVideo({ ...video, videoUrl: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-cat">Canal</Label>
              <select
                id="v-cat"
                value={video.categoryId}
                onChange={(e) => setVideo({ ...video, categoryId: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sem canal</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="v-desc">Descrição</Label>
              <Textarea
                id="v-desc"
                rows={3}
                value={video.description}
                onChange={(e) => setVideo({ ...video, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="v-thumb">Endereço da miniatura</Label>
              <Input
                id="v-thumb"
                value={video.thumbnailUrl}
                onChange={(e) => setVideo({ ...video, thumbnailUrl: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={busy} className="md:col-span-2">
              {busy ? "Publicando..." : "Publicar vídeo"}
            </Button>
          </form>
        )}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-4 border-b border-border pb-3 text-2xl">Notícias e blog</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {data.posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.type === "blog" ? "Blog" : "Notícia"} · {p.status} ·{" "}
                    {formatDate(p.published_at)}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => togglePost(p.id, p.status)}>
                  {p.status === "publicado" ? "Despublicar" : "Publicar"}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 border-b border-border pb-3 text-2xl">Novo aviso</h2>
          <form
            onSubmit={submitAnnouncement}
            className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="space-y-1.5">
              <Label htmlFor="a-title">Título</Label>
              <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-body">Mensagem</Label>
              <Textarea id="a-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-priority">Prioridade</Label>
                <select
                  id="a-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Importante</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-audience">Público</Label>
                <Input
                  id="a-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Publicando..." : "Publicar aviso"}
            </Button>
          </form>

          <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
            {data.announcements.map((a) => (
              <li key={a.id} className="p-4">
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.priority} · {a.status} · {formatDate(a.starts_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
