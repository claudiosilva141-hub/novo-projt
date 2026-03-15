import React from 'react';

interface ReportCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export const ReportCard: React.FC<ReportCardProps> = ({
  title,
  value,
  icon,
  description,
  color = 'blue',
}) => {
  const bgColorClass = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    yellow: 'bg-yellow-50',
    purple: 'bg-purple-50',
  }[color];

  const textColorClass = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
  }[color];

  return (
    <div className={`p-5 rounded-lg shadow-md flex items-start space-x-4 ${bgColorClass}`}>
      {icon && (
        <div className={`flex-shrink-0 ${textColorClass}`}>
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-1 text-2xl font-semibold ${textColorClass}`}>{value}</p>
        {description && (
          <p className="mt-2 text-sm text-gray-400">{description}</p>
        )}
      </div>
    </div>
  );
};