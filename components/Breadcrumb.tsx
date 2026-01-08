import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `https://dogepump.com${item.url}` : undefined
    }))
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4" aria-label="Breadcrumb">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={14} className="text-gray-500" />}
            {item.url ? (
              <Link 
                to={item.url} 
                className="hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-white font-medium">
                {item.name}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumb;
