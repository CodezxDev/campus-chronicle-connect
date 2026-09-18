import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CONTENT_TABLES = [
  "posts",
  "podcast_episodes",
  "events",
  "student_projects",
  "galleries",
  "gallery_photos",
  "videos",
  "announcements",
] as const;

export type ContentTable = (typeof CONTENT_TABLES)[number];

const SLUG_TABLES: ContentTable[] = [
  "posts",
  "podcast_episodes",
  "events",
  "student_projects",
  "galleries",
  "videos",
];

function assertTable(table: string): ContentTable {
  if (!(CONTENT_TABLES as readonly string[]).includes(table)) {
    throw new Error("Conteúdo inválido.");
  }
  return table as ContentTable;
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "item"
  );
}

function friendly(message: string) {
  if (message.toLowerCase().includes("row-level security")) {
    return new Error(
      "Sua conta não tem permissão para esta ação. Peça a um administrador para liberar seu acesso.",
    );
  }
  return new Error(message);
}

/** Lista todo o conteúdo do portal para a equipe (inclusive rascunhos). */
export const listContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [posts, episodes, events, projects, galleries, photos, videos, announcements] =
      await Promise.all([
        sb.from("posts").select("*").order("published_at", { ascending: false }),
        sb.from("podcast_episodes").select("*").order("published_at", { ascending: false }),
        sb.from("events").select("*").order("starts_at", { ascending: false }),
        sb.from("student_projects").select("*").order("created_at", { ascending: false }),
        sb.from("galleries").select("*").order("created_at", { ascending: false }),
        sb.from("gallery_photos").select("*").order("created_at", { ascending: false }),
        sb.from("videos").select("*").order("published_at", { ascending: false }),
        sb.from("announcements").select("*").order("starts_at", { ascending: false }),
      ]);
    return {
      posts: posts.data ?? [],
      podcast_episodes: episodes.data ?? [],
      events: events.data ?? [],
      student_projects: projects.data ?? [],
      galleries: galleries.data ?? [],
      gallery_photos: photos.data ?? [],
      videos: videos.data ?? [],
      announcements: announcements.data ?? [],
    };
  });

/** Cria ou atualiza um conteúdo do portal. */
export const saveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { table: string; id?: string | null; values: Record<string, unknown> }) => data,
  )
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    const values: Record<string, unknown> = { ...data.values };

    for (const key of Object.keys(values)) {
      if (typeof values[key] === "string") {
        const trimmed = (values[key] as string).trim();
        values[key] = trimmed === "" ? null : trimmed;
      }
    }

    if (!data.id && SLUG_TABLES.includes(table)) {
      const title = String(values["title"] ?? "");
      if (!title) throw new Error("Informe um título.");
      values["slug"] = `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
    }
    if (table === "posts" && !data.id) {
      values["author_id"] = context.userId;
    }

    const query = data.id
      ? context.supabase
          .from(table)
          .update(values as never)
          .eq("id", data.id)
          .select("id")
          .maybeSingle()
      : context.supabase
          .from(table)
          .insert(values as never)
          .select("id")
          .single();

    const { data: row, error } = await query;
    if (error) throw friendly(error.message);
    return { id: (row as { id: string } | null)?.id ?? data.id ?? null };
  });

/** Exclui um conteúdo do portal. */
export const deleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { table: string; id: string }) => data)
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    const { error } = await context.supabase.from(table).delete().eq("id", data.id);
    if (error) throw friendly(error.message);
    return { ok: true };
  });

/** Publica ou volta um conteúdo para rascunho. */
export const setContentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { table: string; id: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    const table = assertTable(data.table);
    if (table === "gallery_photos") throw new Error("Este conteúdo não tem status.");
    const { error } = await context.supabase
      .from(table)
      .update({ status: data.status } as never)
      .eq("id", data.id);
    if (error) throw friendly(error.message);
    return { ok: true };
  });
