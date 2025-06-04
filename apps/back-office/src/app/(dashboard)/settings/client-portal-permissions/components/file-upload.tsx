import { Card, CardHeader } from "@mcw/ui";

export default function FileUploadCard() {
  return (
    <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold text-[#1F2937] mb-1">
            File Upload
          </div>
          <div className="flex items-center gap-2 mb-1">
            <input
              className="accent-[#188153] w-4 h-4"
              id="fileUpload"
              type="checkbox"
            />
            <label
              className="text-base text-[#374151] font-normal"
              htmlFor="fileUpload"
            >
              Allow clients to upload documents to Client Portal
            </label>
          </div>
          <a className="text-[#2563EB] text-sm hover:underline ml-7" href="#">
            Learn about setting up your Client Portal
          </a>
        </div>
      </CardHeader>
    </Card>
  );
}
