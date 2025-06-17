"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  Card,
  CardContent,
  Badge,
} from "@mcw/ui";
import Link from "next/link";
import { MessageCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@mcw/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { useRouter } from "next/navigation";
import GAD7Form from "./components/GAD7";
import PHQ9Form from "./components/PHQ9";
import ARM5Form from "./components/ARM5";

interface PageProps {
  params: { id: string };
  searchParams: { clientName?: string };
}

interface ClientGroupMembership {
  Client: {
    preferred_name?: string;
    legal_first_name?: string;
    legal_last_name?: string;
  };
}

interface ClientGroupData {
  name?: string;
  ClientGroupMembership?: ClientGroupMembership[];
}

// Helper function to extract client name from client group
function getClientGroupInfo(clientGroup: ClientGroupData) {
  try {
    console.log("getClientGroupInfo called with:", clientGroup);

    if (!clientGroup) {
      console.log("No client group provided");
      return "No Client Data";
    }

    // Handle different possible data structures
    const memberships = clientGroup.ClientGroupMembership || [];
    console.log("Memberships found:", memberships);

    if (!Array.isArray(memberships) || memberships.length === 0) {
      // Fallback to group name if no memberships
      console.log("No memberships, using group name:", clientGroup.name);
      return clientGroup.name || "Unknown Client";
    }

    const memberNames = memberships
      .map((membership: ClientGroupMembership) => {
        const client = membership.Client;
        if (!client) return "";

        const firstName =
          client.preferred_name || client.legal_first_name || "";
        const lastName = client.legal_last_name || "";
        const fullName = `${firstName} ${lastName}`.trim();
        console.log("Found member:", fullName);
        return fullName;
      })
      .filter(Boolean);

    const finalName =
      memberNames.length > 0
        ? memberNames.join(" & ")
        : clientGroup.name || "Unknown Client";
    console.log("Final client name:", finalName);
    return finalName;
  } catch (error) {
    console.error("Error extracting client group info:", error, clientGroup);
    return "Error Loading Client";
  }
}

export default function ScoredMeasure({ params, searchParams }: PageProps) {
  const router = useRouter();
  const clientGroupId = params.id; // This is actually the client group ID from the URL

  const [measure, setMeasure] = useState("GAD-7");
  const [gad7Answers, setGad7Answers] = useState<string[]>(Array(7).fill(""));
  const [gad7Difficulty, setGad7Difficulty] = useState<string>("");
  const [phq9Answers, setPhq9Answers] = useState<string[]>(Array(9).fill(""));
  const [phq9Difficulty, setPhq9Difficulty] = useState<string>("");
  const [arm5Answers, setArm5Answers] = useState<string[]>(Array(5).fill(""));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  interface SurveyScore {
    totalScore: number;
    severity?: string;
    interpretation?: string;
    flaggedItems?: string[];
  }

  const [score, setScore] = useState<SurveyScore | null>(null);

  // Fetch client group data
  const {
    data: clientGroup,
    isLoading: isLoadingClient,
    error: clientError,
  } = useQuery({
    queryKey: ["clientGroup", clientGroupId],
    queryFn: async () => {
      console.log("Fetching client group:", clientGroupId);
      const response = await fetch(`/api/client/group/${clientGroupId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Client group API error:", response.status, errorText);
        throw new Error(`Failed to fetch client group: ${response.status}`);
      }
      const data = await response.json();
      console.log("Client group API response:", data);
      return data;
    },
    enabled: !!clientGroupId,
    retry: 1,
  });

  // Get client name from either query params or fetched data
  const clientName = (() => {
    if (searchParams.clientName) {
      return searchParams.clientName;
    }

    if (isLoadingClient) {
      return "Loading...";
    }

    if (clientError) {
      console.error("Client group error:", clientError);
      return "Error loading client";
    }

    if (clientGroup?.data) {
      console.log("Client group data:", clientGroup.data);
      return getClientGroupInfo(clientGroup.data);
    }

    console.log("Client group response:", clientGroup);
    return "Client";
  })();

  // Fetch survey templates
  const { data: templatesData, error: templatesError } = useQuery({
    queryKey: ["surveyTemplates"],
    queryFn: async () => {
      const response = await fetch("/api/survey-templates");
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Survey templates API error:",
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to fetch templates: ${response.status} ${errorText}`,
        );
      }
      return response.json();
    },
    retry: 3,
    retryDelay: 1000,
  });

  interface SurveyAnswerData {
    template_id: string;
    client_group_id: string;
    content: Record<string, string>;
    status: string;
  }

  // Create survey answer mutation
  const { mutate: saveSurvey, isPending } = useMutation({
    mutationFn: async (data: SurveyAnswerData) => {
      const response = await fetch("/api/survey-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save survey");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setScore(data.score);
      toast({
        title: "Survey saved successfully",
        description: data.score
          ? `Score: ${data.score.totalScore} - ${data.score.severity}`
          : "Survey saved",
      });

      // Check for clinical alerts
      if (data.score?.flaggedItems?.length > 0) {
        toast({
          title: "⚠️ Clinical Alert",
          description: data.score.flaggedItems[0],
          variant: "destructive",
        });
      }

      // Redirect to client profile after 2 seconds
      setTimeout(() => {
        router.push(`/clients/${clientGroupId}?tab=measures`);
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save survey",
        variant: "destructive",
      });
    },
  });

  // Map answers to survey format
  const mapAnswersToSurveyFormat = () => {
    const answerMap: Record<string, string> = {
      "Not at all": "Item 1",
      "Several days": "Item 2",
      "Over half the days": "Item 3",
      "More than half the days": "Item 3", // PHQ-9 specific
      "Nearly every day": "Item 4",
      // ARM-5 specific
      "Strongly Disagree": "Item 1",
      Disagree: "Item 2",
      "Slightly Disagree": "Item 3",
      Neutral: "Item 4",
      "Slightly Agree": "Item 5",
      Agree: "Item 6",
      "Strongly Agree": "Item 7",
    };

    const content: Record<string, string> = {};

    if (measure === "GAD-7") {
      gad7Answers.forEach((answer, idx) => {
        if (answer) {
          content[`gad7_q${idx + 1}`] = answerMap[answer] || answer;
        }
      });
      if (gad7Difficulty) {
        content["gad7_q8"] = answerMap[gad7Difficulty] || gad7Difficulty;
      }
    } else if (measure === "PHQ-9") {
      phq9Answers.forEach((answer, idx) => {
        if (answer) {
          content[`phq9_q${idx + 1}`] = answerMap[answer] || answer;
        }
      });
      if (phq9Difficulty) {
        content["phq9_q10"] = answerMap[phq9Difficulty] || phq9Difficulty;
      }
    } else if (measure === "ARM-5") {
      arm5Answers.forEach((answer, idx) => {
        if (answer) {
          content[`arm5_q${idx + 1}`] = answerMap[answer] || answer;
        }
      });
    }

    return content;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all questions are answered
    let isValid = true;
    if (measure === "GAD-7") {
      isValid = gad7Answers.every((a) => a !== "") && gad7Difficulty !== "";
    } else if (measure === "PHQ-9") {
      isValid = phq9Answers.every((a) => a !== "") && phq9Difficulty !== "";
    } else if (measure === "ARM-5") {
      isValid = arm5Answers.every((a) => a !== "");
    }

    if (!isValid) {
      toast({
        title: "Incomplete form",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Find the template ID
    interface SurveyTemplate {
      id: string;
      name: string;
    }

    const template = templatesData?.data?.find((t: SurveyTemplate) =>
      t.name.toLowerCase().includes(measure.toLowerCase()),
    );

    if (!template) {
      toast({
        title: "Error",
        description: "Survey template not found",
        variant: "destructive",
      });
      return;
    }

    // Save the survey
    saveSurvey({
      template_id: template.id,
      client_group_id: clientGroupId,
      content: mapAnswersToSurveyFormat(),
      status: "COMPLETED",
    });
  };

  // Check for PHQ-9 suicidal ideation
  const showSuicidalIdeationWarning =
    measure === "PHQ-9" && phq9Answers[8] && phq9Answers[8] !== "Not at all";

  // Show error states
  if (clientError) {
    return (
      <div className="px-4 py-8 w-full max-w-6xl mx-auto">
        <Alert className="mb-4 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error loading client:</strong>{" "}
            {clientError instanceof Error
              ? clientError.message
              : "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="px-4 py-8 w-full max-w-6xl mx-auto">
        <Alert className="mb-4 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error loading survey templates:</strong>{" "}
            {templatesError instanceof Error
              ? templatesError.message
              : "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      {/* Breadcrumb and Message Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-1">
          <Link className="hover:underline" href="/clients">
            Clients and contacts
          </Link>
          <span>/</span>
          <Link className="hover:underline" href={`/clients/${clientGroupId}`}>
            {clientName}&apos;s profile
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Scored measure</span>
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
        {new Date().toLocaleDateString()}
        <span className="text-gray-300">|</span>
        <Link
          className="text-[#2d8467] hover:underline"
          href={`/calendar?clientId=${clientGroupId}`}
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

      {/* Section Title and Subtext */}
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-xl font-semibold">Scored measure</h2>
        <div className="text-sm text-gray-600">
          Completing on behalf of {clientName}. For client completion,{" "}
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

      {/* Clinical Alert for PHQ-9 */}
      {showSuicidalIdeationWarning && (
        <Alert className="mb-4 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Clinical Alert:</strong> Client has indicated thoughts of
            self-harm. Immediate clinical attention and safety assessment
            required.
          </AlertDescription>
        </Alert>
      )}

      {/* Score Display */}
      {score && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{measure} Score</h3>
                <p className="text-sm text-gray-600">{score.interpretation}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{score.totalScore}</div>
                {score.severity && (
                  <Badge variant="outline" className="mt-1">
                    {score.severity}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questionnaire */}
      <form className="space-y-6" onSubmit={handleSubmit}>
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
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/clients/${clientGroupId}?tab=measures`)
            }
          >
            Cancel
          </Button>
          <Button
            className="bg-[#2d8467] hover:bg-[#236c53] text-white"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
