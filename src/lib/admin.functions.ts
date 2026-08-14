import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [posts, episodes, events, projects, announcements, galleries, roles, profile] =
      await Promise.all([
        sb.from("posts").select("id,title,slug,type,status,published_at").order("published_at", {
          ascending: false,
        }),
        sb.from("podcast_episodes").select("id", { count: "exact", head: true }),
        sb.from("events").select("id", { count: "exact", head: true }),
        sb.from("student_projects").select("id", { count: "exact", head: true }),
        sb
          .from("announcements")
          .select("id,title,priority,status,starts_at")
          .order("starts_at", { ascending: false }),
        sb.from("galleries").select("id", { count: "exact", head: true }),
        sb.from("user_roles").select("role").eq("user_id", context.userId),
        sb.from("profiles").select("full_name").eq("id", context.userId).maybeSingle(),
      ]);

    return {
      roles: (roles.data ?? []).map((r) => r.role as string),
      name: profile.data?.full_name ?? null,
      posts: posts.data ?? [],
      announcements: announcements.data ?? [],
      counts: {
        episodes: episodes.count ?? 0,
        events: events.count ?? 0,
        projects: projects.count ?? 0,
        galleries: galleries.count ?? 0,
      },
    };
  });

export const setPostStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "publicado" | "rascunho" }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("posts")
      .update({
        status: data.status,
        ...(data.status === "publicado" ? { published_at: new Date().toISOString() } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { title: string; body: string; priority: string; audience: string }) => data,
  )
  .handler(async ({ data, context }) => {
    if (!data.title.trim()) throw new Error("Informe um título para o aviso.");
    const { error } = await context.supabase.from("announcements").insert({
      title: data.title.trim(),
      body: data.body.trim(),
      priority: data.priority,
      audience: data.audience,
      status: "publicado",
    });
    if (error) {
      if (error.message.includes("row-level security")) {
        throw new Error(
          "Sua conta não tem permissão de editor para publicar avisos. Peça a um administrador para liberar seu acesso.",
        );
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });
