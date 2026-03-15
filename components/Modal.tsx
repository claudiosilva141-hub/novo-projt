import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  autoPrint?: boolean; // New prop: if true, triggers window.print() when modal opens
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  autoPrint = false, // Default to false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      if (autoPrint) {
        // Delay print slightly to ensure modal is rendered before printing
        const printTimeout = setTimeout(() => {
          window.print();
        }, 300); // Small delay
        return () => {
          clearTimeout(printTimeout);
          document.removeEventListener('keydown', handleEscape);
        };
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, autoPrint]);

  if (!isOpen) return null;

  let maxWidthClass = 'max-w-md';
  switch (size) {
    case 'sm':
      maxWidthClass = 'max-w-sm';
      break;
    case 'md':
      maxWidthClass = 'max-w-md';
      break;
    case 'lg':
      maxWidthClass = 'max-w-lg';
      break;
    case 'xl':
      maxWidthClass = 'max-w-xl';
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-6 md:p-6" onClick={onClose}>
      <div
        ref={modalRef}
        className={`relative bg-white rounded-lg shadow-xl w-full ${maxWidthClass} overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end p-4 border-t border-gray-200 gap-2">
            {footer}
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
        {!footer && (
             <div className="flex justify-end p-4 border-t border-gray-200 gap-2">
                <Button variant="secondary" onClick={onClose}>
                    Fechar
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};