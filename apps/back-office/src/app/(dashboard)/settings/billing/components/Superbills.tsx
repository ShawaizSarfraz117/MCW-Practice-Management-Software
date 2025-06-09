export default function Superbills() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="font-medium text-base text-[#111827] mb-1.5">
          Automatic superbill generation
        </h3>
        <p className="text-sm text-[#4B5563] mb-4">
          Choose on which day of the following month superbills are generated.
          This gives you time to close out the accounting for a month.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-700">
            Generate monthly Superbills on day
          </span>
          <select className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">of the following month.</span>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-medium text-base text-[#111827] mb-1.5">
          Superbill format
        </h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2">
            <input
              defaultChecked
              className="accent-[#2D8467] w-4 h-4"
              type="checkbox"
            />
            <span className="text-[#111827]">Include practice logo</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              defaultChecked
              className="accent-[#2D8467] w-4 h-4"
              type="checkbox"
            />
            <span className="text-[#111827]">Include signature line</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              defaultChecked
              className="accent-[#2D8467] w-4 h-4"
              type="checkbox"
            />
            <span className="text-[#111827]">
              Include diagnosis description
            </span>
          </label>
        </div>
      </div>
      <div>
        <h3 className="font-medium text-base text-[#111827] mb-1.5">
          Footer information
        </h3>
        <textarea
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={120}
          placeholder="Information that will show in the footer of your billing documents goes here. The character limit is 120 characters."
          rows={2}
        />
      </div>
    </div>
  );
}
