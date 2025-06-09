import { NextResponse, NextRequest } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";

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
  } catch (error) {
    logger.error({ error }, "Error checking authentication");
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
      const existingRelation = await prisma.AvailabilityServices.findUnique({
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
      const availabilityService = await prisma.AvailabilityServices.create({
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
        logger.info(`Processing recurring rule: ${recurringRule}`);

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

        logger.info(`Parsed rule parts:`, ruleParts);

        // Handle both 'WEEK' and 'WEEKLY' for backwards compatibility
        let freq = ruleParts.FREQ || "WEEKLY";
        freq = freq.toUpperCase();
        if (freq === "WEEK") freq = "WEEKLY";
        if (freq === "MONTH") freq = "MONTHLY";
        if (freq === "YEAR") freq = "YEARLY";

        const interval = parseInt(ruleParts.INTERVAL || "1");
        const count = parseInt(ruleParts.COUNT || "1");
        const byDay = ruleParts.BYDAY?.split(",") || [];
        const until = ruleParts.UNTIL;

        logger.info(
          `Parsed values - freq: ${freq}, count: ${count}, byDay: ${byDay.join(",")}, interval: ${interval}`,
        );
        logger.info(`byDay array:`, byDay);
        logger.info(`byDay.length: ${byDay.length}`);

        // For weekly recurrence with specific days
        if (freq === "WEEKLY" && byDay.length > 0) {
          logger.info(`Entering WEEKLY recurrence logic`);
          // Map of day codes to day indices (0 = Sunday, 1 = Monday, etc.)
          // Support both 2-letter (RFC5545 standard) and 3-letter codes
          const dayCodeToIndex: Record<string, number> = {
            // 2-letter codes (RFC5545 standard)
            SU: 0,
            MO: 1,
            TU: 2,
            WE: 3,
            TH: 4,
            FR: 5,
            SA: 6,
            // 3-letter codes (common abbreviations)
            SUN: 0,
            MON: 1,
            TUE: 2,
            WED: 3,
            THU: 4,
            FRI: 5,
            SAT: 6,
          };

          const weekdays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];

          const startDate = new Date(data.start_date);
          const endDate = new Date(data.end_date);
          const duration = endDate.getTime() - startDate.getTime();

          // Get the day of the week for the start date
          const startDayOfWeek = startDate.getDay();

          logger.info(
            `Start date details: ${startDate.toISOString()}, day of week: ${startDayOfWeek} (${weekdays[startDayOfWeek]}), duration: ${duration}ms`,
          );

          // Calculate the start of the current week (Sunday)
          const startOfWeek = new Date(startDate);
          startOfWeek.setDate(startDate.getDate() - startDayOfWeek);

          // Count how many child availabilities we've created (excluding master)
          let createdCount = 0;

          logger.info(
            `Creating recurring availabilities: count=${count}, byDay=${byDay.join(",")}, freq=${freq}, interval=${interval}, startDate=${startDate.toISOString()}`,
          );
          logger.info(
            `Master availability created on ${startDate.toISOString().split("T")[0]} (${weekdays[startDayOfWeek]})`,
          );

          // Create availabilities for each specified day for several weeks
          for (let week = 0; week < Math.ceil(count > 0 ? count : 52); week++) {
            logger.info(
              `Processing week ${week}, createdCount: ${createdCount}, target: ${count - 1}`,
            );

            // For each day specified in BYDAY
            for (const dayCode of byDay) {
              // Skip if we've reached the maximum count (count - 1 because master already exists)
              if (count > 0 && createdCount >= count - 1) break;

              const dayIndex = dayCodeToIndex[dayCode.toUpperCase().trim()];
              if (dayIndex === undefined) {
                logger.warn(
                  `Invalid day code: ${dayCode} (trimmed: ${dayCode.trim()}, uppercase: ${dayCode.toUpperCase()})`,
                );
                logger.warn(
                  `Available day codes: ${Object.keys(dayCodeToIndex).join(", ")}`,
                );
                continue; // Invalid day code
              }

              // Calculate the date for this availability
              const availabilityDate = new Date(startOfWeek);
              availabilityDate.setDate(
                startOfWeek.getDate() + dayIndex + week * 7 * interval,
              );

              logger.info(
                `Checking date: ${availabilityDate.toISOString().split("T")[0]} (${weekdays[dayIndex]}) - week ${week}, dayCode ${dayCode}`,
              );

              // Skip if this date is before the start date
              if (availabilityDate < startDate) {
                logger.info(`  Skipping - before start date`);
                continue;
              }

              // Skip if this is exactly the same as the master availability's date
              if (
                availabilityDate.toISOString().split("T")[0] ===
                  startDate.toISOString().split("T")[0] &&
                dayIndex === startDayOfWeek &&
                week === 0
              ) {
                logger.info(`  Skipping - same as master date`);
                continue;
              }

              // If UNTIL is specified, check if we've passed the end date
              if (until) {
                const untilDate = new Date(
                  `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`,
                );
                if (availabilityDate > untilDate) break;
              }

              // Calculate end date for this occurrence
              const availabilityEndDate = new Date(
                availabilityDate.getTime() + duration,
              );

              logger.info(
                `  Creating availability from ${availabilityDate.toISOString()} to ${availabilityEndDate.toISOString()}`,
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

                logger.info(
                  `Created recurring availability ${createdCount + 1}/${count} on ${availabilityDate.toISOString().split("T")[0]}`,
                );
              } catch (error) {
                logger.error(
                  `Failed to create recurring availability for date ${availabilityDate.toISOString()}:`,
                  error,
                );
                // Continue with next date instead of failing completely
              }
            }

            // Break outer loop if we've created enough
            if (count > 0 && createdCount >= count - 1) break;
          }
        }
        // For monthly and yearly recurrence (simplified for now)
        else if ((freq === "MONTHLY" || freq === "YEARLY") && count > 1) {
          const startDate = new Date(data.start_date);
          const endDate = new Date(data.end_date);

          for (let i = 1; i < count; i++) {
            const newStartDate = new Date(startDate);
            const newEndDate = new Date(endDate);

            if (freq === "MONTHLY") {
              newStartDate.setMonth(startDate.getMonth() + i * interval);
              newEndDate.setMonth(endDate.getMonth() + i * interval);
            } else {
              newStartDate.setFullYear(startDate.getFullYear() + i * interval);
              newEndDate.setFullYear(endDate.getFullYear() + i * interval);
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

        logger.info(
          `Finished creating recurring availabilities. Total created: ${allAvailabilities.length} (1 master + ${allAvailabilities.length - 1} children)`,
        );
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

          await tx.AvailabilityServices.createMany({
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

          await tx.AvailabilityServices.createMany({
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

    logger.info(
      `Created ${result.totalCreated} availabilities with ${result.servicesAdded} total services added`,
    );

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
      logger.error(
        { error: error.errors },
        "Validation error while creating availability",
      );
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.error({ error }, "Error creating availability");
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
      const availabilityServices = await prisma.AvailabilityServices.findMany({
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
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    logger.error({ error }, "Error fetching availabilities");
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

    const availability = await prisma.availability.update({
      where: { id },
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
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    logger.error({ error }, "Error updating availability");
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
      const existingRelation = await prisma.AvailabilityServices.findUnique({
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
      await prisma.AvailabilityServices.delete({
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
        await tx.AvailabilityServices.deleteMany({
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
        await tx.AvailabilityServices.deleteMany({
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
    console.error("Error deleting availability:", error);
    logger.error({ error }, "Error deleting availability");

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
