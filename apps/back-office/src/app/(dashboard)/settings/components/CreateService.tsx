"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { toast } from "../../../hooks/use-toast";

interface CreateServiceProps {
  setCreateServiceModel: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
}

const serviceFormSchema = z.object({
  service: z.string().min(1, "Service is required"),
  description: z.string().optional(),
  rate: z.string().min(1, "Rate is required"),
  duration: z.string().min(1, "Duration is required"),
  isDefault: z.boolean(),
  billInUnits: z.boolean(),
  availableOnline: z.boolean(),
  allowNewClients: z.boolean(),
  requireCall: z.boolean(),
  minutesBefore: z.string().optional(),
  minutesAfter: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export function CreateService({
  setCreateServiceModel,
  onSuccess,
}: CreateServiceProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      service: "",
      description: "",
      rate: "",
      duration: "",
      isDefault: false,
      billInUnits: false,
      availableOnline: false,
      allowNewClients: false,
      requireCall: false,
      minutesBefore: "",
      minutesAfter: "",
    },
  });

  async function onSubmit(data: ServiceFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      console.log(response, "response");

      if (!response.ok) {
        throw new Error("Failed to create service");
      }

      toast({
        title: "Success",
        description: "Service created successfully",
      });

      form.reset();
      setCreateServiceModel(false);
      onSuccess?.();
    } catch (error) {
      console.log(error, "error");
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-[50%]">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full p-[24px] flex flex-col gap-[32px] bg-[#F9FAFB] rounded-lg"
        >
          <div className="w-full flex justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-[#1F2937] leading-[24px]">
                Add New Services
              </h1>
            </div>
          </div>

          <div className="w-full flex justify-between">
            <div className="flex flex-col w-[48%]">
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-semibold text-[#374151]">
                      Service
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#ffffff] w-full mt-2">
                          <SelectValue placeholder="Select Service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12345">12345</SelectItem>
                        <SelectItem value="67890">67890</SelectItem>
                        <SelectItem value="14785">14785</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col w-[48%]">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-semibold text-[#374151]">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Description"
                        className="bg-[#ffffff] w-[full] mt-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="w-full flex justify-between items-center">
            <div className="flex flex-col w-[48%]">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-semibold text-[#374151]">
                      Rate
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Rate"
                        className="bg-[#ffffff] w-[full] mt-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="w-[48%]">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[14px] font-semibold text-[#374151]">
                      Default Duration
                    </FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input className="w-[80px] bg-[#ffffff]" {...field} />
                      </FormControl>
                      <span className="text-[14px] text-[#374151]">min</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isDefault"
                    />
                  </FormControl>
                  <FormLabel className="text-[14px] font-semibold text-[#374151]">
                    Make this the default service
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billInUnits"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="billInUnits"
                    />
                  </FormControl>
                  <FormLabel className="text-[14px] font-semibold text-[#374151]">
                    Bill this code in units
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-bold text-[#1F2937] leading-[18px]">
              Booking Options
            </h2>
            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="availableOnline"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="availableOnline"
                      />
                    </FormControl>
                    <FormLabel className="text-[14px] font-semibold text-[#374151]">
                      Available for online appointment requests
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowNewClients"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="allowNewClients"
                      />
                    </FormControl>
                    <FormLabel className="text-[14px] font-semibold text-[#374151]">
                      Allow for New Clients
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requireCall"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="requireCall"
                      />
                    </FormControl>
                    <FormLabel className="text-[14px] font-semibold text-[#374151]">
                      Require Clients to call to request available appointment
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#374151]">
                Block of
              </span>
              <FormField
                control={form.control}
                name="minutesBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input className="w-[64px] bg-[#ffffff]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span className="text-[14px] font-semibold text-[#374151]">
                minutes before and
              </span>
              <FormField
                control={form.control}
                name="minutesAfter"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input className="w-[64px] bg-[#ffffff]" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span className="text-[14px] font-semibold text-[#374151]">
                minutes after the appointment
              </span>
            </div>
          </div>

          <div className="flex w-full justify-end items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateServiceModel(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
