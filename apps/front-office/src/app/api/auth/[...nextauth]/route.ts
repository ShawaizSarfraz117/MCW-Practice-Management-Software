// This file re-exports the GET and POST handlers from your central auth.ts configuration.
// It is used by Next.js to handle authentication requests at /api/auth/*.

import { handlers } from "@/auth"; // Corrected: @/auth should resolve to src/app/auth.ts

export const { GET, POST } = handlers;
