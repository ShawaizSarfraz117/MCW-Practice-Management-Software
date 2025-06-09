/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect } from "react";
import { Button, Input, toast } from "@mcw/ui";
import Link from "next/link";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { AutocompleteInput } from "../components/AutocompleteInput";
import { useParams, useRouter } from "next/navigation";
import {
  fetchSurveyAnswer,
  updateSurveyAnswer,
} from "../services/surveyAnswer.service";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const fieldOptions = {
  appearance: ["Normal", "Disheveled", "Emaciated", "Poor Hygiene"],
  dress: ["Appropriate", "Eccentric", "Provocative", "Bizarre"],
  motorActivity: [
    "Normal",
    "Agitation",
    "Retardation",
    "Posturing",
    "Repetitive Actions",
    "Tics",
    "Tremor",
    "Unusual gait",
  ],
  insight: ["Good", "Fair", "Poor"],
  judgement: ["Good", "Fair", "Poor"],
  affect: [
    "Appropriate",
    "Inappropriate",
    "Constricted",
    "Labile",
    "Blunted",
    "Flat",
    "Intact",
  ],
  mood: ["Euthymic", "Depressed", "Anxious", "Angry", "Euphoric", "Good"],
  orientation: [
    "X3: Oriented to person, place and time",
    "X2: Oriented to person, place, impaired to time",
    "X2: Oriented to person, time, impaired to place",
    "X2: Oriented to time, place, impaired to person",
    "X1: Impaired to person, place and time",
    "X1: Impaired to person, time",
    "X1: Impaired to place, time",
    "X0: Impaired to person, place and time",
  ],
  memory: ["Intact", "Poor remote", "Poor recent"],
  attention: ["Good", "Distractible", "Variable"],
  thoughtContent: [
    "Normal",
    "Preoccupied",
    "Obsessions",
    "Delusions: Grandeur",
    "Delusions: Bizarre",
    "Delusions: Guilt",
    "Delusions: Ideas of reference",
    "Delusions: Persecutory",
    "Delusions: Somatic",
    "Delusions: Thought broadcasting",
    "Delusions: Thought control",
  ],
  thoughtProcess: [
    "Normal",
    "Blocking",
    "Circumstantial",
    "Flight of ideas",
    "Loose associations",
    "Perseveration",
    "Tangential",
  ],
  perception: [
    "Normal",
    "Auditory hallucinations",
    "Olfactory hallucinations",
    "Tactile hallucinations",
    "Visual hallucinations",
  ],
  interviewBehavior: [
    "Appropriate",
    "Angry",
    "Apathetic",
    "Argumentative",
    "Demanding",
    "Evasive",
    "Hostile",
    "Insolent",
    "Manipulative",
    "Withdrawn",
    "Uncooperative",
  ],
  speech: [
    "Normal",
    "Haitant",
    "Pressured",
    "Slurred",
    "Soft",
    "Stuttering",
    "Mute",
    "Verbose",
  ],
};

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
  attention: "Good",
  thoughtContent: "Normal",
  thoughtProcess: "Normal",
  perception: "Normal",
  interviewBehavior: "Appropriate",
  speech: "Normal",
  recommendations: "",
  date: "",
  time: "",
};

