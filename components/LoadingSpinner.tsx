import React from 'react';

/**
 * A simple loading spinner component.
 * @param size The size of the spinner (e.g., 'small', 'medium', 'large' or custom CSS classes).
 * @param color The color of the spinner (Tailwind CSS color class, e.g., 'text-blue-500').
 */
export const LoadingSpinner: React.FC<{ size?: string; color?: string }> = ({
  size = 'h-6 w-6',
  color = 'text-blue-500',
}) => {
  return (
    <div className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${size} ${color}`} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};
