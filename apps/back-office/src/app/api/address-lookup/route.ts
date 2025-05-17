import { NextRequest, NextResponse } from "next/server";

interface AddressSuggestion {
  street_line: string;
  secondary: string;
  city: string;
  state: string;
  zipcode: string;
  entries: number;
}

interface SmartyResponse {
  suggestions: AddressSuggestion[];
}

const SMARTY_API_KEY = process.env.SMARTY_API_KEY;
const SMARTY_API_URL = "https://us-autocomplete-pro.api.smarty.com/lookup";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get the search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");

    if (!search) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    if (!SMARTY_API_KEY) {
      return NextResponse.json(
        { error: "Smarty API key is not configured" },
        { status: 500 },
      );
    }

    // Call Smarty API
    const response = await fetch(
      `${SMARTY_API_URL}?key=${SMARTY_API_KEY}&search=${encodeURIComponent(search)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Smarty API returned ${response.status}`);
    }

    const data: SmartyResponse = await response.json();

    // Transform response to match our needs
    const suggestions = data.suggestions.map((suggestion) => ({
      streetLine: suggestion.street_line,
      secondary: suggestion.secondary,
      city: suggestion.city,
      state: suggestion.state,
      zipcode: suggestion.zipcode,
      entries: suggestion.entries,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error in address lookup:", error);
    return NextResponse.json(
      { error: "Failed to fetch address suggestions" },
      { status: 500 },
    );
  }
}
