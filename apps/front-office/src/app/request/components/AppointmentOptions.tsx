import { Button } from "@mcw/ui";
import Image from "next/image";
import videoffice from "@/assets/images/newMeeting.png";

interface AppointmentOption {
  id: string;
  title: string;
  duration: string;
  type: string;
  phone?: string;
  image?: string;
}

interface AppointmentOptionsProps {
  onSelect: (option: AppointmentOption) => void;
}

const appointmentOptions: AppointmentOption[] = [
  {
    id: "video-office",
    title: "Video Office",
    duration: "",
    type: "video",
    phone: "(030) 123-3333",
    image: videoffice.src,
  },
];

export function AppointmentOptions({ onSelect }: AppointmentOptionsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {appointmentOptions.map((option) => (
        <div key={option.id} className="border rounded-lg flex flex-col ">
          <div className="bg-[#f8f8f8] p-6">
            <div>
              {option.image ? (
                <Image
                  priority
                  alt={option.title}
                  className="object-none"
                  height={300}
                  src={option.image}
                  width={300}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg" />
              )}
            </div>
          </div>

          <div className="bg-white p-6 text-left">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {option.title}
            </h3>

            {option.phone && (
              <p className="text-gray-700 mb-4">{option.phone}</p>
            )}

            <Button
              className="bg-green-700 hover:bg-green-800 text-white px-8 py-2 rounded-none"
              variant="default"
              onClick={() => onSelect(option)}
            >
              SELECT
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
