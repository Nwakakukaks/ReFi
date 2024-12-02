import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getGroqChatCompletion } from "@/utils/groq";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type Message = {
  sender: "user" | "ai";
  content: string;
};

export const AssistantPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const hasInitialMessageProcessed = useRef(false);

  useEffect(() => {
    const initialMessage = location.state?.message || "";
    if (initialMessage && !hasInitialMessageProcessed.current) {
      handleInitialMessage(initialMessage);
      hasInitialMessageProcessed.current = true;
    }
  }, [location.state]);

  const handleInitialMessage = async (msg: string) => {
    setMessages((prev) => [...prev, { sender: "user", content: msg }]);


    const response = await getGroqChatCompletion(msg);
    const aiMessage = response.choices[0]?.message?.content || "No response received.";

    setMessages((prev) => [...prev, { sender: "ai", content: aiMessage }]);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", content: message }]);

   
    const response = await getGroqChatCompletion(message);
    const aiMessage = response.choices[0]?.message?.content || "No response received.";

    setMessages((prev) => [...prev, { sender: "ai", content: aiMessage }]);
    setMessage("");
  };

  const handleNavigate = () => {
    navigate(-1);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="h-[88vh]">
      <div onClick={handleNavigate} className="flex items-center space-x-2 cursor-pointer my-2">
        <img src="/icons/robot.svg" className="w-8 h-8 " />
        <p className="mt-2 text-gray-200"> Welcome to MoJi</p>
      </div>

      <Separator />

      {/* Chat Area */}
      <div className="flex flex-col w-full my-4 flex-grow h-[70%] overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`flex justify-${msg.sender === "user" ? "end" : "start"} w-full mb-3`}>
            <div
              className={`flex items-start space-x-2 ${msg.sender === "user" ? "bg-[#5DEB5A]" : "bg-primary"} p-2 rounded-lg shadow`}
            >
              <img src={`/icons/${msg.sender === "user" ? "profile" : "AI"}.svg`} className="h-6 w-6" />
              <p className={msg.sender === "user" ? "text-black" : "text-gray-400"}>{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input Area */}
      <Separator />
      <div className="flex items-center w-full mt-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded-2xl p-2 border-gray-300 bg-transparent active:border-none"
          onKeyPress={handleKeyPress}
        />
        <Button onClick={handleSend} className="ml-2 bg-[#5DEB5A] hover:bg-[#5DEB5A] text-black rounded-full py-2 px-5">
          <p> Send message</p>
        </Button>
      </div>
    </div>
  );
};
