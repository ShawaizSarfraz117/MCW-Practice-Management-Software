"use client";

import { useEffect, useState } from "react";
import { differenceInDays, addDays, format } from "date-fns";
import { MapPin, X } from "lucide-react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent, DialogFooter } from "@mcw/ui";
import { Form, FormControl, FormField, FormItem } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { useForm } from "react-hook-form";
import { Tabs, TabsList, TabsTrigger } from "@mcw/ui";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@mcw/ui";
import { cn } from "@mcw/utils";
import { SearchSelect } from "@mcw/ui";
import { DatePicker } from "@mcw/ui";
import { TimePicker } from "@mcw/ui";
import { RecurringControl } from "./calendar/recurring-control";
import { Input } from "@mcw/ui";

const formSchema = z.object({
  type: z.enum(["appointment", "event", "out"]),
  eventName: z.string().optional(),
  clientType: z.enum(["individual", "group"]),
  client: z.string().optional(),
  clinician: z.string(),
  selectedServices: z.array(
    z.object({
      serviceId: z.string(),
      fee: z.number(),
    }),
  ),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string(),
  recurring: z.boolean(),
  allDay: z.boolean(),
  cancelAppointments: z.boolean().optional(),
  notifyClients: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Service = {
  id: string;
  name: string;
  fee: number;
};

const services: Service[] = [
  { id: "90834", name: "90834 Psychotherapy, 45 min", fee: 175 },
  { id: "90837", name: "90837 Psychotherapy, 60 min", fee: 200 },
  { id: "90846", name: "90846 Family Psychotherapy without Patient", fee: 175 },
  { id: "90847", name: "90847 Family Psychotherapy with Patient", fee: 175 },
];

const clinicians = [
  { label: "Almir Kazazic (You)", value: "almir" },
  { label: "Dr. John Smith", value: "john" },
  { label: "Dr. Sarah Jones", value: "sarah" },
];

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  selectedDate?: Date | null;
  selectedResource?: string | null;
  onCreateClient?: (date: string, time: string) => void;
  onDone?: () => void;
}

const clients = [
  { label: "Shawaiz SARFRAZPMA", value: "shawaiz" },
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
];

const locations = [
  { label: "Saint Petersburg McNulty Counseling and Wellness", value: "sp" },
  { label: "Tampa Office", value: "tampa" },
  { label: "Virtual Meeting", value: "virtual" },
];

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreateClient,
  onDone,
}: AppointmentDialogProps) {
  const [duration, setDuration] = useState<string>("50 mins");
  const [selectedServices, setSelectedServices] = useState<
    Array<{ serviceId: string; fee: number }>
  >([{ serviceId: "90834", fee: 175 }]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "appointment",
      eventName: "",
      clientType: "individual",
      client: "",
      clinician: "almir",
      selectedServices: [{ serviceId: "90834", fee: 175 }],
      startDate: selectedDate || new Date(),
      endDate: selectedDate ? addDays(selectedDate, 1) : addDays(new Date(), 1),
      startTime: "12:00 PM",
      endTime: "12:50 PM",
      location: "sp",
      recurring: false,
      allDay: false,
      cancelAppointments: true,
      notifyClients: true,
    },
  });

  const allDay = form.watch("allDay");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const selectedClient = form.watch("client");

  useEffect(() => {
    let duration = "";
    if (startDate && endDate) {
      if (allDay) {
        const days = differenceInDays(endDate, startDate);
        duration = `${days} day${days !== 1 ? "s" : ""}`;
      } else if (startTime && endTime) {
        // Parse times
        const [startTimeStr, startPeriod] = startTime.split(" ");
        const [endTimeStr, endPeriod] = endTime.split(" ");
        const [startHour, startMinute] = startTimeStr.split(":").map(Number);
        const [endHour, endMinute] = endTimeStr.split(":").map(Number);

        // Convert to 24-hour format
        let start24Hour = startHour;
        if (startPeriod === "PM" && startHour !== 12) start24Hour += 12;
        if (startPeriod === "AM" && startHour === 12) start24Hour = 0;

        let end24Hour = endHour;
        if (endPeriod === "PM" && endHour !== 12) end24Hour += 12;
        if (endPeriod === "AM" && endHour === 12) end24Hour = 0;

        // Calculate minutes
        const mins = (end24Hour - start24Hour) * 60 + (endMinute - startMinute);
        duration = `${mins} mins`;
      }
    }
    setDuration(duration || "0 mins");
  }, [startDate, endDate, startTime, endTime, allDay]);

  useEffect(() => {
    if (!open) {
      const type = form.getValues("type");
      if (type === "event") {
        form.reset({
          type: "event",
          eventName: "",
          clientType: "individual",
          client: "",
          selectedServices: [],
          startDate: selectedDate || new Date(),
          endDate: selectedDate
            ? addDays(selectedDate, 1)
            : addDays(new Date(), 1),
          startTime: "12:00 PM",
          endTime: "12:50 PM",
          location: "sp",
          recurring: false,
          allDay: false,
          cancelAppointments: false,
          notifyClients: false,
        });
        setSelectedServices([]);
      } else if (type === "appointment") {
        form.reset({
          type: "appointment",
          eventName: "",
          clientType: "individual",
          client: "",
          selectedServices: [{ serviceId: "90834", fee: 175 }],
          startDate: selectedDate || new Date(),
          endDate: selectedDate
            ? addDays(selectedDate, 1)
            : addDays(new Date(), 1),
          startTime: "12:00 PM",
          endTime: "12:50 PM",
          location: "sp",
          recurring: false,
          allDay: false,
          cancelAppointments: false,
          notifyClients: false,
        });
        setSelectedServices([{ serviceId: "90834", fee: 175 }]);
      } else if (type === "out") {
        form.reset({
          type: "out",
          eventName: "",
          clientType: "individual",
          client: "",
          selectedServices: [],
          startDate: selectedDate || new Date(),
          endDate: selectedDate
            ? addDays(selectedDate, 1)
            : addDays(new Date(), 1),
          startTime: "12:00 PM",
          endTime: "12:50 PM",
          location: "sp",
          recurring: false,
          allDay: false,
          cancelAppointments: true,
          notifyClients: true,
        });
        setSelectedServices([]);
      }
    }
  }, [open, selectedDate, form]);

  useEffect(() => {
    const type = form.watch("type");

    // Reset form to default values based on type
    if (type === "event") {
      form.reset({
        ...form.getValues(),
        type: "event",
        eventName: "",
        clientType: "individual",
        client: "",
        selectedServices: [],
        startDate: selectedDate || new Date(),
        endDate: selectedDate
          ? addDays(selectedDate, 1)
          : addDays(new Date(), 1),
        startTime: "12:00 PM",
        endTime: "12:50 PM",
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: false,
        notifyClients: false,
      });
      setSelectedServices([]);
    } else if (type === "appointment") {
      form.reset({
        ...form.getValues(),
        type: "appointment",
        eventName: "",
        clientType: "individual",
        client: "",
        selectedServices: [{ serviceId: "90834", fee: 175 }],
        startDate: selectedDate || new Date(),
        endDate: selectedDate
          ? addDays(selectedDate, 1)
          : addDays(new Date(), 1),
        startTime: "12:00 PM",
        endTime: "12:50 PM",
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: false,
        notifyClients: false,
      });
      setSelectedServices([{ serviceId: "90834", fee: 175 }]);
    } else if (type === "out") {
      form.reset({
        ...form.getValues(),
        type: "out",
        eventName: "",
        clientType: "individual",
        client: "",
        selectedServices: [],
        startDate: selectedDate || new Date(),
        endDate: selectedDate
          ? addDays(selectedDate, 1)
          : addDays(new Date(), 1),
        startTime: "12:00 PM",
        endTime: "12:50 PM",
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: true,
        notifyClients: true,
      });
      setSelectedServices([]);
    }
  }, [form, form.reset, form.watch, selectedDate]);

  function onSubmit(values: FormValues) {
    console.log(values);
    onOpenChange(false);
  }

  const addService = () => {
    setSelectedServices([
      ...selectedServices,
      { serviceId: "90834", fee: 175 },
    ]);
    form.setValue("selectedServices", [
      ...selectedServices,
      { serviceId: "90834", fee: 175 },
    ]);
  };

  const removeService = (index: number) => {
    const newServices = selectedServices.filter((_, i) => i !== index);
    setSelectedServices(newServices);
    form.setValue("selectedServices", newServices);
  };

  return (
    <Dialog
      modal={false}
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          const type = form.getValues("type");
          if (type === "event") {
            form.reset({
              type: "event",
              eventName: "",
              clientType: "individual",
              client: "",
              selectedServices: [],
              startDate: selectedDate || new Date(),
              endDate: selectedDate
                ? addDays(selectedDate, 1)
                : addDays(new Date(), 1),
              startTime: "12:00 PM",
              endTime: "12:50 PM",
              location: "sp",
              recurring: false,
              allDay: false,
              cancelAppointments: false,
              notifyClients: false,
            });
            setSelectedServices([]);
          } else if (type === "appointment") {
            form.reset({
              type: "appointment",
              eventName: "",
              clientType: "individual",
              client: "",
              selectedServices: [{ serviceId: "90834", fee: 175 }],
              startDate: selectedDate || new Date(),
              endDate: selectedDate
                ? addDays(selectedDate, 1)
                : addDays(new Date(), 1),
              startTime: "12:00 PM",
              endTime: "12:50 PM",
              location: "sp",
              recurring: false,
              allDay: false,
              cancelAppointments: false,
              notifyClients: false,
            });
            setSelectedServices([{ serviceId: "90834", fee: 175 }]);
          } else if (type === "out") {
            form.reset({
              type: "out",
              eventName: "",
              clientType: "individual",
              client: "",
              selectedServices: [],
              startDate: selectedDate || new Date(),
              endDate: selectedDate
                ? addDays(selectedDate, 1)
                : addDays(new Date(), 1),
              startTime: "12:00 PM",
              endTime: "12:50 PM",
              location: "sp",
              recurring: false,
              allDay: false,
              cancelAppointments: true,
              notifyClients: true,
            });
            setSelectedServices([]);
          }
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="p-0 gap-0 w-[464px] max-h-[90vh] overflow-auto rounded-none">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tabs
                      className="w-full"
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <TabsList className="h-12 w-full rounded-none bg-transparent p-0 border-b">
                        <TabsTrigger
                          className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                          value="appointment"
                        >
                          Appointment
                        </TabsTrigger>
                        <TabsTrigger
                          className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                          value="event"
                        >
                          Event
                        </TabsTrigger>
                        <TabsTrigger
                          className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                          value="out"
                        >
                          Out of office
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="px-6 space-y-4">
              {form.watch("type") === "event" ? (
                // Event Form Content
                <>
                  <FormField
                    control={form.control}
                    name="eventName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            className="rounded-none border-gray-200"
                            placeholder="Event name (optional)"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <h2 className="text-sm mb-4">Appointment details</h2>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="allDay"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1">
                              All day
                            </label>
                          </FormItem>
                        )}
                      />

                      {allDay ? (
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <DatePicker
                                    className="border-gray-200"
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <DatePicker
                                      className="border-gray-200"
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                      {differenceInDays(
                                        endDate || new Date(),
                                        startDate || new Date(),
                                      )}{" "}
                                      days
                                    </span>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <DatePicker
                                    className="border-gray-200"
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                              <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <TimePicker
                                        className="border-gray-200"
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <TimePicker
                                        className="border-gray-200"
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {duration}
                            </span>
                          </div>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="clinician"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SearchSelect
                                className="border-gray-200"
                                options={clinicians}
                                placeholder="Team member"
                                value={field.value}
                                onValueChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SearchSelect
                                className="border-gray-200"
                                icon={
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                }
                                options={locations}
                                placeholder="Location"
                                value={field.value}
                                onValueChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recurring"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1">
                              Recurring
                            </label>
                          </FormItem>
                        )}
                      />

                      <RecurringControl
                        open={open}
                        startDate={form.watch("startDate") || new Date()}
                        visible={form.watch("recurring")}
                        onRecurringChange={(recurringValues) => {
                          console.log("Recurring values:", recurringValues);
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : form.watch("type") === "out" ? (
                // Out of Office Form Content
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="allDay"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1">
                          All day
                        </label>
                      </FormItem>
                    )}
                  />

                  {allDay ? (
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <DatePicker
                                className="border-gray-200"
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <DatePicker
                                  className="border-gray-200"
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {differenceInDays(
                                    endDate || new Date(),
                                    startDate || new Date(),
                                  )}{" "}
                                  days
                                </span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <DatePicker
                                className="border-gray-200"
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                          <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <TimePicker
                                    className="border-gray-200"
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <TimePicker
                                    className="border-gray-200"
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {duration}
                        </span>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="clinician"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SearchSelect
                            className="border-gray-200"
                            options={clinicians}
                            placeholder="Team member"
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cancelAppointments"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1">
                          Cancel appointments during this time
                        </label>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notifyClients"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1">
                          Notify clients and contacts of cancellation
                        </label>
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                // Original Appointment Form Content
                <>
                  <FormField
                    control={form.control}
                    name="clientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex gap-2">
                            <button
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-none border text-sm font-normal flex-1 whitespace-nowrap",
                                field.value === "individual"
                                  ? "border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]"
                                  : "border-gray-200 hover:bg-gray-50",
                              )}
                              type="button"
                              onClick={() => field.onChange("individual")}
                            >
                              <div className="flex -space-x-2">
                                <Avatar className="h-5 w-5 border-2 border-background">
                                  <AvatarImage src="/placeholder.svg" />
                                  <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-5 w-5 border-2 border-background">
                                  <AvatarImage src="/placeholder.svg" />
                                  <AvatarFallback>B</AvatarFallback>
                                </Avatar>
                              </div>
                              Individual or couple
                            </button>
                            <button
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-none border text-sm font-normal flex-1 whitespace-nowrap",
                                field.value === "group"
                                  ? "border-[#16A34A] bg-[#16A34A]/5 text-[#16A34A]"
                                  : "border-gray-200 hover:bg-gray-50",
                              )}
                              type="button"
                              onClick={() => field.onChange("group")}
                            >
                              <div className="flex -space-x-2">
                                <Avatar className="h-5 w-5 border-2 border-background">
                                  <AvatarImage src="/placeholder.svg" />
                                  <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-5 w-5 border-2 border-background">
                                  <AvatarImage src="/placeholder.svg" />
                                  <AvatarFallback>B</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-5 w-5 border-2 border-background">
                                  <AvatarImage src="/placeholder.svg" />
                                  <AvatarFallback>C</AvatarFallback>
                                </Avatar>
                              </div>
                              Group
                            </button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-4">
                    <FormField
                      control={form.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <SearchSelect
                              className="border-gray-200"
                              options={clients}
                              placeholder="Search Client"
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <button
                      className="text-sm font-medium text-[#16A34A] hover:text-[#16A34A]/90 whitespace-nowrap"
                      type="button"
                      onClick={() => {
                        const formattedDate = selectedDate
                          ? format(selectedDate, "MMMM d, yyyy")
                          : "";
                        const formattedTime =
                          form.getValues("startTime") || "12:00 PM";
                        onCreateClient?.(formattedDate, formattedTime);
                      }}
                    >
                      + Create client
                    </button>
                  </div>

                  <div>
                    <h2 className="text-sm mb-4">Appointment details</h2>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="allDay"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1">
                              All day
                            </label>
                          </FormItem>
                        )}
                      />

                      {allDay ? (
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <DatePicker
                                    className="border-gray-200"
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <DatePicker
                                      className="border-gray-200"
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                      {differenceInDays(
                                        endDate || new Date(),
                                        startDate || new Date(),
                                      )}{" "}
                                      days
                                    </span>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <DatePicker
                                    className="border-gray-200"
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center flex-1">
                              <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <TimePicker
                                        className="border-gray-200"
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <TimePicker
                                        className="border-gray-200"
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {duration}
                            </span>
                          </div>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="recurring"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                className="data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] mt-0.5"
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 !mt-1">
                              Recurring
                            </label>
                          </FormItem>
                        )}
                      />

                      <RecurringControl
                        open={open}
                        startDate={form.watch("startDate") || new Date()}
                        visible={form.watch("recurring")}
                        onRecurringChange={(recurringValues) => {
                          // Store recurring values in form state if needed
                          console.log("Recurring values:", recurringValues);
                        }}
                      />

                      {selectedClient && (
                        <>
                          <FormField
                            control={form.control}
                            name="clinician"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <SearchSelect
                                    className="border-gray-200"
                                    options={clinicians}
                                    placeholder="Select Clinician"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SearchSelect
                                className="border-gray-200"
                                icon={
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                }
                                options={locations}
                                placeholder="Search Location"
                                value={field.value}
                                onValueChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {selectedClient && (
                    <>
                      <div>
                        <h2 className="text-sm mb-4">
                          Add services and modifiers
                        </h2>
                        <div className="space-y-4">
                          {selectedServices.map((service, index) => (
                            <div key={index} className="flex gap-4">
                              <div className="flex-1">
                                <SearchSelect
                                  className="border-gray-200"
                                  options={services.map((s) => ({
                                    label: s.name,
                                    value: s.id,
                                  }))}
                                  placeholder="Select Service"
                                  value={service.serviceId}
                                  onValueChange={(value) => {
                                    const newServices = [...selectedServices];
                                    newServices[index] = {
                                      serviceId: value,
                                      fee:
                                        services.find((s) => s.id === value)
                                          ?.fee || 175,
                                    };
                                    setSelectedServices(newServices);
                                    form.setValue(
                                      "selectedServices",
                                      newServices,
                                    );
                                  }}
                                />
                                <div className="flex justify-end mt-2">
                                  <div className="w-32">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-gray-500">Fee</span>
                                      <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                          $
                                        </span>
                                        <input
                                          className="w-full rounded-none border border-gray-200 py-2 pl-8 pr-3 text-sm"
                                          type="number"
                                          value={service.fee}
                                          onChange={(e) => {
                                            const newServices = [
                                              ...selectedServices,
                                            ];
                                            newServices[index] = {
                                              ...service,
                                              fee:
                                                Number.parseInt(
                                                  e.target.value,
                                                ) || 0,
                                            };
                                            setSelectedServices(newServices);
                                            form.setValue(
                                              "selectedServices",
                                              newServices,
                                            );
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {selectedServices.length > 1 && (
                                <Button
                                  className="h-9 w-9"
                                  size="icon"
                                  type="button"
                                  variant="ghost"
                                  onClick={() => removeService(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <button
                            className="text-sm font-medium text-[#16A34A] hover:text-[#16A34A]/90"
                            type="button"
                            onClick={addService}
                          >
                            + Add service
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex justify-between text-sm">
                          <span>Billing Type</span>
                          <span>Self-pay</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Appointment Total</span>
                          <span>
                            $
                            {selectedServices.reduce(
                              (sum, service) => sum + service.fee,
                              0,
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t">
              <Button
                className="h-9 px-4 rounded-none hover:bg-transparent"
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-9 px-4 bg-[#16A34A] hover:bg-[#16A34A]/90 rounded-none"
                type="submit"
                onClick={onDone}
              >
                Done
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
