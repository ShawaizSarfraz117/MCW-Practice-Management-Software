"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@mcw/ui";
import { Calendar, Check, Info, User } from "lucide-react";
import TopBar from "@/components/layouts/Topbar";
import { Service } from "../calendar/components/appointment-dialog/types";
import AddServcieDialog from "../billing/components/AddServiceDialog";

const SettingScreen = () => {
  const [showDataFirst, setIsShowDataFirst] = useState(false);
  const [showDataSec, setIsShowDataSec] = useState(false);
  const [modalOpen, setIsModalOpen] = useState(false);
  const [_services, setServices] = useState<Service[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/service");
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <>
      <div>
        <TopBar />
        <div className="flex justify-between mt-5">
          <div>
            <h3 className="text-[22px] font-medium">Services</h3>
            <p className="text-[#4B5563] text-[14px]">
              Manage services and set rates.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2d8467] hover:bg-[#236c53] w-[160px]"
          >
            Add Services
          </Button>
        </div>
        <div className="bg-[#EFF6FF] rounded-[10px] p-5 mt-5">
          <h3 className="text-[16px]">Click on each Service name to edit</h3>
          <p className="text-[#4B5563] text-[14px]">
            Service Descriptions are shown throughout the SimplePractice
            platform internally, in some client communications and in
            superbills.
          </p>
        </div>
        <div className="bg-white mt-5 p-4 shadow rounded-[10px]">
          <div className="flex justify-between items-center pb-3 border-b">
            <p className="text-[16px] font-medium">Services</p>
            <p className="text-[16px] font-medium">Appointment requests</p>
          </div>

          <div
            className={`border-b py-3 ${showDataFirst ? "bg-[#E5E7EB]" : ""} px-3 rounded-[10px]`}
          >
            <div
              onClick={() => setIsShowDataFirst(!showDataFirst)}
              className="cursor-pointer"
            >
              <p className="text-[#2D8467] text-[16px]">
                <span className="mr-2">90834</span> Psychotherapy, 45 min
              </p>
              <p className="text-[#4B5563] text-[14px] mt-1">
                50 minutes at $100
              </p>
              <p className="text-[#8D8D8D] text-[14px] flex gap-2 mt-1">
                {" "}
                <Check className="h-5 w-5" /> Default practice service
              </p>
            </div>
            {showDataFirst && (
              <div className="mt-3">
                <p className="text-[#374151] text-[14px]">Description</p>
                <input
                  type="text"
                  className="text-[#374151] bg-white text-[14px] w-[500px] border rounded-[5px] outline-none p-2"
                />
                <div className="flex items-center gap-4 mt-3">
                  <span>
                    <p className="text-[#374151] text-[14px]">Rate</p>
                    <input
                      type="text"
                      className="text-[#374151] text-[14px] w-[200px] border rounded-[5px] outline-none p-2"
                    />
                  </span>
                  <span>
                    <p className="text-[#374151] text-[14px]">
                      Default Duration
                    </p>
                    <input
                      type="number"
                      min={0}
                      className="text-[#374151] bg-white text-[14px] w-[80px] border rounded-[5px] outline-none p-2"
                    />
                    <span className="text-[#1F2937] ml-2 text-[14px]">min</span>
                  </span>
                  <span className="ml-auto">
                    <input
                      id="1"
                      type="checkbox"
                      className="h-[15px] accent-[#afafaf] bg-white w-[15px]"
                    />
                    <label
                      className="text-[#1F2937] ml-1 text-[15px]"
                      htmlFor="1"
                    >
                      Active
                    </label>
                  </span>
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <input
                    id="1"
                    type="checkbox"
                    className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
                  />
                  <p className="text-[#1F2937] text-[14px]">
                    Bill this code in units
                  </p>
                  <Info className="h-4 w-4" />
                </div>
                <div className="mt-2">
                  <p className="text-[#1F2937] my-4 text-[16px]">
                    Booking Options
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      id="1"
                      type="checkbox"
                      className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
                    />
                    <p className="text-[#1F2937] text-[14px]">
                      Available for online appointment requests
                    </p>
                  </div>
                </div>
                <div className="text-[#1F2937] text-[14px] flex items-center gap-1 mt-3">
                  <p>Block off</p>
                  <input
                    type="number"
                    min={0}
                    className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
                  />
                  <p>minutes before and</p>
                  <input
                    type="number"
                    min={0}
                    className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
                  />
                  <p>minutes after the appointment</p>
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <Button className="bg-transparent text-black hover:bg-gray-50 border border-[lightgray]">
                    Cancel
                  </Button>
                  <Button className="bg-[#2d8467] hover:bg-[#236c53]">
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div
            className={`border-b py-3 ${showDataSec ? "bg-[#E5E7EB]" : ""} px-3 rounded-[10px]`}
          >
            <div
              onClick={() => setIsShowDataSec(!showDataSec)}
              className="cursor-pointer flex justify-between items-center"
            >
              <div>
                <p className="text-[#2D8467] text-[16px]">
                  <span className="mr-2">00000</span> Initial Consultation - No
                  Charge
                </p>
                <p className="text-[#4B5563] text-[14px] mt-1">
                  15 minutes at $0
                </p>
              </div>
              <div className="flex gap-4">
                <Calendar className="h-5 w-5" />
                <User className="h-5 w-5" />
              </div>
            </div>
            {showDataSec && (
              <div className="mt-3">
                <p className="text-[#374151] text-[14px]">Description</p>
                <input
                  type="text"
                  className="text-[#374151] bg-white text-[14px] w-[500px] border rounded-[5px] outline-none p-2"
                />
                <div className="flex items-center gap-4 mt-3">
                  <span>
                    <p className="text-[#374151] text-[14px]">Rate</p>
                    <input
                      type="text"
                      className="text-[#374151] text-[14px] w-[200px] border rounded-[5px] outline-none p-2"
                    />
                  </span>
                  <span>
                    <p className="text-[#374151] text-[14px]">
                      Default Duration
                    </p>
                    <input
                      type="number"
                      min={0}
                      className="text-[#374151] bg-white text-[14px] w-[80px] border rounded-[5px] outline-none p-2"
                    />
                    <span className="text-[#1F2937] ml-2 text-[14px]">min</span>
                  </span>
                  <span className="ml-auto">
                    <input
                      id="1"
                      type="checkbox"
                      className="h-[15px] accent-[#afafaf] bg-white w-[15px]"
                    />
                    <label
                      className="text-[#1F2937] ml-1 text-[15px]"
                      htmlFor="1"
                    >
                      Active
                    </label>
                  </span>
                </div>
                <div className="flex gap-2 items-center mt-2">
                  <input
                    id="1"
                    type="checkbox"
                    className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
                  />
                  <p className="text-[#1F2937] text-[14px]">
                    Bill this code in units
                  </p>
                  <Info className="h-4 w-4" />
                </div>
                <div className="mt-2">
                  <p className="text-[#1F2937] my-4 text-[16px]">
                    Booking Options
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      id="1"
                      type="checkbox"
                      className="h-[15px] accent-[#2D8467] bg-white w-[15px]"
                    />
                    <p className="text-[#1F2937] text-[14px]">
                      Available for online appointment requests
                    </p>
                  </div>
                </div>
                <div className="text-[#1F2937] text-[14px] flex items-center gap-1 mt-3">
                  <p>Block off</p>
                  <input
                    type="number"
                    min={0}
                    className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
                  />
                  <p>minutes before and</p>
                  <input
                    type="number"
                    min={0}
                    className="text-[#374151] bg-white text-[14px] w-[60px] border rounded-[5px] outline-none p-2"
                  />
                  <p>minutes after the appointment</p>
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <Button className="bg-transparent text-black hover:bg-gray-50 border border-[lightgray]">
                    Cancel
                  </Button>
                  <Button className="bg-[#2d8467] hover:bg-[#236c53]">
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddServcieDialog
        isOpen={modalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
export default SettingScreen;
