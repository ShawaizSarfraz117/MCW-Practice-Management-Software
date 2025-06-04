import { useForm } from "@mcw/ui";

export interface ProfileFormData {
  dateOfBirth?: string | null;
  phone?: string | null;
  profilePhoto?: string | null;
  username?: string | null;
}

export type ProfileFormType = ReturnType<typeof useForm<ProfileFormData>>;

// Update ProfileData interface to include name
export interface ProfileData
  extends Omit<import("@/types/profile").ProfileData, ""> {
  name?: string;
}
