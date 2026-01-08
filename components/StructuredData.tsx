import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type: 'WebSite' | 'Organization' | 'Product' | 'BreadcrumbList';
  data: any;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generateSchema = () => {
    switch (type) {
      case 'WebSite':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'DogePump',
          url: 'https://dogepump.com',
          description: 'DogePump is the premier fair-launch memecoin platform on Dogechain. Discover, launch, and trade memecoins with no presale, no team allocation, and instant bonding curve deployment.',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://dogepump.com',
            'query-input': 'required'
          },
          publisher: {
            '@type': 'Organization',
            name: 'DogePump',
            logo: 'https://dogepump.com/logo.png'
          }
        };
      
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'DogePump',
          url: 'https://dogepump.com',
          logo: 'https://dogepump.com/logo.png',
          description: 'DogePump is the premier fair-launch memecoin platform on Dogechain.',
          sameAs: ['https://twitter.com/DogePumpFun', 'https://t.me/DogePumpFun'],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'support@dogepump.com'
          }
        };
      
      case 'Product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          image: data.imageUrl,
          description: data.description || `${data.name} ($${data.ticker}) - Fair launch memecoin on DogePump. Market cap: ${data.marketCap}, Progress: ${data.progress.toFixed(2)}%`,
          brand: {
            '@type': 'Organization',
            name: 'DogePump'
          },
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: 'DC',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'DogePump'
            }
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: data.rating || 4.5,
            reviewCount: data.reviewCount || 0
          }
        };
      
      case 'BreadcrumbList':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.items.map((item: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `https://dogepump.com${item.url}`
          }))
        };
      
      default:
        return {};
    }
  };

  const schema = generateSchema();

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
