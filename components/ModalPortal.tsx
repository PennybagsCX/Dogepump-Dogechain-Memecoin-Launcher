import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const [portalRoot, setPortalRoot] = React.useState<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a dedicated container for modals
    const root = document.createElement('div');
    root.id = 'modal-portal-root';
    root.style.position = 'fixed';
    root.style.top = '0';
    root.style.left = '0';
    root.style.right = '0';
    root.style.bottom = '0';
    root.style.pointerEvents = 'none';
    root.style.zIndex = '9999';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.justifyContent = 'center';

    document.body.appendChild(root);
    setPortalRoot(root);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.removeChild(root);
      document.body.style.overflow = '';
    };
  }, []);

  if (!portalRoot) return null;

  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      {children}
    </div>,
    portalRoot
  );
};
