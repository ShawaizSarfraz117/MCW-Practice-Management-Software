import React from "react";
import {
  parseSurveyContent,
  formatFieldName,
  isEmptyValue,
  containsHtmlTags,
  getDisplayContent,
  type ParsedContent,
} from "../utils/noteParser";

interface SurveyContentDisplayProps {
  content: string | null | undefined;
  className?: string;
  borderColor?: string;
}

interface FieldDisplayProps {
  fieldKey: string;
  value: unknown;
  borderColor?: string;
}

function FieldDisplay({
  fieldKey,
  value,
  borderColor = "border-purple-200",
}: FieldDisplayProps) {
  if (isEmptyValue(value)) return null;

  const renderValue = () => {
    if (typeof value === "object") {
      return (
        <pre className="whitespace-pre-wrap text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    const stringValue = String(value);
    if (containsHtmlTags(stringValue)) {
      return <div dangerouslySetInnerHTML={{ __html: stringValue }} />;
    }

    return <div>{stringValue}</div>;
  };

  return (
    <div className={`border-l-2 ${borderColor} pl-3`}>
      <div className="font-medium text-gray-800 text-sm mb-1">
        {formatFieldName(fieldKey)}:
      </div>
      <div className="text-gray-700 text-sm">{renderValue()}</div>
    </div>
  );
}

function ParsedContentDisplay({
  content,
  borderColor,
}: {
  content: ParsedContent;
  borderColor?: string;
}) {
  return (
    <div className="space-y-3">
      {Object.entries(content).map(([key, value]) => (
        <FieldDisplay
          key={key}
          borderColor={borderColor}
          fieldKey={key}
          value={value}
        />
      ))}
    </div>
  );
}

function DefaultContentDisplay({ content }: { content: ParsedContent }) {
  const displayContent = getDisplayContent(content);

  if (typeof displayContent === "string") {
    return <div dangerouslySetInnerHTML={{ __html: displayContent }} />;
  }

  return (
    <pre className="whitespace-pre-wrap text-xs">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

export function SurveyContentDisplay({
  content,
  className = "",
  borderColor,
}: SurveyContentDisplayProps) {
  if (!content) {
    return <div className={className}>No content available</div>;
  }

  const parsedContent = parseSurveyContent(content);

  if (!parsedContent) {
    return <div className={className}>Error parsing content: {content}</div>;
  }

  // If content has multiple fields, display them individually
  const hasMultipleFields =
    Object.keys(parsedContent).length > 1 ||
    !["summary", "content", "description"].some((key) => key in parsedContent);

  return (
    <div className={className}>
      {hasMultipleFields ? (
        <ParsedContentDisplay
          borderColor={borderColor}
          content={parsedContent}
        />
      ) : (
        <DefaultContentDisplay content={parsedContent} />
      )}
    </div>
  );
}
