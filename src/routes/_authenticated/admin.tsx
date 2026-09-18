import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOverview, getPublishOptions } from "@/lib/admin.functions";
import {
  deleteContent,
  listContent,
  saveContent,
  setContentStatus,
  type ContentTable,
} from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/image-uploader";
import { formatDate } from "@/lib/format";
import { SITE, pageTitle } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: pageTitle("Painel administrativo") },
      {
        name: "description",
        content: `Painel da equipe para publicar conteúdos do ${SITE.name}.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type FieldKind = "text" | "textarea" | "image" | "number" | "datetime" | "date" | "select";

type Field = {
  name: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  optionsFrom?: "categories" | "galleries";
  required?: boolean;
  full?: boolean;
  rows?: number;
  placeholder?: string;
};

type ResourceKey =
  | "posts"
  | "podcast_episodes"
  | "events"
  | "student_projects"
  | "galleries"
  | "gallery_photos"
  | "videos"
  | "announcements";

type Resource = {
  key: ResourceKey;
  table: ContentTable;
  label: string;
  singular: string;
  fields: Field[];
  hasStatus: boolean;
  subtitle: (row: Record<string, unknown>) => string;
};

const RESOURCES: Resource[] = [
  {
    key: "posts",
    table: "posts",
    label: "Notícias e blog",
    singular: "publicação",
    hasStatus: true,
    subtitle: (r) =>
      `${r["type"] === "blog" ? "Blog" : "Notícia"} · ${r["status"]} · ${formatDate(String(r["published_at"] ?? ""))}`,
    fields: [
      { name: "title", label: "Título", kind: "text", required: true, full: true },
      {
        name: "type",
        label: "Formato",
        kind: "select",
        options: [
          { value: "noticia", label: "Notícia" },
          { value: "blog", label: "Blog" },
        ],
      },
      { name: "category_id", label: "Canal", kind: "select", optionsFrom: "categories" },
      { name: "excerpt", label: "Resumo", kind: "textarea", rows: 2, full: true },
      { name: "content", label: "Texto completo", kind: "textarea", rows: 8, full: true },
      { name: "author_name", label: "Autoria", kind: "text" },
      { name: "cover_url", label: "Imagem de capa", kind: "image" },
    ],
  },
  {
    key: "podcast_episodes",
    table: "podcast_episodes",
    label: "Podcast",
    singular: "episódio",
    hasStatus: true,
    subtitle: (r) => `#${r["episode_number"] ?? "-"} · ${r["status"]}`,
    fields: [
      { name: "title", label: "Título", kind: "text", required: true, full: true },
      { name: "episode_number", label: "Número do episódio", kind: "number" },
      { name: "duration_seconds", label: "Duração (segundos)", kind: "number" },
      { name: "guests", label: "Participantes", kind: "text", full: true },
      { name: "description", label: "Descrição", kind: "textarea", rows: 5, full: true },
      {
        name: "audio_url",
        label: "Endereço do áudio (MP3)",
        kind: "text",
        full: true,
        placeholder: "https://...",
      },
      { name: "cover_url", label: "Imagem de capa", kind: "image" },
    ],
  },
  {
    key: "events",
    table: "events",
    label: "Eventos",
    singular: "evento",
    hasStatus: true,
    subtitle: (r) => `${formatDate(String(r["starts_at"] ?? ""))} · ${r["status"]}`,
    fields: [
      { name: "title", label: "Título", kind: "text", required: true, full: true },
      { name: "starts_at", label: "Início", kind: "datetime", required: true },
      { name: "ends_at", label: "Término", kind: "datetime" },
      { name: "location", label: "Local", kind: "text" },
      { name: "audience", label: "Público", kind: "text" },
      { name: "description", label: "Descrição", kind: "textarea", rows: 5, full: true },
      { name: "registration_url", label: "Link de inscrição", kind: "text", full: true },
      { name: "image_url", label: "Imagem de capa", kind: "image" },
    ],
  },
  {
    key: "student_projects",
    table: "student_projects",
    label: "Projetos",
    singular: "projeto",
    hasStatus: true,
    subtitle: (r) => `${r["school_class"] ?? ""} · ${r["status"]}`,
    fields: [
      { name: "title", label: "Título", kind: "text", required: true, full: true },
      { name: "school_class", label: "Turma", kind: "text" },
      { name: "subject", label: "Disciplina", kind: "text" },
      { name: "year", label: "Ano", kind: "number" },
      { name: "advisor", label: "Orientação", kind: "text" },
      { name: "students", label: "Estudantes", kind: "text", full: true },
      { name: "summary", label: "Resumo", kind: "textarea", rows: 2, full: true },
      { name: "description", label: "Descrição", kind: "textarea", rows: 6, full: true },
      { name: "cover_url", label: "Imagem de capa", kind: "image" },
    ],
  },
  {
    key: "galleries",
    table: "galleries",
    label: "Álbuns",
    singular: "álbum",
    hasStatus: true,
    subtitle: (r) => `${formatDate(String(r["happened_at"] ?? ""))} · ${r["status"]}`,
    fields: [
      { name: "title", label: "Nome do álbum", kind: "text", required: true, full: true },
      { name: "happened_at", label: "Data", kind: "date" },
      { name: "description", label: "Descrição", kind: "textarea", rows: 3, full: true },
      { name: "cover_url", label: "Capa do álbum", kind: "image" },
    ],
  },
  {
    key: "gallery_photos",
    table: "gallery_photos",
    label: "Fotos",
    singular: "foto",
    hasStatus: false,
    subtitle: (r) => String(r["caption"] ?? "Sem legenda"),
    fields: [
      {
        name: "gallery_id",
        label: "Álbum",
        kind: "select",
        optionsFrom: "galleries",
        required: true,
      },
      { name: "position", label: "Ordem", kind: "number" },
      { name: "caption", label: "Legenda", kind: "text", full: true },
      { name: "image_url", label: "Foto", kind: "image", full: true },
    ],
  },
  {
    key: "videos",
    table: "videos",
    label: "Vídeos",
    singular: "vídeo",
    hasStatus: true,
    subtitle: (r) => `${r["status"]} · ${formatDate(String(r["published_at"] ?? ""))}`,
    fields: [
      { name: "title", label: "Título", kind: "text", required: true, full: true },
      {
        name: "video_url",
        label: "Endereço do vídeo (YouTube, Vimeo ou arquivo)",
        kind: "text",
        required: true,
      },
      { name: "category_id", label: "Canal", kind: "select", optionsFrom: "categories" },
      { name: "description", label: "Descrição", kind: "textarea", rows: 4, full: true },
      { name: "thumbnail_url", label: "Miniatura", kind: "image" },
    ],
  },
  {
    key: "announcements",
    table: "announcements",
    label: "Avisos",
    singular: "aviso",
    hasStatus: true,
    subtitle: (r) => `${r["priority"]} · ${r["status"]}`,
    fields: [
      { name: "title", label: "Título", kind: "text", required: true, full: true },
      { name: "body", label: "Mensagem", kind: "textarea", rows: 4, full: true },
      {
        name: "priority",
        label: "Prioridade",
        kind: "select",
        options: [
          { value: "normal", label: "Normal" },
          { value: "alta", label: "Importante" },
          { value: "urgente", label: "Urgente" },
        ],
      },
      { name: "audience", label: "Público", kind: "text" },
    ],
  },
];

