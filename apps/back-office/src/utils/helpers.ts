import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import { CLINICIAN_ROLE } from "./constants";
import { backofficeAuthOptions } from "@/api/auth/[...nextauth]/auth-options";

/**
 * Gets the server session with backofficeAuthOptions
 */
export async function getBackOfficeSession() {
  return await getServerSession(backofficeAuthOptions);
}

/**
 * Determines if the current user is a clinician and returns their clinician ID if found
 */
export async function getClinicianInfo() {
  const session = await getBackOfficeSession();
  console.log("🚀 ~ getClinicianInfo ~ session:", session);
  const isClinician = session?.user?.roles?.some(
    (role) => role === CLINICIAN_ROLE,
  );

  const clinician = isClinician
    ? await prisma.clinician.findUnique({
        where: {
          user_id: session?.user?.id,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      })
    : null;

  const clinicianId = clinician?.id ?? null;

  return { isClinician, clinicianId, clinician };
}

export function getClientGroupInfo(client: unknown) {
  const name = (
    client as {
      ClientGroupMembership: {
        Client: { legal_first_name: string; legal_last_name: string };
      }[];
    }
  ).ClientGroupMembership.map((m) =>
    `${m.Client?.legal_first_name ?? ""} ${m.Client?.legal_last_name ?? ""}`.trim(),
  )
    .filter(Boolean)
    .join(" & ");

  return name;
}
