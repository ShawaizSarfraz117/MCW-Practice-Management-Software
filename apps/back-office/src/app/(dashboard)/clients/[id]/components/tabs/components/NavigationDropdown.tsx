import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@mcw/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import { ChevronDown } from "lucide-react";

export default function NavigationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const params = useParams();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#2d8467] hover:bg-[#236c53] flex items-center gap-1">
          New
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onSelect={() =>
            router.push(`/clients/${params.id}/diagnosisAndTreatmentPlan`)
          }
        >
          Diagnosis and treatment plan
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            router.push(`/clients/${params.id}/goodFaithEstimate`)
          }
        >
          Good faith estimate
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push(`/clients/${params.id}/mentalStatusExam`)}
        >
          Mental Status Exam
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            router.push(`/clients/${params.id}/scoredMeasure`);
          }}
        >
          Scored Measure
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push(`/clients/${params.id}/otherDocuments`)}
        >
          Other document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
