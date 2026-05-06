import dayjs from 'dayjs';

import { getDuration } from './date';
import { fixed, s2ms } from './math';

const k = 1000;
export const formatCount = (num: number, fractionDigits = 1) => {
    if (num < k) {
        return num.toString();
    } else if (num < k ** 2) {
        return `${fixed(num / k, fractionDigits)}K`;
    }

    return `${fixed(num / k ** 2, fractionDigits)}M`;
};

export const formatHoursFromMS = (ms: number) => {
    const duration = getDuration(ms, 'milliseconds');
    const h = duration.hours();
    const m = duration.minutes().toString();
    const s = duration.seconds().toString();
    return `${h > 0 ? `${h.toString()}:` : ''}${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
};

export const formatHoursFromSEC = (seconds: number) =>
    formatHoursFromMS(s2ms(seconds));

export const formatDatetime = (ts: number) =>
    dayjs(ts).format('YYYY-MM-DD HH:mm');

export const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
};
