import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-600 text-white py-10 ">
      <div className="container mx-auto px-4">
        <div className="flex  md:flex-row justify-around items-start md:items-center text-start space-y-8 md:space-y-0">
          {/* Left: Contact Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              McNulty Counseling and Wellness
            </h3>
            <p>
              <a className="hover:text-gray-400" href="tel:7273449867">
                727.344.9867
              </a>{" "}
              |{" "}
              <Link className="hover:text-gray-400" href="#">
                Contact
              </Link>
            </p>
            <p className="text-sm">Saint Petersburg</p>
          </div>

          {/* Divider Line */}
          <div className="hidden md:block h-20 w-px bg-gray-500 mx-8" />

          {/* Middle: Location Info */}
          <div className="space-y-2">
            <h4 className="font-medium">Main Location</h4>
            <p className="text-gray-400 text-sm">111 2nd Ave NE, Suite 1101</p>
            <p className="text-gray-400 text-sm">
              Saint Petersburg, FL 33701-3443
            </p>
          </div>
        </div>

        {/* Right: Powered by and Links */}

        <div className="flex flex-col md:flex-row justify-evenly sm:items-start md:items-center md:text-left md:space-y-0 text-sm text-center  space-y-2 mt-12">
          <p className="font-medium">Powered By SimpléPractice</p>
          <div className="flex flex-wrap justify-center  gap-x-4 gap-y-1 text-gray-400">
            <Link className="hover:text-gray-400" href="/">
              Privacy
            </Link>
            -
            <Link className="hover:text-gray-400" href="/">
              Terms
            </Link>
            -
            <Link className="hover:text-gray-400" href="/">
              License Agreement
            </Link>
            -
            <Link className="hover:text-gray-400" href="/">
              Help Center
            </Link>
            -
            <Link className="hover:text-gray-400" href="/">
              Cookies
            </Link>
          </div>
        </div>

        {/* Bottom: Emergency Notice */}
        <div className="mt-8 text-gray-400 text-xs text-start md:text-center px-2 md:px-0">
          THE CLIENT PORTAL IS NOT TO BE USED FOR EMERGENCY SITUATIONS. IF YOU
          OR OTHERS ARE IN IMMEDIATE DANGER OR EXPERIENCING A MEDICAL EMERGENCY,
          CALL 911 IMMEDIATELY.
        </div>
      </div>
    </footer>
  );
}
