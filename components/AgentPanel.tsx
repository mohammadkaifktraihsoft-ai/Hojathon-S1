"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/app/actions/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Send, Loader2, Bot, User } from "lucide-react";

type Message = {
  role: "user" | "model";
  parts: { text: string }[];
};

export function AgentPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", parts: [{ text: "Hello! I am your Follow-up Care Agent. How can I help you today? E.g., 'What are my next steps?' or 'I missed my appointment.'" }] }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", parts: [{ text }] };
    // Optimistic UI update
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessage(messages, text);
      
      if (response.success && response.text) {
        setMessages((prev) => [
          ...prev,
          { role: "model", parts: [{ text: response.text as string }] }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", parts: [{ text: `Error: ${response.error || "Failed to process request."}` }] }
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: [{ text: "Network error. Please try again later." }] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md h-[600px] flex flex-col shadow-lg border-2">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot size={20} />
          Follow-up AI Agent
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
                }`}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`rounded-lg p-3 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                  <Bot size={16} />
                </div>
                <div className="rounded-lg p-3 bg-muted text-foreground flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 bg-card border-t">
        <form 
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <Input 
            placeholder="Type a message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
