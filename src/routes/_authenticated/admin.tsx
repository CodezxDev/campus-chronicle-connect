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
