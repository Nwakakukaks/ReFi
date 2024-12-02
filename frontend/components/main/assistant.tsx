import React, { useState } from "react";
import { Input } from "../ui/input";
import { useNavigate } from "react-router-dom";

export const Assistant: React.FC = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = () => {
    if (inputValue.trim()) {
      navigate("/assistant", { state: { message: inputValue } });
      setInputValue("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-6">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#5DEB5A] rounded-md p-3 shadow-lg focus:outline-none flex items-center space-x-3 cursor-pointer"
      >
        <img src="/icons/robot.svg" alt="Chat Icon" className="h-12 w-12" />
        {isOpen && <p className="text-xl font-medium text-gray-700 mt-2">Hi friend, I'm MoJi </p>}
      </div>

      {/* Chat dialog */}
      {isOpen && (
        <div className="bg-white shadow-lg rounded-lg mt-2 p-4 w-80 space-y-3 text-black">
          <div className="flex items-center space-x-1 justify-start">
            <p className="text-sm">Got a question? Let’s chat!</p>
          </div>

          <Input
            placeholder="Type a message.."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
      )}
    </div>
  );
};
