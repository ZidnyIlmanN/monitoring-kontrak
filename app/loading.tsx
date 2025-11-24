import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner className="h-16 w-16" />
      <p className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Sedang memuat sistem...
      </p>
      <p className="absolute bottom-8 text-sm text-gray-500 dark:text-gray-400">
        Monitoring RAM Civil
      </p>
    </div>
  );
}
