export interface MockComponentProps {
  children?: React.ReactNode;
  className?: string;
  href?: string;
  placeholder?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onClick?: () => void;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  value?: string;
  handleApplyCustomRange?: (from: Date, to: Date) => void;
  activities?: Activity[];
  showDetails?: boolean;
  onSearch?: (value: string) => void;
  onDateRangeChange?: (from: Date | undefined, to: Date | undefined) => void;
  onEventTypeChange?: (type: string) => void;
  onToggleDetails?: () => void;
}

export interface Activity {
  date: string;
  time: string;
  event: string;
  ipAddress?: string;
  location?: string;
  clientId?: string;
  clientName?: string;
}
