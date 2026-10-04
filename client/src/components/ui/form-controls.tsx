import { forwardRef, type ComponentProps, type ReactNode, useId } from 'react';
import { cn } from '@/utils/cn';
export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = 'Select';
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<'textarea'>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error && (
        <span
          id={id}
          role="alert"
          className="block text-xs font-normal text-destructive"
        >
          {error}
        </span>
      )}
    </label>
  );
}
