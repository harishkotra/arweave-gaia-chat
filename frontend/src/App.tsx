import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const USER_AVATAR_URL = "https://avatar.iran.liara.run/public"; // Replace with your user avatar URL
const ASSISTANT_AVATAR_URL = "https://avatar.iran.liara.run/public/girl"; // Replace with your assistant avatar URL

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setPrompt('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3001/api/arweave', { prompt });
      const assistantMessage: ChatMessage = { role: 'assistant', content: JSON.stringify(response.data.result, null, 2) };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = { role: 'assistant', content: `Error: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom of chat on new messages
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-2xl p-4">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Arweave + Gaia Chat</CardTitle>
          <CardDescription className="text-center">Chat with an AI assistant to interact with Arweave and Gaia's AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start p-3 rounded-md transition-opacity duration-300", // Added transition-opacity
                  message.role === 'user' ? "bg-blue-100 text-blue-800 self-end opacity-0 animate-fade-in-right" : "bg-gray-100 text-gray-800 self-start opacity-0 animate-fade-in-left" // Added opacity-0 and animation
                )}
                style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <Avatar className="mr-3">
                  <AvatarImage src={message.role === 'user' ? USER_AVATAR_URL : ASSISTANT_AVATAR_URL} alt={message.role} />
                  <AvatarFallback>{message.role === 'user' ? "U" : "A"}</AvatarFallback>
                </Avatar>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            <div ref={chatContainerRef} /> {/* Scroll anchor */}
          </div>
          <form onSubmit={handleSubmit} className="mt-4 flex space-x-2">
            <Input
              type="text"
              placeholder="Enter your Arweave request"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;