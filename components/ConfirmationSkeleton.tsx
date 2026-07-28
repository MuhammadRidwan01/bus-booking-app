export function ConfirmationSkeleton() {
    return (
        <div className="flex-grow flex flex-col items-center justify-center py-6 px-4 sm:px-6 relative w-full overflow-hidden">
            {/* Dark void background */}
            <div className="absolute inset-0 -z-20 pointer-events-none" style={{
                background: 'var(--sp-void, #101823)',
                backgroundImage: `
                    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04), transparent 60%),
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 48px),
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 48px)
                `
            }} />

            {/* Header Skeleton */}
            <div className="text-center mb-5 w-full flex flex-col items-center">
                <div className="w-12 h-12 rounded-full mb-3 animate-pulse" style={{ background: 'rgba(244,237,221,0.1)' }} />
                <div className="h-7 w-48 rounded-lg mb-2 animate-pulse" style={{ background: 'rgba(244,237,221,0.1)' }} />
                <div className="h-4 w-56 rounded animate-pulse" style={{ background: 'rgba(244,237,221,0.06)' }} />
            </div>

            {/* Card Skeleton */}
            <div className="w-full max-w-[400px] rounded-[20px] overflow-hidden" style={{
                background: 'var(--sp-paper, #F4EDDD)',
                boxShadow: '0 30px 60px -20px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.4) inset',
            }}>
                {/* Eyebrow Row */}
                <div className="flex items-center justify-between" style={{ padding: '18px 22px 0' }}>
                    <div className="w-20 h-3 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.1)' }} />
                    <div className="w-20 h-5 rounded-full animate-pulse" style={{ background: 'rgba(24,34,49,0.08)' }} />
                </div>

                {/* Brand */}
                <div style={{ padding: '14px 22px 0' }}>
                    <div className="w-48 h-6 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.12)' }} />
                    <div className="w-36 h-3 rounded animate-pulse mt-2" style={{ background: 'rgba(24,34,49,0.08)' }} />
                </div>

                {/* Route */}
                <div className="flex items-start justify-between" style={{ padding: '22px 22px 6px' }}>
                    <div>
                        <div className="w-12 h-2 rounded animate-pulse mb-2" style={{ background: 'rgba(24,34,49,0.1)' }} />
                        <div className="w-28 h-4 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.12)' }} />
                        <div className="w-16 h-2.5 rounded animate-pulse mt-1" style={{ background: 'rgba(24,34,49,0.08)' }} />
                    </div>
                    <div className="text-right">
                        <div className="w-12 h-2 rounded animate-pulse mb-2 ml-auto" style={{ background: 'rgba(24,34,49,0.1)' }} />
                        <div className="w-28 h-4 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.12)' }} />
                        <div className="w-20 h-2.5 rounded animate-pulse mt-1 ml-auto" style={{ background: 'rgba(24,34,49,0.08)' }} />
                    </div>
                </div>

                {/* Track */}
                <div style={{ margin: '8px 22px 4px', height: 20, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 6, right: 6, borderTop: '1.5px dashed rgba(24,34,49,0.1)', transform: 'translateY(-50%)' }} />
                    <div className="animate-pulse" style={{ position: 'absolute', top: '50%', left: 0, width: 7, height: 7, borderRadius: '50%', background: 'rgba(24,34,49,0.15)', transform: 'translateY(-50%)' }} />
                    <div className="animate-pulse" style={{ position: 'absolute', top: '50%', right: 0, width: 7, height: 7, borderRadius: '50%', background: 'rgba(24,34,49,0.15)', transform: 'translateY(-50%)' }} />
                </div>

                {/* Depart Row */}
                <div className="flex items-baseline justify-between" style={{ padding: '10px 22px 20px', borderBottom: '1px dashed rgba(24,34,49,0.18)' }}>
                    <div className="w-20 h-5 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.12)' }} />
                    <div className="w-24 h-3 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.08)' }} />
                </div>

                {/* Notch */}
                <div style={{ position: 'relative', height: 0 }}>
                    <div style={{ position: 'absolute', top: -11, left: -11, width: 22, height: 22, borderRadius: '50%', background: 'var(--sp-void, #101823)' }} />
                    <div style={{ position: 'absolute', top: -11, right: -11, width: 22, height: 22, borderRadius: '50%', background: 'var(--sp-void, #101823)' }} />
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 12px', padding: '22px 22px 6px' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i}>
                            <div className="w-16 h-2 rounded animate-pulse mb-2" style={{ background: 'rgba(24,34,49,0.1)' }} />
                            <div className="w-24 h-4 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.12)' }} />
                        </div>
                    ))}
                </div>

                {/* Stub */}
                <div className="flex items-center" style={{ gap: 14, padding: '16px 22px 20px' }}>
                    <div className="w-[52px] h-[52px] rounded-lg animate-pulse" style={{ background: 'rgba(24,34,49,0.12)' }} />
                    <div className="flex-1">
                        <div className="w-16 h-2 rounded animate-pulse mb-2" style={{ background: 'rgba(24,34,49,0.1)' }} />
                        <div className="w-32 h-4 rounded animate-pulse" style={{ background: 'rgba(24,34,49,0.12)' }} />
                    </div>
                </div>
            </div>

            {/* Stage Hint */}
            <div className="w-28 h-3 rounded animate-pulse mt-4" style={{ background: 'rgba(244,237,221,0.08)' }} />

            {/* Buttons Skeleton */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full max-w-[400px]">
                <div className="flex-1 h-10 rounded-xl animate-pulse" style={{ background: 'rgba(244,237,221,0.1)' }} />
                <div className="flex-1 h-10 rounded-xl animate-pulse" style={{ background: 'rgba(244,237,221,0.06)' }} />
            </div>
        </div>
    )
}
