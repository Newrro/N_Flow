'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { DocumentCenter } from '@/components/shared/DocumentCenter';

export default function EmployeeDocumentsPage() {
  return (
    <Container
      title="Secure Vault & Document Center"
      subtitle="Deploy files and media assets safely — accessible to you and administration."
    >
      <DocumentCenter role="employee" />
    </Container>
  );
}
