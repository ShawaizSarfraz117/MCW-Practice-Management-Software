"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Question } from "survey-core";

interface ReactQuillWidgetProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function ReactQuillWidget({
  question: _question,
  value,
  onChange,
  readOnly = false,
  placeholder = "Enter your text here...",
}: ReactQuillWidgetProps) {
  const [editorValue, setEditorValue] = useState(value || "");
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (value !== editorValue) {
      setEditorValue(value || "");
    }
  }, [value, editorValue]);

  const handleChange = useCallback(
    (content: string) => {
      setEditorValue(content);
      onChange(content);
    },
    [onChange],
  );

  const modules = {
    toolbar: readOnly
      ? false
      : [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          [{ align: [] }],
          ["link"],
          ["clean"],
        ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "blockquote",
    "code-block",
    "align",
    "link",
  ];

  return (
    <div className={`react-quill-widget ${readOnly ? "readonly" : ""}`}>
      <ReactQuill
        ref={quillRef}
        className="min-h-[150px]"
        formats={formats}
        modules={modules}
        placeholder={placeholder}
        readOnly={readOnly}
        theme="snow"
        value={editorValue}
        onChange={handleChange}
      />
    </div>
  );
}

export class QuestionReactQuillModel extends Question {
  getType(): string {
    return "reactquill";
  }

  get placeholder(): string {
    return this.getPropertyValue("placeholder", "");
  }

  set placeholder(val: string) {
    this.setPropertyValue("placeholder", val);
  }
}

export const ReactQuillQuestion: React.FC<{
  question: QuestionReactQuillModel;
}> = ({ question }) => {
  const handleChange = useCallback(
    (newValue: string) => {
      question.value = newValue;
    },
    [question],
  );

  return (
    <ReactQuillWidget
      placeholder={question.placeholder}
      question={question}
      readOnly={question.isReadOnly}
      value={question.value || ""}
      onChange={handleChange}
    />
  );
};

interface QuestionProps {
  question: QuestionReactQuillModel;
  [key: string]: unknown;
}

export type { QuestionProps };
