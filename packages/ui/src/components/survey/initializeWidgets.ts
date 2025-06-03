import React from "react";
import { ComponentCollection, Serializer } from "survey-core";
import { ReactQuestionFactory } from "survey-react-ui";
import {
  QuestionReactQuillModel,
  ReactQuillQuestion,
} from "./ReactQuillWidget";

let initialized = false;

export function ensureCustomWidgetsInitialized() {
  if (initialized || typeof window === "undefined") {
    return;
  }

  try {
    Serializer.addClass(
      "reactquill",
      [
        {
          name: "placeholder",
          category: "general",
          visibleIndex: 3,
        },
      ],
      function () {
        return new QuestionReactQuillModel("");
      },
      "question",
    );
    const renderQuill = ((props: { question: QuestionReactQuillModel }) => {
      return React.createElement(ReactQuillQuestion, {
        question: props.question,
      });
    }) as unknown as (name: string) => React.JSX.Element;

    ReactQuestionFactory.Instance.registerQuestion("reactquill", renderQuill);

    const customWidgetCollection = {
      name: "reactquill",
      title: "Rich Text Editor",
      iconName: "icon-editor",
      category: "text",
      widgetIsLoaded: () => true,
      isFit: (question: { getType: () => string }) =>
        question.getType() === "reactquill",
      json: {
        type: "reactquill",
        placeholder: "Enter your rich text here...",
      },
    };

    ComponentCollection.Instance.add(customWidgetCollection);

    initialized = true;
    console.log("Custom widgets initialized successfully");
  } catch (error) {
    console.error("Failed to initialize custom widgets:", error);
  }
}
