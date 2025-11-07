/**
 * Toast Hook - Simple toast notifications
 */

import { useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      // Simple console logging for now - can be replaced with actual toast implementation
      console.log(`Toast [${variant}]: ${title} - ${description}`);

      // For now, we'll use browser alert for errors to provide user feedback
      if (variant === 'destructive' && title) {
        alert(`Error: ${title}${description ? `\n${description}` : ''}`);
      } else if (title) {
        console.log(
          `Success: ${title}${description ? ` - ${description}` : ''}`
        );
      }
    },
    []
  );

  return { toast };
}
