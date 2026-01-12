import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = '蘭光電動機車 - 小琉球電動車租賃',
  description = '蘭光電動機車致力於為每一位旅客提供最優質的電動車租賃服務，讓您能夠以最環保、最舒適的方式探索小琉球的美麗風光。',
  keywords = '小琉球,電動車,租車,機車租賃,蘭光電動機車,小琉球租車,電動機車,環保旅遊',
  image = '/logo2.png',
  url = '',
  type = 'website',
  structuredData,
}) => {
  useEffect(() => {
    const baseUrl = window.location.origin;
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl + window.location.pathname;

    // 更新 title
    document.title = title;

    // 更新或創建 meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 基本 SEO meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', '蘭光電動機車');

    // Open Graph meta tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', `${baseUrl}${image}`, 'property');
    updateMetaTag('og:url', fullUrl, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', '蘭光電動機車', 'property');
    updateMetaTag('og:locale', 'zh_TW', 'property');

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', `${baseUrl}${image}`, 'name');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Structured Data (JSON-LD)
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (structuredData) {
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(structuredData);
    } else if (structuredDataScript) {
      structuredDataScript.remove();
    }

    // 清理函數（可選）
    return () => {
      // 如果需要，可以在組件卸載時清理
    };
  }, [title, description, keywords, image, url, type, structuredData]);

  return null;
};

export default SEO;
