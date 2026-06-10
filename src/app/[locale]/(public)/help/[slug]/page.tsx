// app/[locale]/(public)/help/[slug]/page.tsx — Détail article centre d'aide.
// Markdown-light rendering (whitespace + bold/italic), TOC, breadcrumb, related, feedback.

import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { HelpFeedback } from "@/components/help/HelpFeedback";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

interface Props { params: Promise<{ locale: string; slug: string }> }

interface Article { category: string; title: string; summary: string; body: string }
interface HelpMessages {
  help: {
    title: string;
    articles?: Record<string, Article>;
    categories?: Record<string, string>;
    translationNotice?: string;
    wasItHelpful?: string;
    yes?: string;
    no?: string;
    thanks?: string;
    needMore?: string;
    contactSupport?: string;
  };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renocalcpro.fr";

// ---------- helpers ----------
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Découpe le body en paragraphes et détecte les sous-sections (lignes débutant par ## ou par numéro 1./2.). */
function extractToc(body: string): { id: string; label: string }[] {
  const toc: { id: string; label: string }[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const m1 = line.match(/^##\s+(.+)$/);
    const m2 = line.match(/^(\d+)\.\s+(.{4,}?)(?:[.:!?]|$)/);
    if (m1) toc.push({ id: slugify(m1[1]), label: m1[1] });
    else if (m2 && Number(m2[1]) <= 12 && toc.length < 12) toc.push({ id: slugify(m2[2]), label: m2[2].slice(0, 60) });
  }
  return toc;
}

/** Rend le body en HTML simple (gras/italique/liste/heading). Pas de markdown library. */
function renderBody(body: string): { __html: string } {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = body.split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inList) { html += "</ul>"; inList = false; }
      html += "<p class=\"my-3\"></p>";
      continue;
    }
    // Heading ##
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      if (inList) { html += "</ul>"; inList = false; }
      const id = slugify(h[1]);
      html += `<h2 id="${id}" class="font-serif text-2xl font-semibold text-teal-900 mt-8 mb-3" style="font-family:'Source Serif 4',Lora,serif">${escapeHtml(h[1])}</h2>`;
      continue;
    }
    // Liste à tirets
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { html += "<ul class=\"my-3 list-disc space-y-1 pl-6\">"; inList = true; }
      const item = line.replace(/^[-*]\s+/, "");
      html += `<li>${inline(escapeHtml(item))}</li>`;
      continue;
    }
    // Paragraphe (peut être numéroté 1. 2. …)
    if (inList) { html += "</ul>"; inList = false; }
    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      const id = slugify(numbered[2].slice(0, 60));
      html += `<p id="${id}" class="my-3 text-stone-800 leading-relaxed"><strong>${numbered[1]}.</strong> ${inline(escapeHtml(numbered[2]))}</p>`;
    } else {
      html += `<p class="my-3 text-stone-800 leading-relaxed">${inline(escapeHtml(line))}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return { __html: html };
}

/** Inline transforms : **bold**, *italic*, `code`. */
function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:]|$)/g, "$1<em>$2</em>")
    .replace(/`([^`\n]+)`/g, "<code class=\"rounded bg-stone-100 px-1.5 py-0.5 font-mono text-sm\">$1</code>");
}

// ---------- metadata ----------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const messages = (await getMessages()) as unknown as HelpMessages;
  const article = messages.help?.articles?.[slug];
  if (!article) return { title: "404" };
  const url = `${SITE_URL}/${locale}/help/${slug}`;
  return {
    title: `${article.title} — ${messages.help.title}`,
    description: article.summary,
    alternates: {
      canonical: url,
      languages: {
        "fr-FR": `${SITE_URL}/fr/help/${slug}`,
        en: `${SITE_URL}/en/help/${slug}`,
        es: `${SITE_URL}/es/help/${slug}`,
        de: `${SITE_URL}/de/help/${slug}`,
        pt: `${SITE_URL}/pt/help/${slug}`,
      },
    },
    openGraph: { title: article.title, description: article.summary, url, type: "article" },
  };
}

// ---------- page ----------
export default async function HelpArticle({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");
  const messages = (await getMessages()) as unknown as HelpMessages;

  const article = messages.help?.articles?.[slug];
  if (!article) notFound();

  const allArticles = Object.entries(messages.help.articles ?? {}).map(([s, a]) => ({ slug: s, ...a }));
  const related = allArticles.filter(a => a.category === article.category && a.slug !== slug).slice(0, 5);
  const toc = extractToc(article.body);
  const categoryLabel = messages.help.categories?.[article.category] ?? article.category;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: t("title"), url: `${SITE_URL}/${locale}/help` },
          { name: categoryLabel, url: `${SITE_URL}/${locale}/help#${article.category}` },
          { name: article.title, url: `${SITE_URL}/${locale}/help/${slug}` },
        ]}
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-6 text-sm text-stone-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href={`/${locale}`} className="hover:underline">Accueil</Link></li>
            <li aria-hidden>›</li>
            <li><Link href={`/${locale}/help`} className="hover:underline">{t("title")}</Link></li>
            <li aria-hidden>›</li>
            <li><span className="text-teal-700">{categoryLabel}</span></li>
            <li aria-hidden>›</li>
            <li className="font-medium text-stone-900" aria-current="page">{article.title}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
          {/* Article */}
          <article>
            <header>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{categoryLabel}</p>
              <h1 className="mt-2 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
                {article.title}
              </h1>
              <p className="mt-3 text-lg text-stone-600">{article.summary}</p>
            </header>

            {messages.help.translationNotice && (
              <div role="note" className="mt-6 rounded-lg border-l-4 border-teal-500 bg-teal-50 p-3 text-sm text-teal-900">
                ℹ {messages.help.translationNotice}
              </div>
            )}

            <div className="prose prose-stone mt-8 max-w-none" dangerouslySetInnerHTML={renderBody(article.body)} />

            <div className="mt-10">
              <HelpFeedback
                slug={slug}
                locale={locale}
                labels={{
                  question: t("wasItHelpful"),
                  yes: t("yes"),
                  no: t("no"),
                  thanks: t("thanks"),
                }}
              />
            </div>

            <footer className="mt-10 border-t border-stone-200 pt-6 text-sm text-stone-600">
              <p>{t("needMore")}</p>
              <a href="mailto:contact@renocalcpro.fr" className="mt-1 inline-block font-semibold text-teal-700 hover:underline">
                {t("contactSupport")} →
              </a>
            </footer>
          </article>

          {/* Sidebar : TOC + related */}
          <aside className="space-y-8">
            {toc.length > 1 && (
              <nav aria-label={t("tocAria")} className="rounded-xl border border-stone-200 bg-white p-4 lg:sticky lg:top-24">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700">{t("onThisPage")}</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {toc.map(item => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="block text-stone-700 transition hover:text-teal-700">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {related.length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700">{categoryLabel}</h2>
                <ul className="mt-3 space-y-3 text-sm">
                  {related.map(r => (
                    <li key={r.slug}>
                      <Link href={`/help/${r.slug}`} className="block transition hover:text-teal-700">
                        <span className="block font-medium text-stone-900">{r.title}</span>
                        <span className="mt-0.5 block text-xs text-stone-600">{r.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
