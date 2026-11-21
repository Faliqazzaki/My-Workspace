const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

export const toDateInput = (value) => (value ? value.slice(0, 10) : '');

export const formatDate = (value) => {
    if (!value) {
        return '';
    }

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);

    return dateFormatter.format(new Date(year, month - 1, day));
};

export const formatLongDate = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);

    return longDateFormatter.format(date);
};

export const todayIso = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
};

export const isOverdue = (value, status) => {
    return (
        Boolean(value) && status !== 'done' && value.slice(0, 10) < todayIso()
    );
};
