import React from 'react';

interface SeoJsonLdProps {
  schema: object;
}

export const SeoJsonLd: React.FC<SeoJsonLdProps> = ({ schema }) => (
  <script
    type='application/ld+json'
    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
  />
);

export default SeoJsonLd;
