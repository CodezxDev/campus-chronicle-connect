import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { getGallery } from "@/lib/portal.functions";
import { PageHeader } from "@/components/portal-ui";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/galeria/$slug")({
  loader: async ({ params }) => {
    const result = await getGallery({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Álbum indisponível — Portal Aurora" }, { name: "robots", content: "noindex" }] };
    }
    const { gallery } = loaderData;
    return {
      meta: [
        { title: `${gallery.title} — Galeria do Portal Aurora` },
        { name: "description", content: gallery.description ?? "Álbum de fotos da Escola Aurora." },
        { property: "og:title", content: gallery.title },
        {
          property: "og:description",
          content: gallery.description ?? "Álbum de fotos da Escola Aurora.",
        },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: GaleriaDetalhe,
  errorComponent: () => (
    <div className="container-page py-20 text-center text-muted-foreground">
      Não foi possível carregar este álbum.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl">Álbum não encontrado</h1>
      <Link to="/galeria" className="mt-4 inline-block text-accent hover:underline">
        Ver a galeria
      </Link>
    </div>
  ),
});

function GaleriaDetalhe() {
  const { gallery, photos } = Route.useLoaderData();
  const [active, setActive] = useState<number | null>(null);
  const current = active !== null ? photos[active] : null;

  return (
    <>
      <PageHeader
        kicker={formatDate(gallery.happened_at)}
        title={gallery.title}
        description={gallery.description}
      />
      <div className="container-page py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActive(index)}
              className="group overflow-hidden rounded-xl border border-border bg-muted text-left"
            >
              <img
                src={photo.image_url}
                alt={photo.caption ?? gallery.title}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {photo.caption && (
                <span className="block p-3 text-xs text-muted-foreground">{photo.caption}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Fechar"
            className="absolute right-5 top-5 rounded-full bg-background/90 p-2"
            onClick={() => setActive(null)}
          >
            <X className="size-5" />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-w-4xl">
            <img
              src={current.image_url}
              alt={current.caption ?? gallery.title}
              className="max-h-[75vh] w-full rounded-xl object-contain"
            />
            {current.caption && (
              <figcaption className="mt-3 text-center text-sm text-background/80">
                {current.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
