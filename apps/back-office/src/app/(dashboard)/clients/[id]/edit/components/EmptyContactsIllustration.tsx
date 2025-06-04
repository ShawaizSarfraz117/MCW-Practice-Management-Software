export function EmptyContactsIllustration() {
  return (
    <div className="mb-6 flex justify-center">
      <div className="relative">
        {/* Main contact circle */}
        <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
          <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center">
            <svg fill="white" height="32" viewBox="0 0 24 24" width="32">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>

        {/* Surrounding contact bubbles */}
        <div className="absolute -top-4 -left-8 w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center border-2 border-white shadow">
          <svg fill="#6B7280" height="20" viewBox="0 0 24 24" width="20">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        <div className="absolute -top-4 -right-8 w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center border-2 border-white shadow">
          <svg fill="#6B7280" height="20" viewBox="0 0 24 24" width="20">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        <div className="absolute -bottom-2 -right-12 w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center border-2 border-white shadow">
          <svg fill="#6B7280" height="20" viewBox="0 0 24 24" width="20">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        {/* Dotted connection lines */}
        <div className="absolute top-8 left-8 w-8 h-1 border-t-2 border-dotted border-gray-300 transform rotate-45" />
        <div className="absolute top-8 right-8 w-8 h-1 border-t-2 border-dotted border-gray-300 transform -rotate-45" />
        <div className="absolute bottom-8 right-4 w-8 h-1 border-t-2 border-dotted border-gray-300 transform rotate-12" />
      </div>
    </div>
  );
}
