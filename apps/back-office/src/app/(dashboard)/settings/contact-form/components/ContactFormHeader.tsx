import { Switch } from "@mcw/ui";

interface ContactFormHeaderProps {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

export default function ContactFormHeader({
  enabled,
  setEnabled,
}: ContactFormHeaderProps) {
  return (
    <section className="flex flex-row md:flex-col md:items-center md:justify-between gap-8">
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
          Contact Form
        </h1>
        <p className="text-gray-600 mb-2">
          Get website inquiries sent directly to SimplePractice
        </p>
        <div className="flex items-center gap-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span className="text-gray-900 font-medium mb-2">Contact form</span>
        </div>
      </div>
    </section>
  );
}
