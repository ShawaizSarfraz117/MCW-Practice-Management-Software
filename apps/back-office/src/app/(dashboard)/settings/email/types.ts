export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  isActive: boolean;
}

export interface UpdateTemplateData {
  name: string;
  subject: string;
  content: string;
  type: string;
  isActive?: boolean;
}

export interface EmailTemplateEditSidebarProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: (formData: UpdateTemplateData) => void;
  isUpdating?: boolean;
}
