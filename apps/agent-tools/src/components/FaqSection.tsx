import { faqJsonLd, type Faq } from "@/lib/faq";

/** Visible FAQ + matching FAQPage JSON-LD (search engines require the content to be on the page). */
export function FaqSection({ faq, title = "FAQ" }: { faq: Faq[]; title?: string }) {
  if (faq.length === 0) return null;
  return (
    <section className="mt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)) }} />
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <dl className="space-y-4">
        {faq.map((f) => (
          <div key={f.q}>
            <dt className="font-medium text-gray-900">{f.q}</dt>
            <dd className="text-gray-600 mt-1">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
