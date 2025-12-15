export function ConfirmationSkeleton() {
    return (
        <div className="flex-grow flex flex-col items-center justify-center py-6 px-4 sm:px-6 relative w-full overflow-hidden">
            {/* Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 via-transparent to-slate-100/50 dark:from-slate-900/20 dark:to-slate-900/20 -z-20 pointer-events-none" />

            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[700px] h-[700px] bg-slate-200/50 dark:bg-slate-800/30 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-slate-200/50 dark:bg-slate-800/30 rounded-full blur-[120px]" />
            </div>

            {/* Header Skeleton */}
            <div className="text-center mb-6 w-full flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full mb-4 animate-pulse" />
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2 animate-pulse" />
                <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>

            {/* Card Skeleton - Matches new max-w-xl and shadow-xl */}
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Card Header */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 p-6 border-b border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                        <div className="w-40 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse hidden sm:block" />
                </div>

                {/* Card Body */}
                <div className="p-6">
                    {/* Timeline Skeleton */}
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
                        <div className="flex gap-3 items-start w-full md:w-auto">
                            <div className="flex flex-col items-center gap-1 mt-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="w-16 h-2.5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>

                        <div className="hidden md:flex flex-1 mx-2 h-px bg-slate-100 dark:bg-slate-800" />

                        <div className="flex gap-3 items-start w-full md:w-auto">
                            <div className="flex flex-col items-center gap-1 mt-1">
                                <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700 md:hidden" />
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="w-16 h-2.5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-6" />

                    {/* Details Grid Skeleton */}
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Skeleton */}
                <div className="bg-slate-50 dark:bg-slate-800/20 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
            </div>

            {/* Buttons Skeleton */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <div className="flex-1 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            </div>
        </div>
    )
}
