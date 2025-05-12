import { Metadata } from "next";
import RequestContainer from "./_components/RequestContainer";

export const metadata: Metadata = {
  title: "Requests | Dashboard",
  description: "Request management dashboard",
};

export default function RequestsPage() {
  return <RequestContainer />;
}
