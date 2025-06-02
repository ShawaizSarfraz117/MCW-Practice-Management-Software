export const validators = {
  required:
    (message: string = "This field is required") =>
    (value: string | undefined) =>
      !value ? message : undefined,

  email: (value: string) => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value)
      ? undefined
      : "Please enter a valid email address";
  },

  npi: (value: string) => {
    if (!value) return undefined;

    if (!/^\d{10}$/.test(value)) {
      return "NPI must be exactly 10 digits";
    }

    // Luhn algorithm validation
    const digits = value.split("").map(Number);
    let sum = 0;
    let alternate = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];

      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }

      sum += digit;
      alternate = !alternate;
    }

    return sum % 10 === 0 ? undefined : "Invalid NPI number";
  },

  minArrayLength:
    (min: number, message: string = `Please select at least ${min} item(s)`) =>
    (value: string[] | undefined) =>
      !value || value.length < min ? message : undefined,

  phoneNumber: (value: string) => {
    if (!value) return undefined;
    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
    return phoneRegex.test(value)
      ? undefined
      : "Please enter a valid phone number";
  },
};
