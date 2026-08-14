import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { formatDate } from "@/lib/format";

export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="container-page py-12">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="max-w-3xl text-4xl md:text-5xl">{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="container-page py-12">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-3">
        <h2 className="text-2xl md:text-3xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

export function CoverImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return <div className={`bg-muted ${className}`} aria-hidden="true" />;
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      className={`object-cover ${className}`}
    />
  );
}

export function ArticleCard({
  href,
  title,
  excerpt,
  cover,
  meta,
  tag,
}: {
  href: string;
  title: string;
  excerpt?: string | null;
  cover?: string | null;
  meta?: string | null;
  tag?: string | null;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift">
      <Link to={href as "/"} className="block">
        <div className="aspect-[16/10] overflow-hidden">
          <CoverImage
            src={cover}
            alt={title}
            className="size-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-5">
          {tag && <p className="kicker mb-2">{tag}</p>}
          <h3 className="text-lg leading-snug group-hover:text-accent">{title}</h3>
          {excerpt && (
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
          )}
          {meta && <p className="mt-4 text-xs text-muted-foreground">{meta}</p>}
        </div>
      </Link>
    </article>
  );
}

export function ArticleMeta({ author, date }: { author?: string | null; date?: string | null }) {
  return (
    <p className="text-sm text-muted-foreground">
      {author ? `${author} · ` : ""}
      {formatDate(date)}
    </p>
  );
}
