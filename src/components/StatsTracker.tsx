"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function StatsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        const track = async () => {
            try {
                await fetch('/api/stats/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: pathname,
                        referrer: document.referrer || null
                    })
                });
            } catch (err) {
                // Silently fail for tracking
            }
        };

        // Delay slightly to not interfere with initial load
        const timer = setTimeout(track, 1000);
        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
