"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@mcw/ui";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import GAD7Form from "./components/GAD7";
import PHQ9Form from "./components/PHQ9";
import ARM5Form from "./components/ARM5";
interface PageProps {
  searchParams: { clientName?: string };
}
export default function ScoredMeasure({ searchParams }: PageProps) {
  const clientName = searchParams.clientName || "Unknown Client";
  const [measure, setMeasure] = useState("GAD-7");
  const [gad7Answers, setGad7Answers] = useState<string[]>(Array(7).fill(""));
  const [gad7Difficulty, setGad7Difficulty] = useState<string>("");
  const [phq9Answers, setPhq9Answers] = useState<string[]>(Array(9).fill(""));
  const [phq9Difficulty, setPhq9Difficulty] = useState<string>("");
  const [arm5Answers, setArm5Answers] = useState<string[]>(Array(5).fill(""));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      {/* Breadcrumb and Message Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-1">
          <Link className="hover:underline" href="/clients">
            Clients and contacts
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">
            {clientName}&apos;s profile
          </span>
        </div>
        <Button
          className="mt-2 sm:mt-0 flex items-center gap-2"
          variant="outline"
        >
          <MessageCircle className="h-4 w-4" />
          Message
        </Button>
      </div>

      {/* Client Info */}
      <h1 className="text-2xl font-semibold mt-4 mb-1">{clientName}</h1>
      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
        Adult
        <span className="text-gray-300">|</span>
        07/12/2024 (0)
        <span className="text-gray-300">|</span>
        <Link className="text-[#2d8467] hover:underline" href="#">
          Schedule appointment
        </Link>
        <span className="text-gray-300">|</span>
        <Link className="text-[#2d8467] hover:underline" href="#">
          Edit
        </Link>
      </div>

      {/* Section Title and Subtext */}
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-xl font-semibold">Scored measure</h2>
        <div className="text-sm text-gray-600">
          Completing on behalf of Jamie. For client completion,{" "}
          <Link className="text-[#2d8467] hover:underline" href="#">
            share now.
          </Link>
        </div>
      </div>

      {/* Measure Dropdown */}
      <div className="mb-4">
        <Select value={measure} onValueChange={setMeasure}>
          <SelectTrigger className="w-full max-w-xs">{measure}</SelectTrigger>
          <SelectContent>
            <SelectItem value="GAD-7">GAD-7</SelectItem>
            <SelectItem value="PHQ-9">PHQ-9</SelectItem>
            <SelectItem value="ARM-5">ARM-5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Questionnaire */}
      <form className="space-y-6">
        {measure === "GAD-7" && (
          <GAD7Form
            answers={gad7Answers}
            difficulty={gad7Difficulty}
            setAnswers={setGad7Answers}
            setDifficulty={setGad7Difficulty}
          />
        )}
        {measure === "PHQ-9" && (
          <PHQ9Form
            answers={phq9Answers}
            difficulty={phq9Difficulty}
            setAnswers={setPhq9Answers}
            setDifficulty={setPhq9Difficulty}
          />
        )}
        {measure === "ARM-5" && (
          <ARM5Form answers={arm5Answers} setAnswers={setArm5Answers} />
        )}

        {/* Date and Time */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date and time of completion
            </label>
            <Input
              className="w-full"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Input
              className="w-full"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            className="bg-[#2d8467] hover:bg-[#236c53] text-white"
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
