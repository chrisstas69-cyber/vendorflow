import { PublicLayout } from '@/components/layout/public-layout';

export const metadata = { title: 'Terms of Service' };

const sections = [
  ['Using VendorFlow', 'You must provide accurate information, keep your sign-in link and account secure, and use the service only for lawful event and vendor activity. You may not scrape private data, impersonate another person or organization, send spam, interfere with the service, or upload malicious or infringing material.'],
  ['Event listings', 'Public listings may be submitted by organizers or collected from public sources. Dates, availability, fees, and other details can change. Confirm important information with the event organizer before traveling, applying, or spending money. Organizers may claim or correct listings, and VendorFlow may edit, reject, expire, or remove listings.'],
  ['Vendor and organizer transactions', 'Vendors and organizers are responsible for their own applications, permits, insurance, contracts, products, services, taxes, refunds, safety, and legal compliance. VendorFlow provides workflow tools and does not guarantee attendance, acceptance, sales, profitability, or performance by either party.'],
  ['Fees and payments', 'Public event listings may be free. Paid plans and transaction features will show the applicable price before purchase. When payment processing is enabled, payment information is handled by the payment provider. Unless required by law or stated at purchase, subscription fees are non-refundable after the applicable billing period begins.'],
  ['Content license', 'You retain ownership of content you submit. You give VendorFlow permission to host, reproduce, format, and display it as needed to operate and promote the service and the relevant event or profile. You confirm that you have the rights needed to submit that content.'],
  ['Service availability', 'The service may change, experience interruptions, or discontinue features. To the maximum extent permitted by law, VendorFlow is provided “as is” without warranties, and VendorFlow is not liable for indirect, incidental, special, consequential, or lost-profit damages.'],
  ['Account suspension', 'We may restrict or terminate access for abuse, security risk, nonpayment, infringement, illegal activity, or material violation of these terms. You may stop using the service at any time and request account deletion.'],
  ['Changes and governing law', 'We may update these terms and will post the effective date here. Continued use after an update means you accept the revised terms. These terms are governed by the laws of the State of New York, without regard to conflict-of-law rules.'],
];

export default function TermsPage() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold text-orange-600">Effective August 13, 2026</p>
        <h1 className="mt-2 text-4xl font-bold">Terms of Service</h1>
        <p className="mt-4 vf-text-muted">These terms govern access to VendorFlow’s public event directory and vendor and organizer tools.</p>
        <div className="mt-10 space-y-8">
          {sections.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 vf-text-muted">{body}</p></section>)}
          <section><h2 className="text-xl font-semibold">Contact</h2><p className="mt-2 leading-7 vf-text-muted">Questions can be sent to <a className="text-orange-600 underline" href="mailto:legal@vendorflow.app">legal@vendorflow.app</a>.</p></section>
        </div>
      </article>
    </PublicLayout>
  );
}