function toInputDateTime(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toInputDate(value: unknown) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function emptyForm(resource: Resource) {
  const form: Record<string, string> = {};
  for (const f of resource.fields) {
    form[f.name] =
      f.kind === "select" && f.options?.length ? (f.options[0]?.value ?? "") : "";
  }
  if (resource.key === "posts") form["author_name"] = "Redação MOSC";
  return form;
}

function AdminPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const fetchOptions = useServerFn(getPublishOptions);
  const fetchContent = useServerFn(listContent);
  const save = useServerFn(saveContent);
  const remove = useServerFn(deleteContent);
  const toggleStatus = useServerFn(setContentStatus);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview() });
  const options = useQuery({ queryKey: ["publish-options"], queryFn: () => fetchOptions() });
  const content = useQuery({ queryKey: ["admin-content"], queryFn: () => fetchContent() });

  const [tab, setTab] = useState<ResourceKey>("posts");
  const resource = RESOURCES.find((r) => r.key === tab)!;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(() => emptyForm(RESOURCES[0]!));
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () => (content.data?.[resource.key] ?? []) as Record<string, unknown>[],
    [content.data, resource.key],
  );

  function selectTab(key: ResourceKey) {
    const next = RESOURCES.find((r) => r.key === key)!;
    setTab(key);
    setEditingId(null);
    setForm(emptyForm(next));
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm(resource));
  }

  function startEdit(row: Record<string, unknown>) {
    const next: Record<string, string> = {};
    for (const f of resource.fields) {
      const raw = row[f.name];
      next[f.name] =
        f.kind === "datetime"
          ? toInputDateTime(raw)
          : f.kind === "date"
            ? toInputDate(raw)
            : raw === null || raw === undefined
              ? ""
              : String(raw);
    }
    setForm(next);
    setEditingId(String(row["id"]));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-content"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["publish-options"] }),
    ]);
    router.invalidate();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const values: Record<string, unknown> = {};
      for (const f of resource.fields) {
        const raw = form[f.name] ?? "";
        if (f.kind === "number") {
          values[f.name] = raw === "" ? null : Number(raw);
        } else if (f.kind === "datetime" || f.kind === "date") {
          values[f.name] = raw === "" ? null : new Date(raw).toISOString();
        } else {
          values[f.name] = raw;
        }
      }
      if (resource.key === "galleries" && values["happened_at"]) {
        values["happened_at"] = String(values["happened_at"]).slice(0, 10);
      }
      if (!editingId && resource.hasStatus) values["status"] = "publicado";
      if (!editingId && resource.key === "events" && !values["starts_at"]) {
        throw new Error("Informe a data de início do evento.");
      }
      await save({ data: { table: resource.table, id: editingId, values } });
      toast.success(editingId ? "Alterações salvas." : `Novo ${resource.singular} publicado.`);
      setEditingId(null);
      setForm(emptyForm(resource));
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Excluir este ${resource.singular} definitivamente?`)) return;
    try {
      await remove({ data: { table: resource.table, id } });
      if (editingId === id) startNew();
      toast.success("Conteúdo excluído.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir.");
    }
  }

  async function handleToggle(id: string, status: string) {
    try {
      await toggleStatus({
        data: {
          table: resource.table,
          id,
          status: status === "publicado" ? "rascunho" : "publicado",
        },
      });
      toast.success("Status atualizado.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar.");
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function optionsFor(field: Field) {
    if (field.options) return field.options;
    if (field.optionsFrom === "categories") {
      return (options.data?.categories ?? []).map((c) => ({ value: c.id, label: c.name }));
    }
    if (field.optionsFrom === "galleries") {
      return (options.data?.galleries ?? []).map((g) => ({ value: g.id, label: g.title }));
    }
    return [];
  }

  const data = overview.data;
  const stats = [
    { label: "Publicações", value: content.data?.posts.length ?? 0 },
    { label: "Episódios", value: content.data?.podcast_episodes.length ?? 0 },
    { label: "Eventos", value: content.data?.events.length ?? 0 },
    { label: "Projetos", value: content.data?.student_projects.length ?? 0 },
    { label: "Álbuns", value: content.data?.galleries.length ?? 0 },
    { label: "Vídeos", value: content.data?.videos.length ?? 0 },
  ];

  if (content.isLoading) {
    return <div className="container-page py-20 text-muted-foreground">Carregando painel...</div>;
  }
  if (content.error) {
    return (
      <div className="container-page py-20 text-muted-foreground">
        Não foi possível carregar o painel.
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Área restrita</p>
          <h1 className="mt-2 text-3xl md:text-4xl">Painel administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data?.name ? `Olá, ${data.name}. ` : ""}
            {data?.roles.length ? `Perfil: ${data.roles.join(", ")}.` : "Perfil: leitor."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/">Ver o site</Link>
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <p className="text-2xl font-semibold md:text-3xl">{s.value}</p>
            <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {RESOURCES.map((r) => (
          <Button
            key={r.key}
            type="button"
            size="sm"
            variant={tab === r.key ? "default" : "outline"}
            onClick={() => selectTab(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl md:text-2xl">
              {editingId ? `Editar ${resource.singular}` : `Novo ${resource.singular}`}
            </h2>
            {editingId && (
              <Button type="button" size="sm" variant="ghost" onClick={startNew}>
                Cancelar edição
              </Button>
            )}
          </div>

          <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
            {resource.fields.map((field) => {
              const id = `${resource.key}-${field.name}`;
              const value = form[field.name] ?? "";
              const cls = field.full ? "sm:col-span-2" : "";
              if (field.kind === "image") {
                return (
                  <div key={field.name} className={cls}>
                    <ImageUploader
                      id={id}
                      label={field.label}
                      value={value}
                      onChange={(url) => setForm({ ...form, [field.name]: url })}
                    />
                  </div>
                );
              }
              return (
                <div key={field.name} className={`space-y-1.5 ${cls}`}>
                  <Label htmlFor={id}>{field.label}</Label>
                  {field.kind === "textarea" ? (
                    <Textarea
                      id={id}
                      rows={field.rows ?? 3}
                      value={value}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    />
                  ) : field.kind === "select" ? (
                    <select
                      id={id}
                      value={value}
                      required={field.required}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {!field.options && <option value="">Sem canal</option>}
                      {optionsFor(field).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={id}
                      type={
                        field.kind === "number"
                          ? "number"
                          : field.kind === "datetime"
                            ? "datetime-local"
                            : field.kind === "date"
                              ? "date"
                              : "text"
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                      value={value}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    />
                  )}
                </div>
              );
            })}
            <Button type="submit" disabled={busy} className="sm:col-span-2">
              {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Publicar"}
            </Button>
          </form>
        </section>

        <section>
          <h2 className="mb-4 border-b border-border pb-3 text-xl md:text-2xl">
            {resource.label} ({rows.length})
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {rows.map((row) => {
              const id = String(row["id"]);
              const status = String(row["status"] ?? "");
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {String(row["title"] ?? row["caption"] ?? "Sem título")}
                    </p>
                    <p className="text-xs text-muted-foreground">{resource.subtitle(row)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                      Editar
                    </Button>
                    {resource.hasStatus && (
                      <Button size="sm" variant="outline" onClick={() => handleToggle(id, status)}>
                        {status === "publicado" ? "Despublicar" : "Publicar"}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(id)}>
                      Excluir
                    </Button>
                  </div>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="p-6 text-sm text-muted-foreground">Nenhum conteúdo cadastrado.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
