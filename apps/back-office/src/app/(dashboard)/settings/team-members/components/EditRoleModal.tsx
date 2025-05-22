import { Dialog, DialogContent } from "@mcw/ui";
import { TeamMember } from "../hooks/useRolePermissions";
import ProfileSvg from "@/assets/images/member.png";
import Image from "next/image";

interface EditRoleModalProps {
  open: boolean;
  onClose: () => void;
  member: TeamMember;
}

export default function EditRoleModal({
  open,
  onClose,
  member,
}: EditRoleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1440px] h-[700px] p-8 md:p-10 overflow-y-auto bg-white rounded-xl flex flex-row md:flex-col absolute">
        <div className="flex-1 max-w-[1000px]">
          <h2 className="text-[22px] font-semibold text-[#181C1F] mb-2">
            Edit team member
          </h2>
          <div className="text-[16px] text-[#181C1F] mb-6">
            Update{" "}
            <span className="font-medium">
              {member.firstName} {member.lastName}
            </span>
            's role
          </div>
          <div className="text-[16px] text-[#181C1F] mb-6">
            <a
              href="#"
              className="text-[15px] text-[#2563eb] hover:underline font-medium"
            >
              Need help? Learn about SimplePractice roles
            </a>
          </div>

          <div className="mb-6">
            <div className="text-[15px] font-semibold text-[#181C1F] mb-2">
              Clinical roles
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  defaultChecked
                  className="accent-[#2D8467] w-5 h-5 mt-1"
                  name="role"
                  type="radio"
                  value="clinician"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#181C1F] text-[16px]">
                      Clinician
                    </span>
                    <span className="ml-2 text-[15px] text-[#6B7280] font-normal">
                      $74/month
                    </span>
                  </div>
                  <div className="text-[15px] text-[#6B7280] mt-1">
                    For team members who treat clients
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#181C1F] text-[16px]">
                  Supervisor
                </div>
                <div className="text-[15px] text-[#6B7280] mt-1">
                  For team members who supervise a pre-licensed clinician
                </div>
              </div>
              <span className="text-[15px] text-[#6B7280] font-normal">
                Free
              </span>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-[15px] font-semibold text-[#181C1F] mb-2">
              Administrative roles
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#181C1F] text-[16px]">
                  Practice manager
                </div>
                <div className="text-[15px] text-[#6B7280] mt-1">
                  For team members who make administrative decisions for the
                  practice
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[15px] text-[#6B7280] line-through">
                  $35/month
                </span>
                <span className="text-[15px] text-[#6B7280] font-normal">
                  Free
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="bg-[#2D8467] hover:bg-[#256b53] text-white font-medium px-8 py-2 rounded-md text-base w-full md:w-auto">
              Continue
            </button>
          </div>
        </div>
        <div className="md:block w-[450px] h-[250px] bg-[#FAFAFB] rounded-xl p-6 ml-4 self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <Image src={ProfileSvg} alt="Monarch" width={14} height={16} />
            </div>
            <div>
              <div className="font-semibold text-[17px] text-[#181C1F] leading-tight">
                {member.firstName} {member.lastName}
              </div>
              <div className="text-[15px] text-[#6B7280] leading-tight">
                {member.email}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              "Clinician with entire practice access",
              "Practice biller",
              "Practice scheduler",
            ].map((role) => (
              <div
                key={role}
                className="flex justify-between items-center py-1"
              >
                <span className="text-[16px] text-[#181C1F]">{role}</span>
                <button className="flex items-center gap-1 text-[#6B7280] text-[14px] font-normal hover:underline">
                  Show permissions
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7 8l3 3 3-3"
                      stroke="#6B7280"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
