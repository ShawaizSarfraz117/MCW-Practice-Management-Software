import { NextResponse, NextRequest } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { DAY_CODE_TO_INDEX } from "@/utils/appointment-helpers";

/**
 * Availability API Route
 *
 * Note: This API uses only start_date and end_date fields which contain both date and time information.
 * The database schema has been updated to remove the redundant start_time/end_time fields.
 */

// Validation schema for availability
const availabilitySchema = z.object({
  title: z.string().optional(),
  clinician_id: z.string().uuid(),
  allow_online_requests: z.boolean().default(false),
  location_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_recurring: z.boolean().default(false),
  recurring_rule: z.string().optional().nullable(),
});

async function isAuthenticated(request: NextRequest) {
  // @ts-expect-error - nextauth property may be added by tests
  if (request.nextauth?.token) {
    return true;
  }

  try {
    const session = await getServerSession(backofficeAuthOptions);
    return !!session?.user;
  } catch (_error) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const services = searchParams.get("services");
    const body = await request.json();

    // If ID and services=true, add service to availability
    if (id && services === "true") {
      const { serviceId } = body;

      if (!serviceId) {
        return NextResponse.json(
          { error: "Service ID is required" },
          { status: 400 },
        );
      }

      // Validate that the availability exists
      const availability = await prisma.availability.findUnique({
        where: { id },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      // Validate that the service exists
      const service = await prisma.practiceService.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 },
        );
      }

      // Check if the relationship already exists
      const existingRelation = await prisma.availabilityServices.findUnique({
        where: {
          availability_id_service_id: {
            availability_id: id,
            service_id: serviceId,
          },
        },
      });

      if (existingRelation) {
        return NextResponse.json(
          { error: "Service already assigned to availability" },
          { status: 409 },
        );
      }

      // Create the availability-service relationship
      const availabilityService = await prisma.availabilityServices.create({
        data: {
          availability_id: id,
          service_id: serviceId,
        },
        include: {
          PracticeService: true,
        },
      });

      return NextResponse.json(
        {
          message: "Service added to availability successfully",
          service: {
            id: availabilityService.PracticeService.id,
            type: availabilityService.PracticeService.type,
            code: availabilityService.PracticeService.code,
            description: availabilityService.PracticeService.description,
            duration: availabilityService.PracticeService.duration,
            rate: availabilityService.PracticeService.rate,
            availableOnline:
              availabilityService.PracticeService.available_online,
          },
        },
        { status: 201 },
      );
    }

    // Otherwise, create new availability
    const validatedData = availabilitySchema.parse(body);

    // Convert string dates to Date objects and prepare data
    const data: Prisma.AvailabilityUncheckedCreateInput = {
      clinician_id: validatedData.clinician_id,
      title: validatedData.title || "",
      allow_online_requests: validatedData.allow_online_requests,
      location_id: validatedData.location_id,
      start_date: new Date(validatedData.start_date),
      end_date: new Date(validatedData.end_date),
      is_recurring: validatedData.is_recurring,
      recurring_rule: validatedData.recurring_rule || null,
    };

    // Use a transaction to create availability and add services
    const result = await prisma.$transaction(async (tx) => {
      // Create the master availability
      const masterAvailability = await tx.availability.create({
        data,
        select: {
          id: true,
          clinician_id: true,
          title: true,
          start_date: true,
          end_date: true,
          location_id: true,
          allow_online_requests: true,
          is_recurring: true,
          recurring_rule: true,
          recurring_availability_id: true,
          created_at: true,
          updated_at: true,
        },
      });

      // List to store all created availabilities
      const allAvailabilities = [masterAvailability];

      // If this is a recurring availability, create multiple instances
      if (data.is_recurring && data.recurring_rule) {
        const recurringRule = data.recurring_rule;

        // Parse the recurring rule
        const ruleParts = recurringRule.split(";").reduce(
          (acc, part) => {
            const [key, value] = part.split("=");
            if (key && value) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, string>,
        );

        // Handle both 'WEEK' and 'WEEKLY' for backwards compatibility
        let freq = ruleParts.FREQ || "WEEKLY";
        freq = freq.toUpperCase();
        if (freq === "WEEK") freq = "WEEKLY";
        if (freq === "MONTH") freq = "MONTHLY";
        if (freq === "YEAR") freq = "YEARLY";

        const interval = parseInt(ruleParts.INTERVAL || "1");
        // Only use COUNT if it's explicitly set, otherwise 0 for unlimited (until UNTIL date)
        const count = ruleParts.COUNT ? parseInt(ruleParts.COUNT) : 0;
        const byDay = ruleParts.BYDAY?.split(",") || [];
        const until = ruleParts.UNTIL;

        // For weekly recurrence with specific days
        if (freq === "WEEKLY" && byDay.length > 0) {
          const startDate = new Date(data.start_date!);
          const endDate = new Date(data.end_date!);
          const duration = endDate.getTime() - startDate.getTime();

          // Get the day of the week for the start date
          const startDayOfWeek = startDate.getDay();

          // Calculate the start of the current week (Sunday)
          const startOfWeek = new Date(startDate);
          startOfWeek.setDate(startDate.getDate() - startDayOfWeek);

          // Count how many child availabilities we've created (excluding master)
          let createdCount = 0;

          // Check if the master availability's day matches any of the selected days
          let masterMatchesSelectedDays = false;
          for (const dayCode of byDay) {
            const dayIndex = DAY_CODE_TO_INDEX[dayCode.toUpperCase().trim()];
            if (dayIndex === startDayOfWeek) {
              masterMatchesSelectedDays = true;
              break;
            }
          }

          // If master doesn't match selected days, we'll need to exclude it later
          if (!masterMatchesSelectedDays) {
            // Master doesn't match selected days
          }

          // Create availabilities for each specified day for several weeks
          // For "never" end type (no count or until), create 104 weeks (2 years) of availabilities
          const maxWeeks =
            count > 0 ? Math.ceil(count / byDay.length) : until ? 52 : 104;
          for (let week = 0; week < maxWeeks; week++) {
            // For each day specified in BYDAY
            for (const dayCode of byDay) {
              // Skip if we've reached the maximum count
              // If master doesn't match selected days, we need full count, otherwise count - 1
              const targetCount = masterMatchesSelectedDays ? count - 1 : count;
              if (count > 0 && createdCount >= targetCount) break;

              const dayIndex = DAY_CODE_TO_INDEX[dayCode.toUpperCase().trim()];
              if (dayIndex === undefined) {
                continue; // Invalid day code
              }

              // Calculate the date for this availability
              const availabilityDate = new Date(startOfWeek);
              availabilityDate.setDate(
                startOfWeek.getDate() + dayIndex + week * 7 * interval,
              );

              // Skip if this date is before the start date
              if (availabilityDate < startDate) {
                continue;
              }

              // Skip if this is exactly the same as the master availability's date
              if (
                availabilityDate.toISOString().split("T")[0] ===
                  startDate.toISOString().split("T")[0] &&
                dayIndex === startDayOfWeek &&
                week === 0
              ) {
                continue;
              }

              // If UNTIL is specified, check if we've passed the end date
              if (until) {
                // Handle both YYYYMMDD and YYYYMMDDTHHMMSSZ formats
                let untilDate: Date;
                if (until.includes("T")) {
                  // Full datetime format (e.g., 20240131T235959Z)
                  // Parse the full ISO format to preserve timezone
                  const year = until.slice(0, 4);
                  const month = until.slice(4, 6);
                  const day = until.slice(6, 8);
                  const hour = until.slice(9, 11);
                  const minute = until.slice(11, 13);
                  const second = until.slice(13, 15);
                  untilDate = new Date(
                    `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
                  );
                } else {
                  // Simple date format (e.g., 20240131)
                  // Set to end of day in UTC to match RRULE spec
                  untilDate = new Date(
                    `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}T23:59:59Z`,
                  );
                }
                if (availabilityDate > untilDate) {
                  break;
                }
              }

              // Calculate end date for this occurrence
              const availabilityEndDate = new Date(
                availabilityDate.getTime() + duration,
              );

              // Create the recurring availability instance
              try {
                const recurringAvailability = await tx.availability.create({
                  data: {
                    ...data,
                    start_date: availabilityDate,
                    end_date: availabilityEndDate,
                    recurring_availability_id: masterAvailability.id,
                  },
                  select: {
                    id: true,
                    clinician_id: true,
                    title: true,
                    start_date: true,
                    end_date: true,
                    location_id: true,
                    allow_online_requests: true,
                    is_recurring: true,
                    recurring_rule: true,
                    recurring_availability_id: true,
                    created_at: true,
                    updated_at: true,
                  },
                });

                allAvailabilities.push(recurringAvailability);
                createdCount++;
              } catch (_error) {
                // Continue with next date instead of failing completely
              }
            }

            // Break outer loop if we've created enough or passed until date
            const targetCount = masterMatchesSelectedDays ? count - 1 : count;
            if (count > 0 && createdCount >= targetCount) break;

            // Also break if we have an until date and all days in this week would be past it
            if (until) {
              // Calculate the last day of this week to check
              const lastDayOfWeek = new Date(startOfWeek);
              lastDayOfWeek.setDate(
                startOfWeek.getDate() + 6 + week * 7 * interval,
              );

              // Parse until date
              let untilDate: Date;
              if (until.includes("T")) {
                // Full datetime format (e.g., 20240131T235959Z)
                // Parse the full ISO format to preserve timezone
                const year = until.slice(0, 4);
                const month = until.slice(4, 6);
                const day = until.slice(6, 8);
                const hour = until.slice(9, 11);
                const minute = until.slice(11, 13);
                const second = until.slice(13, 15);
                untilDate = new Date(
                  `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
                );
              } else {
                // Simple date format (e.g., 20240131)
                // Set to end of day in UTC to match RRULE spec
                untilDate = new Date(
                  `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}T23:59:59Z`,
                );
              }

              if (lastDayOfWeek > untilDate) {
                break;
              }
            }
          }
        }
        // For monthly and yearly recurrence
        else if (freq === "MONTHLY" || freq === "YEARLY") {
          const startDate = new Date(data.start_date!);
          const endDate = new Date(data.end_date!);

          // Determine max iterations based on end type
          let maxIterations: number;
          if (count > 0) {
            maxIterations = count - 1; // Subtract 1 because master already exists
          } else if (until) {
            // Calculate based on until date
            maxIterations = freq === "MONTHLY" ? 24 : 5; // 2 years for monthly, 5 years for yearly
          } else {
            // "never" case - create reasonable amount
            maxIterations = freq === "MONTHLY" ? 24 : 5; // 2 years for monthly, 5 years for yearly
          }

          // Parse until date if specified
          let untilDate: Date | null = null;
          if (until) {
            // Handle both YYYYMMDD and YYYYMMDDTHHMMSSZ formats
            if (until.includes("T")) {
              const dateOnly = until.slice(0, 8);
              untilDate = new Date(
                `${dateOnly.slice(0, 4)}-${dateOnly.slice(4, 6)}-${dateOnly.slice(6, 8)}`,
              );
            } else {
              untilDate = new Date(
                `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`,
              );
            }
          }

          for (let i = 1; i <= maxIterations; i++) {
            const newStartDate = new Date(startDate);
            const newEndDate = new Date(endDate);

            if (freq === "MONTHLY") {
              newStartDate.setMonth(startDate.getMonth() + i * interval);
              newEndDate.setMonth(endDate.getMonth() + i * interval);
            } else {
              newStartDate.setFullYear(startDate.getFullYear() + i * interval);
              newEndDate.setFullYear(endDate.getFullYear() + i * interval);
            }

            // Check if we've passed the until date
            if (untilDate && newStartDate > untilDate) {
              break;
            }

            // Create the recurring availability instance
            const recurringAvailability = await tx.availability.create({
              data: {
                ...data,
                start_date: newStartDate,
                end_date: newEndDate,
                recurring_availability_id: masterAvailability.id,
              },
              select: {
                id: true,
                clinician_id: true,
                title: true,
                start_date: true,
                end_date: true,
                location_id: true,
                allow_online_requests: true,
                is_recurring: true,
                recurring_rule: true,
                recurring_availability_id: true,
                created_at: true,
                updated_at: true,
              },
            });

            allAvailabilities.push(recurringAvailability);
          }
        }

        // For weekly recurring with specific days, remove master if it doesn't match selected days
        if (freq === "WEEKLY" && byDay.length > 0) {
          const startDate = new Date(data.start_date!);
          const startDayOfWeek = startDate.getDay();

          let masterMatchesSelectedDays = false;
          for (const dayCode of byDay) {
            const dayIndex = DAY_CODE_TO_INDEX[dayCode.toUpperCase().trim()];
            if (dayIndex === startDayOfWeek) {
              masterMatchesSelectedDays = true;
              break;
            }
          }

          if (!masterMatchesSelectedDays) {
            // Remove the master availability from the list (but keep in DB for foreign key integrity)
            const masterIndex = allAvailabilities.findIndex(
              (a) => a.id === masterAvailability.id,
            );
            if (masterIndex > -1) {
              allAvailabilities.splice(masterIndex, 1);
            }
          }
        }
      }

      // Now add services to all created availabilities
      const availabilityIds = allAvailabilities.map((a) => a.id);

      // Check if custom services are provided
      if (body.selectedServices && Array.isArray(body.selectedServices)) {
        // Use the services selected by the user
        const selectedServiceIds = body.selectedServices;

        if (selectedServiceIds.length > 0) {
          // Create services for all availabilities
          const availabilityServicesData = availabilityIds.flatMap(
            (availabilityId) =>
              selectedServiceIds.map((serviceId: string) => ({
                availability_id: availabilityId,
                service_id: serviceId,
              })),
          );

          await tx.availabilityServices.createMany({
            data: availabilityServicesData,
          });
        }

        return {
          availabilities: allAvailabilities,
          servicesAdded: selectedServiceIds.length * allAvailabilities.length,
          totalCreated: allAvailabilities.length,
        };
      } else {
        // Fallback to original logic if no custom services provided
        // Get all active online services for the clinician
        const clinicianServices = await tx.clinicianServices.findMany({
          where: {
            clinician_id: validatedData.clinician_id,
            is_active: true,
          },
          include: {
            PracticeService: true,
          },
        });

        // Filter for services that are available online
        const onlineServices = clinicianServices.filter(
          (cs) => cs.PracticeService.available_online === true,
        );

        // Create availability-service relationships for all online services
        if (onlineServices.length > 0) {
          const availabilityServicesData = availabilityIds.flatMap(
            (availabilityId) =>
              onlineServices.map((cs) => ({
                availability_id: availabilityId,
                service_id: cs.service_id,
              })),
          );

          await tx.availabilityServices.createMany({
            data: availabilityServicesData,
          });
        }

        return {
          availabilities: allAvailabilities,
          servicesAdded: onlineServices.length * allAvailabilities.length,
          totalCreated: allAvailabilities.length,
        };
      }
    });

    // For backward compatibility with tests, return single availability if only one was created
    if (result.totalCreated === 1) {
      return NextResponse.json(result.availabilities[0]);
    }

    return NextResponse.json({
      availabilities: result.availabilities,
      servicesAdded: result.servicesAdded,
      totalCreated: result.totalCreated,
      message: `Successfully created ${result.totalCreated} availability${result.totalCreated > 1 ? " instances" : ""}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clinicianId = searchParams.get("clinicianId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const services = searchParams.get("services");

    // If ID is provided and services=true, return availability services
    if (id && services === "true") {
      const availability = await prisma.availability.findUnique({
        where: { id },
        select: {
          id: true,
          clinician_id: true,
          title: true,
          start_date: true,
          end_date: true,
          location_id: true,
          allow_online_requests: true,
          is_recurring: true,
          recurring_rule: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      // Get availability services with detailed information
      const availabilityServices = await prisma.availabilityServices.findMany({
        where: { availability_id: id },
        include: {
          PracticeService: true,
        },
        orderBy: {
          PracticeService: {
            type: "asc",
          },
        },
      });

      // Transform the data to include service details
      const servicesData = availabilityServices.map((as) => ({
        id: as.PracticeService.id,
        type: as.PracticeService.type,
        code: as.PracticeService.code,
        description: as.PracticeService.description,
        duration: as.PracticeService.duration,
        rate: as.PracticeService.rate,
        color: as.PracticeService.color,
        isDefault: as.PracticeService.is_default,
        billInUnits: as.PracticeService.bill_in_units,
        availableOnline: as.PracticeService.available_online,
        allowNewClients: as.PracticeService.allow_new_clients,
        requireCall: as.PracticeService.require_call,
        blockBefore: as.PracticeService.block_before,
        blockAfter: as.PracticeService.block_after,
      }));

      return NextResponse.json({
        availabilityId: id,
        services: servicesData,
        totalCount: servicesData.length,
      });
    }

    // If ID is provided, return single availability
    if (id) {
      const availability = await prisma.availability.findUnique({
        where: { id },
        select: {
          id: true,
          clinician_id: true,
          title: true,
          start_date: true,
          end_date: true,
          location_id: true,
          allow_online_requests: true,
          is_recurring: true,
          recurring_rule: true,
          created_at: true,
          updated_at: true,
          Location: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          Clinician: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(availability);
    }

    // Otherwise, handle filtering logic for multiple availabilities
    const where: Prisma.AvailabilityWhereInput = {};

    if (clinicianId) {
      where.clinician_id = clinicianId;
    }

    if (startDate && endDate) {
      // Ensure AND condition is added, not overwriting
      if (!where.AND) {
        where.AND = [];
      }
      // Push date range conditions into the AND array
      (where.AND as Prisma.AvailabilityWhereInput[]).push(
        { start_date: { gte: new Date(startDate) } },
        { end_date: { lte: new Date(endDate) } },
      );
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: { start_date: "asc" },
      select: {
        id: true,
        clinician_id: true,
        title: true,
        start_date: true,
        end_date: true,
        location_id: true,
        allow_online_requests: true,
        is_recurring: true,
        recurring_rule: true,
        recurring_availability_id: true,
        created_at: true,
        updated_at: true,
        Location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        Clinician: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Filter out master availabilities that don't match their recurring pattern
    const filteredAvailabilities = availabilities.filter((availability) => {
      // If it's not recurring, include it
      if (!availability.is_recurring || !availability.recurring_rule) {
        return true;
      }

      // If it has a recurring_availability_id, it's a child - include it
      if (availability.recurring_availability_id) {
        return true;
      }

      // It's a master availability - check if it matches the recurring pattern
      const recurringRule = availability.recurring_rule;
      const byDayMatch = recurringRule.match(/BYDAY=([^;]+)/);

      if (byDayMatch) {
        const selectedDays = byDayMatch[1].split(",");
        const availabilityDayOfWeek = new Date(
          availability.start_date,
        ).getDay();

        // Check if the availability's day matches any selected day
        for (const dayCode of selectedDays) {
          const dayIndex = DAY_CODE_TO_INDEX[dayCode.toUpperCase().trim()];
          if (dayIndex === availabilityDayOfWeek) {
            return true; // Master matches pattern - include it
          }
        }

        // Master doesn't match pattern - exclude it
        return false;
      }

      // No BYDAY rule - include it
      return true;
    });

    return NextResponse.json(filteredAvailabilities);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const editOption = searchParams.get("editOption"); // 'single', 'future', or 'all'

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const validatedData = availabilitySchema.partial().parse(body);

    // Convert date strings to Date objects if they exist and prepare data
    const data: Partial<Prisma.AvailabilityUncheckedUpdateInput> = {
      ...validatedData,
      updated_at: new Date(),
      recurring_rule: validatedData.recurring_rule || null,
    };

    // Convert date strings to Date objects if they exist
    if (validatedData.start_date) {
      data.start_date = new Date(validatedData.start_date);
    }
    if (validatedData.end_date) {
      data.end_date = new Date(validatedData.end_date);
    }

    // Handle services update separately
    const selectedServices = body.selectedServices || [];

    // First, get the availability to check if it's recurring
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Availability not found" },
        { status: 404 },
      );
    }

    // Handle different edit options for recurring availabilities
    let availabilityIdsToUpdate: string[] = [id];

    if (availability.is_recurring && editOption) {
      // Determine the parent ID (could be this availability or its parent)
      const parentId =
        availability.recurring_availability_id || availability.id;

      switch (editOption) {
        case "single":
          // Only update this specific availability
          availabilityIdsToUpdate = [id];
          break;

        case "future": {
          // Update this and all future availabilities in the series
          const futureAvailabilities = await prisma.availability.findMany({
            where: {
              OR: [
                {
                  recurring_availability_id: parentId,
                  start_date: {
                    gte: availability.start_date,
                  },
                },
                {
                  id: availability.id, // Include the current one
                },
                {
                  // If this is the parent, include it and its future children
                  AND: [
                    { id: parentId },
                    { start_date: { gte: availability.start_date } },
                  ],
                },
              ],
            },
            select: { id: true, start_date: true, end_date: true },
          });
          availabilityIdsToUpdate = futureAvailabilities.map((a) => a.id);
          break;
        }

        case "all": {
          // Update all availabilities in the series including the parent
          const allAvailabilities = await prisma.availability.findMany({
            where: {
              OR: [{ recurring_availability_id: parentId }, { id: parentId }],
            },
            select: { id: true, start_date: true, end_date: true },
          });
          availabilityIdsToUpdate = allAvailabilities.map((a) => a.id);
          break;
        }

        default:
          // Default to single update
          availabilityIdsToUpdate = [id];
      }
    }

    // Use a transaction to update availabilities and related services
    const result = await prisma.$transaction(async (tx) => {
      const updatedAvailabilities = [];

      // Calculate the time difference if we're updating start/end times
      let timeDifference = 0;
      if (data.start_date && data.end_date && editOption !== "single") {
        const originalStartTime = availability.start_date;
        const newStartTime = new Date(data.start_date as Date);
        timeDifference = newStartTime.getTime() - originalStartTime.getTime();
      }

      // Update each availability
      for (const availabilityId of availabilityIdsToUpdate) {
        const baseUpdateData: Partial<Prisma.AvailabilityUncheckedUpdateInput> =
          {
            title: validatedData.title,
            location_id: validatedData.location_id,
            clinician_id: validatedData.clinician_id,
            allow_online_requests: validatedData.allow_online_requests,
            updated_at: new Date(),
          };

        let updateData = baseUpdateData;

        // For non-single edits, calculate the proportional time shift
        if (
          editOption !== "single" &&
          timeDifference !== 0 &&
          availabilityId !== id
        ) {
          // Get the original times for this specific availability
          const originalAvailability = await tx.availability.findUnique({
            where: { id: availabilityId },
            select: { start_date: true, end_date: true },
          });

          if (originalAvailability) {
            updateData = {
              ...baseUpdateData,
              start_date: new Date(
                originalAvailability.start_date.getTime() + timeDifference,
              ),
              end_date: new Date(
                originalAvailability.end_date.getTime() + timeDifference,
              ),
            };
          }
        } else if (availabilityId === id) {
          // For the specific availability being edited, use the exact times provided
          updateData = {
            ...baseUpdateData,
            start_date: data.start_date,
            end_date: data.end_date,
          };
        }

        const updated = await tx.availability.update({
          where: { id: availabilityId },
          data: updateData,
          select: {
            id: true,
            clinician_id: true,
            title: true,
            start_date: true,
            end_date: true,
            location_id: true,
            allow_online_requests: true,
            is_recurring: true,
            recurring_rule: true,
            created_at: true,
            updated_at: true,
          },
        });

        updatedAvailabilities.push(updated);

        // Update services for each availability if provided
        if (selectedServices.length > 0) {
          // Delete existing services
          await tx.availabilityServices.deleteMany({
            where: {
              availability_id: availabilityId,
            },
          });

          // Create new services
          const availabilityServicesData = selectedServices.map(
            (serviceId: string) => ({
              availability_id: availabilityId,
              service_id: serviceId,
            }),
          );

          await tx.availabilityServices.createMany({
            data: availabilityServicesData,
          });
        }
      }
      return (
        updatedAvailabilities.find((a) => a.id === id) ||
        updatedAvailabilities[0]
      );
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const services = searchParams.get("services");
    const serviceId = searchParams.get("serviceId");
    const deleteOption = searchParams.get("deleteOption"); // 'single', 'future', or 'all'

    // If ID, services=true, and serviceId are provided, remove service from availability
    if (id && services === "true" && serviceId) {
      // Validate that the availability exists
      const availability = await prisma.availability.findUnique({
        where: { id },
      });

      if (!availability) {
        return NextResponse.json(
          { error: "Availability not found" },
          { status: 404 },
        );
      }

      // Check if the relationship exists
      const existingRelation = await prisma.availabilityServices.findUnique({
        where: {
          availability_id_service_id: {
            availability_id: id,
            service_id: serviceId,
          },
        },
      });

      if (!existingRelation) {
        return NextResponse.json(
          { error: "Service not assigned to availability" },
          { status: 404 },
        );
      }

      // Delete the availability-service relationship
      await prisma.availabilityServices.delete({
        where: {
          availability_id_service_id: {
            availability_id: id,
            service_id: serviceId,
          },
        },
      });

      return NextResponse.json({
        message: "Service removed from availability successfully",
      });
    }

    // Otherwise, delete the availability
    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 },
      );
    }

    // First, get the availability to check if it's recurring
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Availability not found" },
        { status: 404 },
      );
    }

    // Handle recurring availability deletion
    if (availability.is_recurring && deleteOption) {
      // Determine the parent ID (could be this availability or its parent)
      const parentId =
        availability.recurring_availability_id || availability.id;

      // Use a transaction to delete availabilities and related services
      await prisma.$transaction(async (tx) => {
        let availabilityIds: string[] = [];

        switch (deleteOption) {
          case "single":
            // Delete only this specific availability
            availabilityIds = [id];
            break;

          case "future": {
            // Delete this and all future availabilities in the series
            const futureAvailabilities = await tx.availability.findMany({
              where: {
                OR: [
                  {
                    recurring_availability_id: parentId,
                    start_date: {
                      gte: availability.start_date,
                    },
                  },
                  {
                    id: availability.id, // Include the current one
                  },
                  {
                    // If this is the parent, include it and its future children
                    AND: [
                      { id: parentId },
                      { start_date: { gte: availability.start_date } },
                    ],
                  },
                ],
              },
              select: { id: true },
            });
            availabilityIds = futureAvailabilities.map((a) => a.id);
            break;
          }

          case "all": {
            // Delete all availabilities in the series including the parent
            const allAvailabilities = await tx.availability.findMany({
              where: {
                OR: [{ recurring_availability_id: parentId }, { id: parentId }],
              },
              select: { id: true },
            });
            availabilityIds = allAvailabilities.map((a) => a.id);
            break;
          }

          default:
            // Default to single deletion
            availabilityIds = [id];
        }

        // Delete all related AvailabilityServices records
        await tx.availabilityServices.deleteMany({
          where: {
            availability_id: {
              in: availabilityIds,
            },
          },
        });

        // Delete the availabilities
        await tx.availability.deleteMany({
          where: {
            id: {
              in: availabilityIds,
            },
          },
        });
      });
    } else {
      // For non-recurring availabilities or when deleteOption is not specified
      // Use a transaction to delete availability and related services
      await prisma.$transaction(async (tx) => {
        // First, delete all related AvailabilityServices records
        await tx.availabilityServices.deleteMany({
          where: {
            availability_id: id,
          },
        });

        // Then delete the availability
        await tx.availability.delete({
          where: { id },
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Return more detailed error in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "Error deleting availability",
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
