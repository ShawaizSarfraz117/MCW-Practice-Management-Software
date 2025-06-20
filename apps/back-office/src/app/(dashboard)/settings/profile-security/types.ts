import { useForm } from "@mcw/ui";

export interface ProfileFormData {
  firstName?: string | null;
  lastName?: string | null;
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
  first_name?: string;
  last_name?: string;
}
