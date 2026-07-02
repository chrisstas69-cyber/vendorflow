import { redirect } from 'next/navigation';

/**
 * Retired — this page duplicated the Applications inbox on top of demo-store
 * data, so organizer and vendor views could disagree. The DB-backed inbox at
 * /organizer/applications is the single source of truth now.
 */
export default function OrganizerCommandPage() {
  redirect('/organizer/applications');
}
