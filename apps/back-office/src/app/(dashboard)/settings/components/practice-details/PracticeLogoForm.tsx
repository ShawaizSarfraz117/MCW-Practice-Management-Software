import { Label } from "@mcw/ui";
import { useDropzone } from "react-dropzone";

export default function PracticeLogoForm() {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [".jpg", ".png"] },
    // onDrop: (acceptedFiles) => {
    //   // Do something with the files
    // },
  });

  return (
    <div className="mt-2 mb-2">
      <Label className="text-sm font-medium" htmlFor="practice-logo">
        Practice Logo
      </Label>
      <div
        {...getRootProps()}
        className="border border-dashed border-gray-300 rounded-md p-6 text-center mt-2"
      >
        <input {...getInputProps()} />
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 mb-1">
          Choose image or drag and drop image
        </p>
        <p className="text-xs text-gray-400">
          Upload a jpg or png image (max 15 MB) with minimum 1,000 height and
          1000 width
        </p>
      </div>
    </div>
  );
}
