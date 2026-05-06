import dayjs from 'dayjs';
import d from 'dayjs/plugin/duration';

dayjs.extend(d);

export const getDuration = dayjs.duration;

export const add = (date: Date, value: number, unit?: dayjs.ManipulateType) =>
    dayjs(date).add(value, unit).toDate();

export const toDayInstance = (date: dayjs.ConfigType) => dayjs(date);
