import { Button } from "@mcw/ui";
import Image from "next/image";
import ContactFormWidget from "@/assets/images/contact-form-widget.svg";
import CheckIcon from "@/assets/images/check-icon.svg";
export default function ContactFormBenefits() {
  return (
    <section className="mt-16">
      <div className="flex flex-row md:items-center md:justify-between gap-8 mb-16">
        <div className="flex-1 mb-8 md:mb-0">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            A convenient way to get inquiries from new clients
          </h2>
          <p className="text-gray-600 mb-6 max-w-lg">
            Save time setting up prospective clients with a contact form that
            connects directly to SimplePractice
          </p>
          <div className="flex gap-3">
            <Button className="bg-green-700 hover:bg-green-800 text-white">
              Turn on contact form
            </Button>
            <Button variant="outline">Watch demo video</Button>
          </div>
        </div>
        <div className="flex-shrink-0 flex justify-center items-center">
          <div className="w-64 h-48 bg-blue-100 rounded-lg flex items-center justify-center">
            <Image
              alt="Widget Preview"
              className="max-w-full h-auto rounded-lg shadow-lg"
              src={ContactFormWidget}
              style={{ maxWidth: 260 }}
              width={318}
              height={318}
            />
          </div>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-8">
        How your practice benefits
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full flex items-center justify-center">
            <Image src={CheckIcon} alt="Check" width={20} height={20} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">
              Receive inquiries through a short contact form
            </div>
            <div className="text-gray-600 text-sm">
              Prospective clients can find the form on the Client Portal,
              Professional Website, or Monarch Directory
            </div>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full flex items-center justify-center">
            <Image src={CheckIcon} alt="Check" width={20} height={20} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">
              Manage all your inquiries in one place
            </div>
            <div className="text-gray-600 text-sm">
              Contact form inquiries conveniently show as prospective clients in
              SimplePractice
            </div>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full flex items-center justify-center">
            <Image src={CheckIcon} alt="Check" width={20} height={20} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">
              Add the contact form to your website
            </div>
            <div className="text-gray-600 text-sm">
              Use the contact form widget to add the form to your own website
            </div>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full flex items-center justify-center">
            <Image src={CheckIcon} alt="Check" width={20} height={20} />
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">
              Get a shareable contact form link
            </div>
            <div className="text-gray-600 text-sm">
              Share a link to your contact form directly with prospective
              clients and referral sources
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
