import { useMutation } from "@tanstack/react-query";

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function useSendEmail() {
  return useMutation({
    mutationFn: async (payload: SendEmailPayload) => {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send email");
      }

      return response.json();
    },
  });
}
