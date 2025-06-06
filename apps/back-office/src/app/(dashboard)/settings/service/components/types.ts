/**
 * @deprecated Use centralized Service type from @mcw/types
 * TODO: [TYPE-MIGRATION-DUPLICATE] 4 of 6+ Service definitions
 * TODO: [TYPE-MIGRATION] Move to @mcw/types/entities/service
 * TODO: [TYPE-MIGRATION-CASING] Keep snake_case, create ServiceUI type for components
 */
export type Service = {
  is_default: boolean;
  id: string;
  type: string;
  code: string;
  duration: number;
  block_before: number;
  block_after: number;
  available_online: boolean;
  allow_new_clients: boolean;
  bill_in_units: boolean;
  description: string;
  rate: number;
  require_call: boolean;
  color: string;
};

export type ServiceEdit = {
  id: string;
  type?: string;
  code?: string;
  duration?: number;
  block_before?: number;
  block_after?: number;
  available_online?: boolean;
  allow_new_clients?: boolean;
  bill_in_units?: boolean;
  description?: string;
  rate?: number;
  require_call?: boolean;
  color?: string;
  is_default?: boolean;
};

export interface AddServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
