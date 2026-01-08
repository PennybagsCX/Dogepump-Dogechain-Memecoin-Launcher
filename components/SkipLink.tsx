/**
 * Skip Navigation Link Component
 * Allows keyboard users to skip to main content
 * Improves accessibility by providing quick navigation
 */

export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-doge-accent focus:text-black focus:rounded focus:font-medium focus:outline-none focus:ring-2 focus:ring-doge-light"
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;
