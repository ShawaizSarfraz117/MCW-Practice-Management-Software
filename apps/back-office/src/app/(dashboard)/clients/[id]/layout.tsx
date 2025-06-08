import { prisma } from "@mcw/database";
import { getClientGroupInfo } from "@/utils/helpers";
import ClientBreadcrumb from "./components/ClientBreadcrumb";

interface ClientLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

const ClientLayout = async ({ children, params }: ClientLayoutProps) => {
  const clientGroup = await prisma.clientGroup.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      ClientGroupMembership: {
        where: {
          is_contact_only: false,
        },
        select: {
          Client: {
            select: {
              legal_first_name: true,
              legal_last_name: true,
            },
          },
        },
      },
    },
  });

  const clientName = getClientGroupInfo(clientGroup);

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      <ClientBreadcrumb clientId={params.id} clientName={clientName} />
      {children}
    </div>
  );
};

export default ClientLayout;
