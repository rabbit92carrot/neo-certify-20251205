import React from 'react';
import { Toaster } from '@/components/ui/sonner';

/**
 * Sonner Toast Provider Decorator
 */
export const withToaster = (Story: React.ComponentType) => (
  <>
    <Story />
    <Toaster />
  </>
);

/**
 * Card/Layout Wrapper Decorator
 */
export const withCardWrapper = (Story: React.ComponentType) => (
  <div className="p-6 max-w-4xl">
    <Story />
  </div>
);

/**
 * Full Width Layout Decorator
 */
export const withFullWidth = (Story: React.ComponentType) => (
  <div className="w-full max-w-6xl p-6">
    <Story />
  </div>
);

/**
 * Dashboard Layout Mock Decorator
 */
export const withDashboardBackground = (Story: React.ComponentType) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <Story />
  </div>
);

/**
 * Form Container Decorator
 */
export const withFormContainer = (Story: React.ComponentType) => (
  <div className="w-96 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
    <Story />
    <Toaster />
  </div>
);

/**
 * Table Container Decorator
 */
export const withTableContainer = (Story: React.ComponentType) => (
  <div className="w-full max-w-5xl p-4 bg-white dark:bg-gray-800 rounded-lg">
    <Story />
  </div>
);

/**
 * Mobile View Decorator
 */
export const withMobileView = (Story: React.ComponentType) => (
  <div className="w-[375px] min-h-[667px] bg-white dark:bg-gray-800 overflow-hidden">
    <Story />
  </div>
);
