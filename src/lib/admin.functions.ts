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

function uniqueSlug(title: string) {
  return `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
}

function permissionError(message: string) {
  if (message.includes("row-level security")) {
    return new Error(
      "Sua conta não tem permissão de editor para publicar. Peça a um administrador para liberar seu acesso.",
    );
  }
  return new Error(message);
}

/** Canais (categorias) e álbuns disponíveis para publicar conteúdo. */
export const getPublishOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [categories, galleries, videos] = await Promise.all([
      context.supabase.from("categories").select("id,name,slug").order("name"),
      context.supabase.from("galleries").select("id,title,slug").order("title"),
      context.supabase
        .from("videos")
        .select("id,title,slug,published_at,status")
        .order("published_at", { ascending: false }),
    ]);
    return {
      categories: categories.data ?? [],
      galleries: galleries.data ?? [],
      videos: videos.data ?? [],
    };
  });

/** Publica uma notícia ou post de blog em um canal. */
export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      title: string;
      excerpt: string;
      content: string;
      type: "noticia" | "blog";
      categoryId: string;
      coverUrl: string;
      authorName: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    if (!data.title.trim()) throw new Error("Informe um título.");
    const { error } = await context.supabase.from("posts").insert({
      title: data.title.trim(),
      slug: uniqueSlug(data.title),
      excerpt: data.excerpt.trim(),
      content: data.content.trim(),
      type: data.type,
      category_id: data.categoryId || null,
      cover_url: data.coverUrl.trim() || null,
      author_name: data.authorName.trim() || "Redação Aurora",
      author_id: context.userId,
      status: "publicado",
      published_at: new Date().toISOString(),
    });
    if (error) throw permissionError(error.message);
    return { ok: true };
  });

/** Cria um álbum de fotos. */
export const createGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { title: string; description: string; coverUrl: string }) => data)
  .handler(async ({ data, context }) => {
    if (!data.title.trim()) throw new Error("Informe um nome para o álbum.");
    const { data: row, error } = await context.supabase
      .from("galleries")
      .insert({
        title: data.title.trim(),
        slug: uniqueSlug(data.title),
        description: data.description.trim(),
        cover_url: data.coverUrl.trim() || null,
        happened_at: new Date().toISOString(),
        status: "publicado",
      })
      .select("id")
      .single();
    if (error) throw permissionError(error.message);
    return { ok: true, id: row.id };
  });

/** Adiciona uma foto a um álbum. */
export const addGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { galleryId: string; imageUrl: string; caption: string }) => data)
  .handler(async ({ data, context }) => {
    if (!data.galleryId) throw new Error("Escolha um álbum.");
    if (!data.imageUrl.trim()) throw new Error("Informe o endereço da foto.");
    const { error } = await context.supabase.from("gallery_photos").insert({
      gallery_id: data.galleryId,
      image_url: data.imageUrl.trim(),
      caption: data.caption.trim() || null,
    });
    if (error) throw permissionError(error.message);
    return { ok: true };
  });

/** Publica um vídeo em um canal. */
export const createVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      title: string;
      description: string;
      videoUrl: string;
      thumbnailUrl: string;
      categoryId: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    if (!data.title.trim()) throw new Error("Informe um título para o vídeo.");
    if (!data.videoUrl.trim()) throw new Error("Informe o endereço do vídeo.");
    const { error } = await context.supabase.from("videos").insert({
      title: data.title.trim(),
      slug: uniqueSlug(data.title),
      description: data.description.trim(),
      video_url: data.videoUrl.trim(),
      thumbnail_url: data.thumbnailUrl.trim() || null,
      category_id: data.categoryId || null,
      status: "publicado",
      published_at: new Date().toISOString(),
    });
    if (error) throw permissionError(error.message);
    return { ok: true };
  });
