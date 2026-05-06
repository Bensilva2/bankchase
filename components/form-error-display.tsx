import { AlertCircle, XCircle, CheckCircle } from 'lucide-react';

export interface FormErrorDisplayProps {
  errors?: Record<string, string>;
  globalError?: string;
  globalSuccess?: string;
}

export function FormErrorDisplay({
  errors,
  globalError,
  globalSuccess,
}: FormErrorDisplayProps) {
  return (
    <div className="space-y-3">
      {/* Global Success Message */}
      {globalSuccess && (
        <div className="flex gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              {globalSuccess}
            </p>
          </div>
        </div>
      )}

      {/* Global Error Message */}
      {globalError && (
        <div className="flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {globalError}
            </p>
          </div>
        </div>
      )}

      {/* Field-Level Errors */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="flex gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900">
          <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field} className="text-sm text-amber-700 dark:text-amber-300">
                  <span className="font-semibold capitalize">{field.replace('_', ' ')}:</span> {error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function FormFieldError({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <div className="flex gap-2 mt-1.5 p-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p>
    </div>
  );
}
