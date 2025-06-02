import React from "react";
import {
  FormControl,
  FormItem,
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { getFieldStyles, FormField } from "./FormWrapper";
import statesUS from "@/(dashboard)/clients/services/statesUS.json";

interface StateSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  placeholder?: string;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  label,
  value,
  onChange,
  errors = [],
  placeholder = "Select a state",
}) => (
  <FormField errors={errors}>
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={getFieldStyles(errors.length > 0)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {statesUS.map((state) => (
              <SelectItem key={state.abbreviation} value={state.abbreviation}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
    </FormItem>
  </FormField>
);
