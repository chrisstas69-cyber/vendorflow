'use client';

import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { BoothMapEditor } from '@/components/organizer/booth-map-editor';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export default function OrganizerBoothsPage() {
  const { heading, muted, pageTitle } = useOrganizerTheme();

  return (
    <OrganizerLayout>
      <div className="mb-6">
        <h1 className={`${pageTitle} ${heading}`}>Booth map</h1>
        <p className={`text-base mt-1 ${muted}`}>
          Assign vendors to grid positions — electric and water tags included.
        </p>
      </div>
      <BoothMapEditor />
    </OrganizerLayout>
  );
}
