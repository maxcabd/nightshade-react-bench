// app/lib/places/hours.ts

export interface HourSlot {
    start: string; // "08:30"
    end: string;   // "16:30"
}

export interface Hours {
    mon?: HourSlot[];
    tue?: HourSlot[];
    wed?: HourSlot[];
    thu?: HourSlot[];
    fri?: HourSlot[];
    sat?: HourSlot[];
    sun?: HourSlot[];
}

export interface OpenStatus {
    isOpen: boolean;
    closesAt: string | null;
    opensAt: string | null;
    nextOpenDay: string | null;
}

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getCurrentDay(): typeof DAY_NAMES[number] {
    const now = new Date();
    return DAY_NAMES[now.getDay()];
}

function getCurrentMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function getNextDay(day: typeof DAY_NAMES[number]): typeof DAY_NAMES[number] {
    const idx = DAY_NAMES.indexOf(day);
    return DAY_NAMES[(idx + 1) % 7];
}

function findNextOpening(hours: Hours, currentDay: typeof DAY_NAMES[number]): {
    day: string;
    time: string;
} | null {
    let checkDay = getNextDay(currentDay);
    let daysChecked = 0;

    while (daysChecked < 7) {
        const slots = hours[checkDay];
        if (slots && slots.length > 0) {
            const dayIdx = DAY_NAMES.indexOf(checkDay);
            const nextDayIdx = DAY_NAMES.indexOf(getNextDay(currentDay));

            if (dayIdx === nextDayIdx) {
                return { day: 'tomorrow', time: formatTime(slots[0].start) };
            }

            return { day: DAY_NAMES_FULL[dayIdx], time: formatTime(slots[0].start) };
        }

        checkDay = getNextDay(checkDay);
        daysChecked++;
    }

    return null;
}

export function getOpenStatus(hours?: Hours): OpenStatus {
    const closed: OpenStatus = {
        isOpen: false,
        closesAt: null,
        opensAt: null,
        nextOpenDay: null,
    };

    if (!hours) return closed;

    const currentDay = getCurrentDay();
    const currentMinutes = getCurrentMinutes();
    const todaySlots = hours[currentDay];

    if (!todaySlots || todaySlots.length === 0) {
        const next = findNextOpening(hours, currentDay);
        if (next) {
            return { ...closed, opensAt: next.time, nextOpenDay: next.day };
        }
        return closed;
    }

    // Check if currently open
    for (const slot of todaySlots) {
        const start = timeToMinutes(slot.start);
        const end = timeToMinutes(slot.end);

        if (currentMinutes >= start && currentMinutes < end) {
            return {
                isOpen: true,
                closesAt: formatTime(slot.end),
                opensAt: null,
                nextOpenDay: null,
            };
        }
    }

    // Not open yet today?
    const firstStart = timeToMinutes(todaySlots[0].start);
    if (currentMinutes < firstStart) {
        return {
            isOpen: false,
            closesAt: null,
            opensAt: formatTime(todaySlots[0].start),
            nextOpenDay: 'today',
        };
    }

    // Closed for today
    const next = findNextOpening(hours, currentDay);
    if (next) {
        return { ...closed, opensAt: next.time, nextOpenDay: next.day };
    }

    return closed;
}
