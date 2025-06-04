"use client";

import React, { useState } from "react";
import { Button, Input } from "@mcw/ui";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const normalValues = {
  appearance: "Normal",
  dress: "Appropriate",
  motorActivity: "Normal",
  insight: "Good",
  judgement: "Good",
  affect: "Appropriate",
  mood: "Euthymic",
  orientation: "X3: Oriented to person, place and time",
  memory: "Intact",
  attention: "Attentive",
  thoughtContent: "Normal",
  thoughtProcess: "Linear",
  perception: "Normal",
  interviewBehavior: "Cooperative",
  speech: "Normal",
  recommendations: "",
  date: "",
  time: "",
};

export default function MentalStatusExam() {
  // Example state for all fields
  const [fields, setFields] = useState({
    appearance: "",
    dress: "",
    motorActivity: "",
    insight: "",
    judgement: "",
    affect: "",
    mood: "",
    orientation: "",
    memory: "",
    attention: "",
    thoughtContent: "",
    thoughtProcess: "",
    perception: "",
    interviewBehavior: "",
    speech: "",
    recommendations: "",
    date: "",
    time: "",
  });

  function handleChange(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
  }
  const searchParams = useSearchParams();
  const clientName = searchParams.get("clientName");

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="px-4 sm:px-6 py-4 text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link className="hover:text-gray-700" href="/clients">
            Clients and contacts
          </Link>
          <span className="mx-1">/</span>
          <span>{clientName}&apos;s profile</span>
          <span className="mx-1">/</span>
          <span>Mental Status Exam</span>
        </div>
        <Button
          variant="outline"
          className="mt-2 sm:mt-0 flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </Button>
      </div>

      {/* Client Info */}
      <h1 className="text-2xl font-semibold mt-4 mb-1">Jamie D. Appleseed</h1>
      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
        Adult
        <span className="text-gray-300">|</span>
        07/12/2024 (0)
        <span className="text-gray-300">|</span>
        <Link href="#" className="text-[#2d8467] hover:underline">
          Schedule appointment
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="#" className="text-[#2d8467] hover:underline">
          Edit
        </Link>
      </div>

      {/* Section Title and All Normal */}
      <div className="flex items-center justify-between mt-8 mb-2 max-w-2xl">
        <h2 className="text-xl font-semibold">Current Mental Status</h2>
        <button
          type="button"
          className="text-green-700 font-medium hover:underline text-sm"
          onClick={() => setFields((f) => ({ ...f, ...normalValues }))}
        >
          All Normal
        </button>
      </div>

      {/* Form */}
      <form className="flex flex-col justify-center gap-4">
        {[
          { label: "Appearance", key: "appearance" },
          { label: "Dress", key: "dress" },
          { label: "Motor Activity", key: "motorActivity" },
          { label: "Insight", key: "insight" },
          { label: "Judgement", key: "judgement" },
          { label: "Affect", key: "affect" },
          { label: "Mood", key: "mood" },
          { label: "Orientation", key: "orientation" },
          { label: "Memory", key: "memory" },
          { label: "Attention", key: "attention" },
          { label: "Thought Content", key: "thoughtContent" },
          { label: "Thought Process", key: "thoughtProcess" },
          { label: "Perception", key: "perception" },
          { label: "Interview Behavior", key: "interviewBehavior" },
          { label: "Speech", key: "speech" },
        ].map(({ label, key }) => (
          <div key={key} className="w-[40%]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <Input
              value={fields[key as keyof typeof fields]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full h-10"
            />
          </div>
        ))}

        <div className="h-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recommendations
          </label>
          <ReactQuill
            theme="snow"
            value={fields.recommendations}
            onChange={(val) => handleChange("recommendations", val)}
            className="bg-white w-[40%] h-28"
            placeholder="Begin typing here..."
          />
        </div>

        {/* Date and Time */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <Input
              type="date"
              value={fields.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <Input
              type="time"
              value={fields.time}
              onChange={(e) => handleChange("time", e.target.value)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 my-6">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button
            className="bg-[#2d8467] hover:bg-[#236c53] text-white"
            type="submit"
          >
            Save Mental Status Exam
          </Button>
        </div>
      </form>
    </div>
  );
}
