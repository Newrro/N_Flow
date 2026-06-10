'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { DocumentCenter } from '@/components/shared/DocumentCenter';

export default function AdminDocumentsPage() {
  return (
    <Container
      title="Secure Document Registry"
      subtitle="Access, inspect, and manage corporate file intelligence deployed across the network."
    >
      <DocumentCenter role="admin" />
    </Container>
  );
}
