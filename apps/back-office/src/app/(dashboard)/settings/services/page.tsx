"use client";
import TopBar from "@/components/layouts/Topbar";
import Sidebar from "../components/Sidebar";
import Service from "../components/Service";
export default function ServicePage() {
  return (
    <>
      <TopBar />
      <div className="flex">
        <Sidebar />
        <Service />
      </div>
    </>
  );
}
