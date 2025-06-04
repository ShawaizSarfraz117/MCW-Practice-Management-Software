/* eslint-disable max-lines-per-function */
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
  Checkbox,
} from "@mcw/ui";
import { useState, useEffect, useRef } from "react";
import statesUS from "@/(dashboard)/clients/services/statesUS.json";

interface Client {
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  date_of_birth: string;
  ClientContact?: Array<{
    id: string;
    contact_type: string;
    type: string;
    value: string;
    permission: string;
    is_primary: boolean;
  }>;
}

interface ClientData {
  name: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  voicePermission: boolean;
  textPermission: boolean;
  emailPermission: boolean;
  clientId: string;
  hasErrors: boolean;
}

interface ClientCardProps {
  client: Client;
  index: number;
  isFirstClient?: boolean;
  onDataChange?: (data: ClientData) => void;
}

const ClientCard = ({
  client,
  index,
  isFirstClient = false,
  onDataChange,
}: ClientCardProps) => {
  const [clientData, setClientData] = useState({
    name: `${client.legal_first_name} ${client.legal_last_name}`,
    dateOfBirth: client.date_of_birth.split("T")[0], // Format to YYYY-MM-DD
    address: "",
    city: "",
    state: "",
    zipCode: "",
    voicePermission: false,
    textPermission: false,
    emailPermission: false,
  });

  const [errors, setErrors] = useState({
    name: "",
    dateOfBirth: "",
  });

  // Use ref to store the latest callback to avoid infinite loops
  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;

  // Pass data back to parent when client data changes (excluding callback from dependencies)
  useEffect(() => {
    if (onDataChangeRef.current) {
      const hasErrors = !!(errors.name || errors.dateOfBirth);
      onDataChangeRef.current({
        ...clientData,
        clientId: client.id,
        hasErrors,
      });
    }
  }, [clientData, client.id, errors]);

  const validateName = (name: string) => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return "";
  };

  const validateDateOfBirth = (date: string) => {
    if (!date) {
      return "Date of birth is required";
    }

    const selectedDate = new Date(date);
    const today = new Date();

    if (selectedDate > today) {
      return "Date of birth cannot be in the future";
    }

    const age = today.getFullYear() - selectedDate.getFullYear();
    if (age > 150) {
      return "Please enter a valid date of birth";
    }

    return "";
  };

  const handleNameChange = (value: string) => {
    setClientData((prev) => ({ ...prev, name: value }));
    const nameError = validateName(value);
    setErrors((prev) => ({ ...prev, name: nameError }));
  };

  const handleDateChange = (value: string) => {
    setClientData((prev) => ({ ...prev, dateOfBirth: value }));
    const dobError = validateDateOfBirth(value);
    setErrors((prev) => ({ ...prev, dateOfBirth: dobError }));
  };

  const getPhoneContact = (contacts: Client["ClientContact"]) => {
    return (
      contacts?.find((contact) => contact.contact_type === "PHONE")?.value || ""
    );
  };

  const getEmailContact = (contacts: Client["ClientContact"]) => {
    return (
      contacts?.find((contact) => contact.contact_type === "EMAIL")?.value || ""
    );
  };

  const cardClassName = isFirstClient ? "w-full" : "w-full";
  const contentClassName = isFirstClient ? "space-y-4" : "space-y-4";
  const gridClassName = isFirstClient
    ? "space-y-4"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle>
          {isFirstClient ? "Client" : `Client ${index + 1}`}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>
        <div className={gridClassName}>
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <Input
              value={clientData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Date of birth *
            </label>
            <Input
              type="date"
              value={clientData.dateOfBirth}
              onChange={(e) => handleDateChange(e.target.value)}
              className={errors.dateOfBirth ? "border-red-500" : ""}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <Input
              placeholder="Enter address"
              value={clientData.address}
              onChange={(e) =>
                setClientData((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>

          {!isFirstClient && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input
                  placeholder="Enter city"
                  value={clientData.city}
                  onChange={(e) =>
                    setClientData((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Select
                  value={clientData.state}
                  onValueChange={(value) =>
                    setClientData((prev) => ({ ...prev, state: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {statesUS.map((state) => (
                      <SelectItem
                        key={state.abbreviation}
                        value={state.abbreviation}
                      >
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  ZIP code
                </label>
                <Input
                  placeholder="Enter ZIP"
                  value={clientData.zipCode}
                  onChange={(e) =>
                    setClientData((prev) => ({
                      ...prev,
                      zipCode: e.target.value,
                    }))
                  }
                />
              </div>
            </>
          )}
        </div>

        {isFirstClient && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input
                  placeholder="Enter city"
                  value={clientData.city}
                  onChange={(e) =>
                    setClientData((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <Select
                  value={clientData.state}
                  onValueChange={(value) =>
                    setClientData((prev) => ({ ...prev, state: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {statesUS.map((state) => (
                      <SelectItem
                        key={state.abbreviation}
                        value={state.abbreviation}
                      >
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ZIP code</label>
              <Input
                placeholder="Enter ZIP"
                className="w-32"
                value={clientData.zipCode}
                onChange={(e) =>
                  setClientData((prev) => ({
                    ...prev,
                    zipCode: e.target.value,
                  }))
                }
              />
            </div>
          </>
        )}

        <div
          className={
            isFirstClient ? "" : "grid grid-cols-1 md:grid-cols-2 gap-4"
          }
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact permission
            </label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`voice-${client.id}`}
                  checked={clientData.voicePermission}
                  onCheckedChange={(checked) =>
                    setClientData((prev) => ({
                      ...prev,
                      voicePermission: !!checked,
                    }))
                  }
                />
                <label htmlFor={`voice-${client.id}`} className="text-sm">
                  Voice message
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`text-${client.id}`}
                  checked={clientData.textPermission}
                  onCheckedChange={(checked) =>
                    setClientData((prev) => ({
                      ...prev,
                      textPermission: !!checked,
                    }))
                  }
                />
                <label htmlFor={`text-${client.id}`} className="text-sm">
                  Text message
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`email-${client.id}`}
                  checked={clientData.emailPermission}
                  onCheckedChange={(checked) =>
                    setClientData((prev) => ({
                      ...prev,
                      emailPermission: !!checked,
                    }))
                  }
                />
                <label htmlFor={`email-${client.id}`} className="text-sm">
                  Email
                </label>
              </div>
            </div>
          </div>
        </div>

        <div
          className={
            isFirstClient
              ? "grid grid-cols-2 gap-4"
              : "grid grid-cols-1 md:grid-cols-2 gap-4"
          }
        >
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input value={getPhoneContact(client.ClientContact)} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={getEmailContact(client.ClientContact)} readOnly />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
