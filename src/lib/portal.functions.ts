import { createServerFn } from "@tanstack/react-start";
import { publicClient } from "./portal.server";

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((data: { type: "noticia" | "blog"; category?: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb
      .from("posts")
      .select("id,title,slug,excerpt,cover_url,author_name,published_at,featured,views,type,categories(name,slug)")
      .eq("type", data.type)
      .eq("status", "publicado")
      .order("published_at", { ascending: false });
    if (data.category) query = query.eq("categories.slug", data.category);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: post } = await sb
      .from("posts")
      .select("*,categories(name,slug)")
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();
    if (!post) return null;
    const { data: related } = await sb
      .from("posts")
      .select("id,title,slug,excerpt,cover_url,published_at,type")
      .eq("type", post.type)
      .eq("status", "publicado")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);
    return { post, related: related ?? [] };
  });

export const listEpisodes = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("podcast_episodes")
    .select("*")
    .eq("status", "publicado")
    .order("published_at", { ascending: false });
  return data ?? [];
});

export const getEpisode = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb
      .from("podcast_episodes")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();
    return row;
  });

export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("events")
    .select("*")
    .eq("status", "publicado")
    .order("starts_at", { ascending: true });
  return data ?? [];
});

export const getEvent = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb
      .from("events")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();
    return row;
  });

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("student_projects")
    .select("*")
    .eq("status", "publicado")
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb
      .from("student_projects")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();
    return row;
  });

export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const nowIso = new Date().toISOString();
  const { data } = await sb
    .from("announcements")
    .select("*")
    .eq("status", "publicado")
    .lte("starts_at", nowIso)
    .order("pinned", { ascending: false })
    .order("starts_at", { ascending: false });
  return (data ?? []).filter((a) => !a.ends_at || a.ends_at >= nowIso);
});

export const listGalleries = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("galleries")
    .select("*")
    .eq("status", "publicado")
    .order("happened_at", { ascending: false });
  return data ?? [];
});

export const getGallery = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: gallery } = await sb
      .from("galleries")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();
    if (!gallery) return null;
    const { data: photos } = await sb
      .from("gallery_photos")
      .select("*")
      .eq("gallery_id", gallery.id)
      .order("position", { ascending: true });
    return { gallery, photos: photos ?? [] };
  });

export const searchPortal = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => data)
  .handler(async ({ data }) => {
    const term = data.q.trim();
    if (!term) return [];
    const like = `%${term}%`;
    const sb = publicClient();
    const [posts, episodes, events, projects, announcements] = await Promise.all([
      sb
        .from("posts")
        .select("title,slug,excerpt,type,published_at")
        .eq("status", "publicado")
        .or(`title.ilike.${like},excerpt.ilike.${like},content.ilike.${like}`)
        .limit(20),
      sb
        .from("podcast_episodes")
        .select("title,slug,description,published_at")
        .eq("status", "publicado")
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(20),
      sb
        .from("events")
        .select("title,slug,description,starts_at")
        .eq("status", "publicado")
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(20),
      sb
        .from("student_projects")
        .select("title,slug,summary,created_at")
        .eq("status", "publicado")
        .or(`title.ilike.${like},summary.ilike.${like},description.ilike.${like}`)
        .limit(20),
      sb
        .from("announcements")
        .select("title,body,created_at")
        .eq("status", "publicado")
        .or(`title.ilike.${like},body.ilike.${like}`)
        .limit(20),
    ]);
    const results = [
      ...(posts.data ?? []).map((r) => ({
        kind: r.type === "blog" ? "Blog" : "Notícia",
        title: r.title,
        description: r.excerpt,
        href: r.type === "blog" ? `/blog/${r.slug}` : `/noticias/${r.slug}`,
        date: r.published_at,
      })),
      ...(episodes.data ?? []).map((r) => ({
        kind: "Podcast",
        title: r.title,
        description: r.description,
        href: `/podcast/${r.slug}`,
        date: r.published_at,
      })),
      ...(events.data ?? []).map((r) => ({
        kind: "Evento",
        title: r.title,
        description: r.description,
        href: `/eventos/${r.slug}`,
        date: r.starts_at,
      })),
      ...(projects.data ?? []).map((r) => ({
        kind: "Projeto",
        title: r.title,
        description: r.summary,
        href: `/projetos/${r.slug}`,
        date: r.created_at,
      })),
      ...(announcements.data ?? []).map((r) => ({
        kind: "Aviso",
        title: r.title,
        description: r.body,
        href: `/avisos`,
        date: r.created_at,
      })),
    ];
    return results.sort((a, b) => (a.date < b.date ? 1 : -1));
  });

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const nowIso = new Date().toISOString();
  const [posts, events, episodes, announcements, galleries, projects] = await Promise.all([
    sb
      .from("posts")
      .select("id,title,slug,excerpt,cover_url,author_name,published_at,featured,type,categories(name,slug)")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(8),
    sb
      .from("events")
      .select("id,title,slug,starts_at,location,image_url")
      .eq("status", "publicado")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(3),
    sb
      .from("podcast_episodes")
      .select("id,title,slug,description,episode_number,cover_url,published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(1),
    sb
      .from("announcements")
      .select("id,title,body,priority,pinned,ends_at")
      .eq("status", "publicado")
      .lte("starts_at", nowIso)
      .order("pinned", { ascending: false })
      .limit(4),
    sb
      .from("galleries")
      .select("id,title,slug,cover_url,happened_at")
      .eq("status", "publicado")
      .order("happened_at", { ascending: false })
      .limit(3),
    sb
      .from("student_projects")
      .select("id,title,slug,summary,cover_url,school_class")
      .eq("status", "publicado")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  return {
    posts: posts.data ?? [],
    events: events.data ?? [],
    episode: episodes.data?.[0] ?? null,
    announcements: (announcements.data ?? []).filter((a) => !a.ends_at || a.ends_at >= nowIso),
    galleries: galleries.data ?? [],
    projects: projects.data ?? [],
  };
});