export default function EditMentalStatusExam() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const mentalStatusExamId = params.mentalStatusExamId as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [surveyAnswerId, setSurveyAnswerId] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<{
    legal_first_name: string;
    legal_last_name: string;
    preferred_first_name: string | null;
    date_of_birth: Date | null;
  } | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, error] = await fetchSurveyAnswer({
          id: mentalStatusExamId,
        });

        if (error || !data) {
          throw new Error(
            error?.message || "Failed to fetch mental status exam",
          );
        }

        // Set survey answer ID for update
        setSurveyAnswerId(data.id);

        // Set client info
        setClientInfo({
          legal_first_name: data.Client.legal_first_name,
          legal_last_name: data.Client.legal_last_name,
          preferred_first_name: data.Client.preferred_name,
          date_of_birth: data.Client.date_of_birth || null,
        });

        // Populate fields from fetched data
        if (data.content) {
          setFields({
            appearance: data.content.appearance || "",
            dress: data.content.dress || "",
            motorActivity: data.content.motor_activity || "",
            insight: data.content.insight || "",
            judgement: data.content.judgement || "",
            affect: data.content.affect || "",
            mood: data.content.mood || "",
            orientation: data.content.orientation || "",
            memory: data.content.memory || "",
            attention: data.content.attention || "",
            thoughtContent: data.content.thought_content || "",
            thoughtProcess: data.content.thought_process || "",
            perception: data.content.perception || "",
            interviewBehavior: data.content.interview_behavior || "",
            speech: data.content.speech || "",
            recommendations: data.content.recommendations || "",
            // Extract date and time from completed_at or current date
            date: data.completed_at
              ? new Date(data.completed_at).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            time: data.completed_at
              ? new Date(data.completed_at).toTimeString().slice(0, 5)
              : new Date().toTimeString().slice(0, 5),
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load mental status exam";
        toast({
          title: errorMessage,
          variant: "destructive",
        });
        router.push(`/clients/${clientId}/mentalStatusExam`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, mentalStatusExamId, router]);

  function handleChange(field: string, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fields.date || !fields.time) {
      toast({
        title: "Please fill in date and time",
        variant: "destructive",
      });
      return;
    }

    if (!surveyAnswerId) {
      toast({
        title: "Survey answer ID not found",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert field names to match API expectations (camelCase to snake_case)
      const content = {
        appearance: fields.appearance,
        dress: fields.dress,
        motor_activity: fields.motorActivity,
        insight: fields.insight,
        judgement: fields.judgement,
        affect: fields.affect,
        mood: fields.mood,
        orientation: fields.orientation,
        memory: fields.memory,
        attention: fields.attention,
        thought_content: fields.thoughtContent,
        thought_process: fields.thoughtProcess,
        perception: fields.perception,
        interview_behavior: fields.interviewBehavior,
        speech: fields.speech,
        recommendations: fields.recommendations,
      };

      // Create a timestamp from date and time
      // const examDateTime = new Date(`${fields.date}T${fields.time}`);

      const [response, error] = await updateSurveyAnswer({
        id: surveyAnswerId,
        content,
        status: "COMPLETED",
      });

      if (error || !response) {
        throw new Error(
          error?.message || "Failed to update mental status exam",
        );
      }

      toast({
        title: "Mental Status Exam updated successfully",
        variant: "success",
      });
      router.push(`/clients/${clientId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update mental status exam";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/clients/${clientId}/mentalStatusExam`);
  };

  if (isLoading) {
    return (
      <div className="px-4 w-full max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <p>Loading mental status exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 w-full max-w-6xl mx-auto">
      {/* Client Info */}
      <h1 className="text-2xl font-semibold mt-4 mb-1">
        {clientInfo
          ? `${clientInfo.preferred_first_name || clientInfo.legal_first_name} ${clientInfo.legal_last_name}`
          : "Loading..."}
      </h1>
      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
        {clientInfo?.date_of_birth && (
          <>
            {new Date().getFullYear() -
              new Date(clientInfo.date_of_birth).getFullYear() >=
            18
              ? "Adult"
              : "Minor"}
            <span className="text-gray-300">|</span>
          </>
        )}
        {clientInfo?.date_of_birth && (
          <>
            {new Date(clientInfo.date_of_birth).toLocaleDateString()}
            <span className="text-gray-300">|</span>
          </>
        )}
        <Link
          className="text-[#2d8467] hover:underline"
          href={`/scheduled?client_id=${clientId}`}
        >
          Schedule appointment
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          className="text-[#2d8467] hover:underline"
          href={`/clients/${clientId}/edit`}
        >
          Edit
        </Link>
      </div>

      {/* Section Title and All Normal */}
      <div className="flex items-center justify-between mt-8 mb-2 max-w-2xl">
        <h2 className="text-xl font-semibold">Edit Mental Status</h2>
        <button
          className="text-green-700 font-medium hover:underline text-sm"
          type="button"
          onClick={() => setFields((f) => ({ ...f, ...normalValues }))}
        >
          All Normal
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center gap-4"
      >
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
            <AutocompleteInput
              options={fieldOptions[key as keyof typeof fieldOptions] || []}
              value={fields[key as keyof typeof fields]}
              onChange={(value) => handleChange(key, value)}
              placeholder={`Select or type ${label.toLowerCase()}`}
              className="w-full h-10"
            />
          </div>
        ))}

        <div className="h-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recommendations
          </label>
          <ReactQuill
            className="bg-white w-[40%] h-28"
            placeholder="Begin typing here..."
            theme="snow"
            value={fields.recommendations}
            onChange={(val) => handleChange("recommendations", val)}
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
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="bg-[#2d8467] hover:bg-[#236c53] text-white"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Mental Status Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}
