// Date formatting function
export function formatDate(date: Date, format: string = 'long'): string {
  const formats = {
    long: {
      year: 'numeric' as const,
      month: 'long' as const,
      day: 'numeric' as const,
    },
    short: {
      year: 'numeric' as const,
      month: 'numeric' as const,
      day: 'numeric' as const,
    },
    iso: {
      year: 'numeric' as const,
      month: '2-digit' as const,
      day: '2-digit' as const,
    },
  };
  
  return date.toLocaleDateString('en-US', formats[format as keyof typeof formats]);
}

// Currency formatting function
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Phone number formatting
export function formatPhoneNumber(phoneNumber: string): string {
  // Simple US phone number formatting
  const cleaned = phoneNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumber;
} 