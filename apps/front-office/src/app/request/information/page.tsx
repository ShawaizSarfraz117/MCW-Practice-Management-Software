"use client";

import { useState } from "react";
import { useRequest } from "@/request/context";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
} from "@mcw/ui";

interface PersonalInfo {
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

interface ContactInfo extends PersonalInfo {
  paymentMethod: string;
  isMinor: boolean;
  partnerInfo?: PersonalInfo;
  clientInfo?: PersonalInfo & { isMinor: boolean };
}

export default function InformationPage() {
  const { appointmentData, onUpdate, setCurrentStep } = useRequest();

  const [formData, setFormData] = useState<ContactInfo>({
    legalFirstName: "",
    legalLastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    paymentMethod: "",
    isMinor: false,
    ...(appointmentData.appointmentFor === "partner-and-me" && {
      partnerInfo: {
        legalFirstName: "",
        legalLastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
      },
    }),
    ...(appointmentData.appointmentFor === "someone-else" && {
      clientInfo: {
        legalFirstName: "",
        legalLastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        isMinor: false,
      },
    }),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handlePartnerInfoChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      partnerInfo: {
        ...prev.partnerInfo!,
        [field]: value,
      },
    }));
    if (errors[`partner_${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`partner_${field}`]: "",
      }));
    }
  };

  const handleClientInfoChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      clientInfo: {
        ...prev.clientInfo!,
        [field]: value,
      },
    }));
    if (errors[`client_${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`client_${field}`]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate primary contact fields
    if (!formData.legalFirstName)
      newErrors.legalFirstName = "This field can't be blank";
    if (!formData.legalLastName)
      newErrors.legalLastName = "This field can't be blank";
    if (!formData.email) newErrors.email = "This field can't be blank";
    if (!formData.phone) newErrors.phone = "This field can't be blank";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "This field can't be blank";

    // Validate partner info if appointment is for both
    if (
      appointmentData.appointmentFor === "partner-and-me" &&
      formData.partnerInfo
    ) {
      if (!formData.partnerInfo.legalFirstName)
        newErrors.partner_legalFirstName = "This field can't be blank";
      if (!formData.partnerInfo.legalLastName)
        newErrors.partner_legalLastName = "This field can't be blank";
      if (!formData.partnerInfo.dateOfBirth)
        newErrors.partner_dateOfBirth = "This field can't be blank";
    }

    // Validate client info if appointment is for someone else
    if (
      appointmentData.appointmentFor === "someone-else" &&
      formData.clientInfo
    ) {
      if (!formData.clientInfo.legalFirstName)
        newErrors.client_legalFirstName = "This field can't be blank";
      if (!formData.clientInfo.legalLastName)
        newErrors.client_legalLastName = "This field can't be blank";
      if (!formData.clientInfo.dateOfBirth)
        newErrors.client_dateOfBirth = "This field can't be blank";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onUpdate({
        ...appointmentData,
        contactInfo: formData,
      });
      setCurrentStep(3);
    }
  };

  const renderPersonalInfoForm = (
    prefix: string,
    title: string,
    data: PersonalInfo,
    onChange: (field: string, value: string) => void,
  ) => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-gray-900">{title}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Legal first name
          </label>
          <Input
            className={
              errors[`${prefix}_legalFirstName`] ? "border-red-500" : ""
            }
            value={data.legalFirstName}
            onChange={(e) => onChange("legalFirstName", e.target.value)}
          />
          {errors[`${prefix}_legalFirstName`] && (
            <p className="text-xs text-red-500">
              {errors[`${prefix}_legalFirstName`]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Legal last name
          </label>
          <Input
            className={
              errors[`${prefix}_legalLastName`] ? "border-red-500" : ""
            }
            value={data.legalLastName}
            onChange={(e) => onChange("legalLastName", e.target.value)}
          />
          {errors[`${prefix}_legalLastName`] && (
            <p className="text-xs text-red-500">
              {errors[`${prefix}_legalLastName`]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Email</label>
          <Input
            className={errors[`${prefix}_email`] ? "border-red-500" : ""}
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
          {errors[`${prefix}_email`] && (
            <p className="text-xs text-red-500">{errors[`${prefix}_email`]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Phone</label>
          <Input
            className={errors[`${prefix}_phone`] ? "border-red-500" : ""}
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
          {errors[`${prefix}_phone`] && (
            <p className="text-xs text-red-500">{errors[`${prefix}_phone`]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          Date of birth
        </label>
        <Input
          type="date"
          className={`w-full ${errors[`${prefix}_dateOfBirth`] ? "border-red-500" : ""}`}
          value={data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : ""}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange("dateOfBirth", e.target.value)}
        />
        {errors[`${prefix}_dateOfBirth`] && (
          <p className="text-xs text-red-500">
            {errors[`${prefix}_dateOfBirth`]}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">
          Contact information
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          This will only be shared with the practice
        </p>
      </div>

      {/* Your Information */}
      {renderPersonalInfoForm("", "You", formData, handleInputChange)}

      {/* Payment Method */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          How do you plan to pay for care?
        </label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value) => handleInputChange("paymentMethod", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No answer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="self-pay">Self-pay</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partner Information */}
      {appointmentData.appointmentFor === "partner-and-me" &&
        formData.partnerInfo &&
        renderPersonalInfoForm(
          "partner",
          "Your Partner",
          formData.partnerInfo,
          handlePartnerInfoChange,
        )}

      {/* Client Information */}
      {appointmentData.appointmentFor === "someone-else" &&
        formData.clientInfo && (
          <>
            {renderPersonalInfoForm(
              "client",
              "Client",
              formData.clientInfo,
              handleClientInfoChange,
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-900">Is the client a minor?</p>
              <RadioGroup
                className="flex space-x-4"
                value={formData.clientInfo.isMinor ? "yes" : "no"}
                onValueChange={(value: string) =>
                  handleClientInfoChange("isMinor", value === "yes")
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="minor-yes" value="yes" />
                  <label className="text-sm font-medium" htmlFor="minor-yes">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="minor-no" value="no" />
                  <label className="text-sm font-medium" htmlFor="minor-no">
                    No
                  </label>
                </div>
              </RadioGroup>
            </div>
          </>
        )}

      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Appointment requests will be confirmed by the practice
        </p>
        <p className="text-xs text-gray-500">
          By requesting an appointment, you consent to being contacted by this
          practice or SimpleHealth via email, phone, voicemail, or text.
        </p>
        <p className="text-xs text-gray-500">
          By submitting this form, you agree to the processing of your sensitive
          personal information, which may include protected health information
          (PHI). This information may be viewed by team members in this
          practice.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          className="rounded-none bg-green-700 hover:bg-green-800"
          variant="default"
          onClick={handleSubmit}
        >
          REQUEST APPOINTMENT
        </Button>
      </div>
    </div>
  );
}
