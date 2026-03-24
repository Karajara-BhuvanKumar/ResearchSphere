import { useMemo, useState } from "react";
import { Bot, MessageSquare, Send, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  queryResearchAssistant,
  type AssistantAnswer,
  type AssistantContext,
} from "@/services/apiClient";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  answer?: AssistantAnswer;
};

const starterPrompts = [
  "ML conferences in March",
  "Blockchain papers",
  "PhD opportunities in AI",
];

const AssistantWidget = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<AssistantContext>({});
  const [chat, setChat] = useState<ChatTurn[]>([
    {
      id: "widget-welcome",
      role: "assistant",
      text: "Hi! I can find conferences, papers, and opportunities from your platform data.",
    },
  ]);

  const latestAnswer = useMemo(() => {
    for (let index = chat.length - 1; index >= 0; index -= 1) {
      if (chat[index].role === "assistant" && chat[index].answer) {
        return chat[index].answer;
      }
    }
    return undefined;
  }, [chat]);

  const submit = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setChat((prev) => [
      ...prev,
      { id: `widget-u-${Date.now()}`, role: "user", text: trimmed },
    ]);
    setQuery("");

    try {
      const answer = await queryResearchAssistant(trimmed, context);
      setContext((prev) => ({
        ...prev,
        lastParsed: answer.parsed,
      }));

      setChat((prev) => [
        ...prev,
        {
          id: `widget-a-${Date.now()}`,
          role: "assistant",
          text: answer.text,
          answer,
        },
      ]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          id: `widget-a-${Date.now()}`,
          role: "assistant",
          text: "I’m temporarily unavailable. Please check backend connection and try again.",
        },
      ]);
      console.error("Assistant widget failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <Button
          onClick={() => setOpen(true)}
          className="h-12 px-4 rounded-full shadow-lg gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Assistant
        </Button>
      ) : (
        <Card className="w-[360px] max-w-[92vw] shadow-xl border border-border">
          <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Research Assistant</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-3 space-y-3">
            <div className="h-60 overflow-y-auto space-y-2 pr-1">
              {chat.map((turn) => (
                <div
                  key={turn.id}
                  className={`text-xs rounded-md px-2.5 py-2 ${
                    turn.role === "user"
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted mr-2"
                  }`}
                >
                  {turn.text}
                </div>
              ))}
            </div>

            {latestAnswer?.results?.length ? (
              <div className="space-y-2 max-h-28 overflow-y-auto border border-border rounded-md p-2">
                {latestAnswer.results.slice(0, 3).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-foreground hover:text-primary"
                  >
                    <span className="line-clamp-1">{item.title}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      {item.kind} <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  </a>
                ))}
              </div>
            ) : null}

            <div className="flex gap-1 flex-wrap">
              {starterPrompts.map((prompt) => (
                <Badge
                  key={prompt}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => submit(prompt)}
                >
                  {prompt}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submit(query);
                  }
                }}
                placeholder="Ask anything..."
                className="h-9 text-xs"
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="h-9 w-9"
                onClick={() => submit(query)}
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssistantWidget;
