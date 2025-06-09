/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect } from "react";
import { Button, Input, toast } from "@mcw/ui";
import Link from "next/link";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { AutocompleteInput } from "./components/AutocompleteInput";
import { useParams, useRouter } from "next/navigation";
import { createMentalStatusExamAnswer } from "./services/surveyAnswer.service";
import { fetchSingleClientGroup } from "@/(dashboard)/clients/services/client.service";
import { fetchSurveyTemplateByType } from "@/(dashboard)/clients/services/surveyTemplate.service";
import { ClientGroupFromAPI } from "../edit/components/ClientEdit";
import { getClientGroupInfo } from "../components/ClientProfile";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface FieldOption {
  value: string;
  text: string;
}

interface SurveyElement {
  type: string;
  name: string;
  title: string;
  choices?: FieldOption[];
  showOtherItem?: boolean;
  inputType?: string;
}

interface SurveyContent {
  pages: Array<{
    name: string;
    elements: SurveyElement[];
  }>;
  headerView?: string;
}

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

// Map survey field names to state field names
const fieldNameMapping: Record<string, string> = {
  appearance: "appearance",
  Dress: "dress",
  motor_activity: "motorActivity",
  insight: "insight",
  judgement: "judgement",
  affect: "affect",
  mood: "mood",
  orientation: "orientation",
  memory: "memory",
  attention: "attention",
  thought_content: "thoughtContent",
  question3: "thoughtProcess", // Based on the JSON, question3 is Thought Process
  perception: "perception",
  interview_behavior: "interviewBehavior",
  speech: "speech",
};

export default function MentalStatusExam() {
  const params = useParams();
  const router = useRouter();
  const clientGroupId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<Record<string, string[]>>(
    {},
  );
  const [clientInfo, setClientInfo] = useState<ClientGroupFromAPI | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client info
        const data = (await fetchSingleClientGroup({
          id: clientGroupId,
          searchParams: {
            includeProfile: "true",
            includeAdress: "true",
          },
        })) as { data: ClientGroupFromAPI } | null;
        if (data?.data) {
          setClientInfo(data?.data);
        }
        // Fetch survey template for mental status exam
        const [surveyTemplate, error] =
          await fetchSurveyTemplateByType("mental_status_exam");

        if (surveyTemplate && !error) {
          // Parse the content if it's a string
          const content: SurveyContent =
            typeof surveyTemplate.content === "string"
              ? JSON.parse(surveyTemplate.content)
              : surveyTemplate.content;

          // Extract field options from the survey template
          const options: Record<string, string[]> = {};

          if (content.pages && content.pages.length > 0) {
            content.pages[0].elements.forEach((element) => {
              if (element.type === "dropdown" && element.choices) {
                const stateFieldName =
                  fieldNameMapping[element.name] || element.name;
                options[stateFieldName] = element.choices.map(
                  (choice) => choice.text,
                );
              }
            });
          }

          setFieldOptions(options);
          // Store the template ID for later use
          setTemplateId(surveyTemplate.id);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [clientGroupId]);

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

      // Check if we have the template ID from the initial load
      if (!templateId) {
        throw new Error("Mental Status Exam template not found");
      }
      if (!clientInfo?.ClientGroupMembership[0]?.Client?.id) {
        toast({
          title: "Client not found",
          variant: "destructive",
        });
        return;
      }
      const [response, error] = await createMentalStatusExamAnswer({
        client_id: clientInfo?.ClientGroupMembership[0]?.Client?.id || "",
        template_id: templateId,
        content,
        status: "COMPLETED",
      });

      if (error || !response) {
        throw new Error(error?.message || "Failed to save mental status exam");
      }

      toast({
        title: "Mental Status Exam saved successfully",
        variant: "success",
      });

      router.push(`/clients/${clientGroupId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save mental status exam";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/clients/${clientGroupId}`);
  };

  return (
    <div className="px-4 w-full max-w-6xl mx-auto">
      {/* Client Info */}
      <h1 className="text-2xl font-semibold mt-4 mb-1">
        {clientInfo ? getClientGroupInfo(clientInfo) : "Loading..."}
      </h1>
      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
        {clientInfo?.ClientGroupMembership[0]?.Client?.date_of_birth && (
          <>
            {clientInfo.type}
            <span className="text-gray-300">|</span>
          </>
        )}
        {clientInfo?.ClientGroupMembership[0]?.Client?.date_of_birth && (
          <>
            {new Date(
              clientInfo.ClientGroupMembership[0]?.Client?.date_of_birth,
            ).toLocaleDateString()}
            <span className="text-gray-300">|</span>
          </>
        )}
        <Link
          className="text-[#2d8467] hover:underline"
          href={`/scheduled?client_id=${clientGroupId}`}
        >
          Schedule appointment
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          className="text-[#2d8467] hover:underline"
          href={`/clients/${clientGroupId}/edit`}
        >
          Edit
        </Link>
      </div>

      {/* Section Title and All Normal */}
      <div className="flex items-center justify-between mt-8 mb-2 max-w-2xl">
        <h2 className="text-xl font-semibold">Current Mental Status</h2>
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
              options={fieldOptions[key] || []}
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
            {isSubmitting ? "Saving..." : "Save Mental Status Exam"}
          </Button>
        </div>
      </form>
    </div>
  );
}
