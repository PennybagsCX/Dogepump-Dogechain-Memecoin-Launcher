/**
 * Enhanced Structured Data Component
 * Provides comprehensive JSON-LD for SEO
 */

interface StructuredDataProps {
  type: 'WebPage' | 'Organization' | 'FAQPage' | 'BreadcrumbList' | 'WebSite';
  data: any;
}

export const StructuredDataEnhanced = ({ type, data }: StructuredDataProps) => {
  const generateSchema = () => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    return JSON.stringify(baseSchema);
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: generateSchema() }}
    />
  );
};

// WebPage Schema
export const WebPageSchema = ({ 
  name, 
  description, 
  url, 
  lastModified 
}: { 
  name: string; 
  description: string; 
  url: string; 
  lastModified?: string;
}) => {
  return (
    <StructuredDataEnhanced
      type="WebPage"
      data={{
        name,
        description,
        url: `https://dogepump.com${url}`,
        dateModified: lastModified || new Date().toISOString(),
        inLanguage: 'en-US',
        isPartOf: {
          '@type': 'WebSite',
          name: 'DogePump',
          url: 'https://dogepump.com'
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: 'https://dogepump.com/og-image.png',
          width: 1200,
          height: 630
        }
      }}
    />
  );
};

// Organization Schema
export const OrganizationSchema = () => {
  return (
    <StructuredDataEnhanced
      type="Organization"
      data={{
        name: 'DogePump',
        url: 'https://dogepump.com',
        logo: 'https://dogepump.com/favicon.svg',
        description: 'Dogechain Memecoin Launchpad - Launch fair-launch memecoins on Dogechain',
        sameAs: [
          'https://twitter.com/dogepump',
          'https://t.me/dogepump',
          'https://discord.gg/dogepump'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['English']
        }
      }}
    />
  );
};

// WebSite Schema
export const WebSiteSchema = () => {
  return (
    <StructuredDataEnhanced
      type="WebSite"
      data={{
        name: 'DogePump',
        url: 'https://dogepump.com',
        description: 'Dogechain Memecoin Launchpad - Discover, trade, and create memecoins',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://dogepump.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }}
    />
  );
};

// Breadcrumb Schema
export const BreadcrumbSchema = ({ items }: { items: Array<{ name: string; url: string }> }) => {
  return (
    <StructuredDataEnhanced
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `https://dogepump.com${item.url}`
        }))
      }}
    />
  );
};

// FAQ Schema
export const FAQSchema = ({ faqs }: { faqs: Array<{ question: string; answer: string }> }) => {
  return (
    <StructuredDataEnhanced
      type="FAQPage"
      data={{
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer
          }
        }))
      }}
    />
  );
};

export default StructuredDataEnhanced;
