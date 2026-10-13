import { PublicLayout } from '@/components/layout/public-layout';

export const metadata = { title: 'Privacy Policy' };

const sections = [
  ['Information we collect', 'We collect account email addresses, organizer and vendor profile details, event submissions, applications, uploaded files, payment records, saved-event activity, and basic technical logs needed to operate and secure VendorFlow.'],
  ['How we use information', 'We use this information to publish event listings, connect vendors and organizers, operate application and payment workflows, provide support, prevent abuse, and improve the service. We do not sell personal information.'],
  ['Public information', 'Published event details, organizer names, and information intentionally added to public vendor profiles may be visible to anyone. Do not upload confidential information into public profile or listing fields.'],
  ['Service providers', 'VendorFlow uses infrastructure and service providers for hosting, databases, file storage, analytics, email, monitoring, and payments. They process information only to provide those services under their own privacy and security terms.'],
  ['Retention and choices', 'We keep records while an account or listing is active and as reasonably needed for security, legal, accounting, and dispute purposes. You may request access, correction, export, or deletion of your information by contacting us. Some records may be retained where legally required.'],
  ['Cookies and local storage', 'We use an essential sign-in cookie and browser storage for preferences, saved events, and limited pilot features. Payment providers and analytics may set additional identifiers when those services are enabled.'],
  ['Security', 'We use access controls, signed sessions, encrypted network connections, and tenant isolation. No internet service can guarantee absolute security, so please report suspected account misuse promptly.'],
  ['Children', 'VendorFlow is a business and event-discovery service and is not directed to children under 13.'],
];

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold text-orange-600">Effective August 13, 2026</p>
        <h1 className="mt-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 vf-text-muted">This policy explains how VendorFlow handles information when you browse events or use vendor and organizer tools.</p>
        <div className="mt-10 space-y-8">
          {sections.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 leading-7 vf-text-muted">{body}</p></section>)}
          <section><h2 className="text-xl font-semibold">Contact</h2><p className="mt-2 leading-7 vf-text-muted">Privacy questions or requests can be sent to <a className="text-orange-600 underline" href="mailto:privacy@vendorflow.app">privacy@vendorflow.app</a>.</p></section>
        </div>
      </article>
    </PublicLayout>
  );
}
