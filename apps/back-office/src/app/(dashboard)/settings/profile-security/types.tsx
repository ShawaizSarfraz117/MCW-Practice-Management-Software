import { Dispatch, SetStateAction } from "react";

export interface ProfileFormData {
  dateOfBirth: string | null;
  phone: string | null;
  profilePhoto: string | null;
}

// Replace ReactFormExtendedApi with a more generic type to avoid import issues
export interface ProfileFormType {
  getFieldValue: (
    name: keyof ProfileFormData,
  ) => ProfileFormData[keyof ProfileFormData];
  setFieldValue: (
    name: keyof ProfileFormData,
    value: ProfileFormData[keyof ProfileFormData],
  ) => void;
  Field: (props: {
    name: keyof ProfileFormData;
    children: (field: FieldProps) => React.ReactNode;
  }) => React.ReactNode;
}

export interface FieldProps {
  handleChange: (value: string | null) => void;
}

export interface ProfileInfoProps {
  form: ProfileFormType;
  isEditing?: boolean;
  setIsEditing?: Dispatch<SetStateAction<boolean>>;
  handleSave?: () => void;
}

export interface SecurityInfoProps {
  form: ProfileFormType;
  isEditing?: boolean;
}

export interface ProfilePhotoProps {
  form: ProfileFormType;
  isEditing?: boolean;
}
