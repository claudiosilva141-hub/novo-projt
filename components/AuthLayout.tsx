import React from 'react';
import { COMPANY_NAME_DEFAULT } from '../constants';

interface AuthLayoutProps {
  children: React.ReactNode;
  companyName: string;
  companyLogo: string | null;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, companyName, companyLogo }) => {
  return (
    <div className="min-h-screen bg-amber-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white bg-opacity-90 p-8 rounded-lg shadow-2xl">
        <div className="flex flex-col items-center">
          {companyLogo ? (
            <img className="h-24 w-auto object-contain mb-4 rounded-full shadow-lg" src={companyLogo} alt="Company Logo" />
          ) : (
            <svg
              className="mx-auto h-20 w-auto text-indigo-600 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {companyName || COMPANY_NAME_DEFAULT}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Gerencie sua confecção e vendas com facilidade.
          </p>
        </div>

        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
};