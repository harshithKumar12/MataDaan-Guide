import { ChatMessage } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export async function* sendMessageStream(history: ChatMessage[], message: string) {
  try {
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        systemInstruction: SYSTEM_INSTRUCTION
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to connect to AI server.");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable.");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield `Error: ${error instanceof Error ? error.message : "Unable to connect to the AI service."}`;
  }
}
