import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines classNames with Tailwind CSS merge support.
 * Merges conflicting Tailwind classes intelligently.
 * 
 * @example
 * cn('px-2', 'px-4') // Returns 'px-4' (second wins)
 * cn('text-red-500', 'text-blue-500') // Returns 'text-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// === TIME/DATE UTILITIES ===

/**
 * Formats elapsed time from a timestamp in human-readable format.
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted string (e.g., "< 1 dk", "45 dk", "2s 30dk")
 * @example
 * formatElapsed(Date.now() - 300000) // Returns "5 dk"
 */
export function formatElapsed(timestamp?: number): string {
    if (!timestamp) return '';
    const mins = Math.floor((Date.now() - timestamp) / 60000);
    if (mins < 1) return '< 1 dk';
    if (mins < 60) return `${mins} dk`;
    return `${Math.floor(mins / 60)}s ${mins % 60}dk`;
}

/**
 * Checks if time has exceeded warning threshold.
 * Useful for highlighting old orders or urgent items.
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @param warnMinutes - Warning threshold in minutes (default: 10)
 * @returns true if elapsed time exceeds threshold
 * @example
 * isUrgent(oldOrderTime, 15) // Returns true if order is 15+ minutes old
 */
export function isUrgent(timestamp?: number, warnMinutes = 10): boolean {
    return !!timestamp && (Date.now() - timestamp) / 60000 > warnMinutes;
}

/**
 * Formats a date object or ISO string to Turkish date format.
 * 
 * @param date - Date object, number (timestamp), or ISO string
 * @returns Formatted date string (e.g., "25 Mar 2026")
 * @example
 * formatDate(new Date()) // Returns "25 Mar 2026"
 */
export function formatDate(date: Date | number | string): string {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Formats a time string (HH:MM) or timestamp to display format.
 * 
 * @param time - Time string ("HH:MM") or timestamp
 * @returns Formatted time string
 * @example
 * formatTime("14:30") // Returns "14:30"
 * formatTime(1234567890000) // Returns "12:30" (example)
 */
export function formatTime(time?: string | number): string {
    if (!time) return '';
    if (typeof time === 'string') return time;
    return new Date(time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// === FORMATTING UTILITIES ===

/**
 * Formats a number as Turkish currency (₺).
 * 
 * @param amount - Amount in Turkish Lira
 * @returns Formatted currency string (e.g., "₺250,00")
 * @example
 * formatCurrency(1250.50) // Returns "₺1.250,50"
 */
export function formatCurrency(amount: number): string {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

/**
 * Formats a decimal number with fixed precision.
 * 
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * @example
 * formatNumber(1234.567, 1) // Returns "1234.6"
 */
export function formatNumber(num: number, decimals = 2): string {
    return num.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// === VALIDATION UTILITIES ===

/**
 * Checks if a PIN string is valid (numeric, 4+ digits).
 * 
 * @param pin - PIN string to validate
 * @returns true if valid PIN
 * @example
 * isValidPin("1234") // Returns true
 * isValidPin("abc") // Returns false
 */
export function isValidPin(pin: string): boolean {
    return /^\d{4,}$/.test(pin);
}

/**
 * Checks if an email address is valid.
 * 
 * @param email - Email string to validate
 * @returns true if valid email format
 * @example
 * isValidEmail("user@example.com") // Returns true
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
