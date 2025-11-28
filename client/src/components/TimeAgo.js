import React, { useEffect, useState } from 'react';

export default function TimeAgo({ date }) {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        const updateTime = () => {
            if (!date) return;

            const now = new Date();
            const past = new Date(date);
            const diffInSeconds = Math.floor((now - past) / 1000);

            if (diffInSeconds < 60) {
                setTimeAgo('just now');
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                setTimeAgo(`${minutes}m`);
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                setTimeAgo(`${hours}h`);
            } else if (diffInSeconds < 604800) {
                const days = Math.floor(diffInSeconds / 86400);
                setTimeAgo(`${days}d`);
            } else {
                // Format as "Month Day" e.g. "Nov 28"
                setTimeAgo(past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, [date]);

    return <span title={new Date(date).toLocaleString()}>{timeAgo}</span>;
}
