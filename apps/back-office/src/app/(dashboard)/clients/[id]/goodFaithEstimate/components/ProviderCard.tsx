"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { useState, useEffect, useRef } from "react";

interface Clinician {
  id: string;
  first_name: string;
  last_name: string;
  NPI_number: string | null;
  address: string;
}

interface Location {
  id: string;
  name: string;
}

interface ProviderData {
  name: string;
  npi: string;
  tin: string;
  location: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  hasErrors: boolean;
}

interface ProviderCardProps {
  clinician: Clinician;
  locations: Location[];
  onDataChange?: (data: ProviderData) => void;
}

const ProviderCard = ({
  clinician,
  locations,
  onDataChange,
}: ProviderCardProps) => {
  const [providerData, setProviderData] = useState({
    name: `${clinician.first_name} ${clinician.last_name}`,
    npi: clinician.NPI_number || "",
    tin: "",
    location: "",
    address: clinician.address || "",
    contactPerson: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState({
    npi: "",
    tin: "",
  });

  // Use ref to store the latest callback to avoid infinite loops
  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;

  // Validate NPI and TIN on component mount
  useEffect(() => {
    const initialNPIError = validateNPI(clinician.NPI_number || "");
    const initialTINError = validateTIN("");

    setErrors({
      npi: initialNPIError,
      tin: initialTINError,
    });
  }, []);

  // Pass data back to parent when provider data changes (excluding callback from dependencies)
  useEffect(() => {
    if (onDataChangeRef.current) {
      const hasErrors = !!(errors.npi || errors.tin);
      onDataChangeRef.current({ ...providerData, hasErrors });
    }
  }, [providerData, errors]);

  const validateNPI = (npi: string) => {
    if (!npi.trim()) {
      return "NPI is required";
    }

    // Remove spaces for validation
    const cleanNPI = npi.replace(/\s/g, "");

    if (!/^\d{10}$/.test(cleanNPI)) {
      return "NPI must be exactly 10 digits";
    }

    return "";
  };

  const validateTIN = (tin: string) => {
    if (!tin.trim()) {
      return "TIN is required";
    }

    // Remove hyphens for validation
    const cleanTIN = tin.replace(/-/g, "");

    if (!/^\d{9}$/.test(cleanTIN)) {
      return "TIN must be exactly 9 digits";
    }

    return "";
  };

  const handleNPIChange = (value: string) => {
    // Format NPI with spaces for better readability
    const formatted = value
      .replace(/\D/g, "")
      .replace(/(\d{4})(\d{4})(\d{2})/, "$1 $2 $3")
      .substr(0, 12);
    setProviderData((prev) => ({ ...prev, npi: formatted }));

    const npiError = validateNPI(formatted);
    setErrors((prev) => ({ ...prev, npi: npiError }));
  };

  const handleTINChange = (value: string) => {
    // Format TIN with hyphen for better readability
    const formatted = value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d{7})/, "$1-$2")
      .substr(0, 10);
    setProviderData((prev) => ({ ...prev, tin: formatted }));

    const tinError = validateTIN(formatted);
    setErrors((prev) => ({ ...prev, tin: tinError }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Provider</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={providerData.name}
              onChange={(e) =>
                setProviderData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">NPI *</label>
              <Input
                value={providerData.npi}
                onChange={(e) => handleNPIChange(e.target.value)}
                placeholder="1234 5678 90"
                className={errors.npi ? "border-red-500" : ""}
              />
              {errors.npi && (
                <p className="text-red-500 text-xs mt-1">{errors.npi}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TIN *</label>
              <Input
                value={providerData.tin}
                onChange={(e) => handleTINChange(e.target.value)}
                placeholder="12-3456789"
                className={errors.tin ? "border-red-500" : ""}
              />
              {errors.tin && (
                <p className="text-red-500 text-xs mt-1">{errors.tin}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <Select
              value={providerData.location}
              onValueChange={(value) =>
                setProviderData((prev) => ({ ...prev, location: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              value={providerData.address}
              onChange={(e) =>
                setProviderData((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Contact person
            </label>
            <Select
              value={providerData.contactPerson}
              onValueChange={(value) =>
                setProviderData((prev) => ({ ...prev, contactPerson: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="secretary">Secretary</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={providerData.phone}
                onChange={(e) =>
                  setProviderData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Enter phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={providerData.email}
                onChange={(e) =>
                  setProviderData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Enter email"
                type="email"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;
