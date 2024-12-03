import React, { useState } from "react";

import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { useNavigate } from "react-router-dom";

const Creator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const BeginSetup = () => (
    <div className="text-center p-10">
      <h2 className="text-2xl font-semibold mb-4">Welcome to ReFi</h2>
      <p className="text-gray-300 text-sm">Get started in just two quick steps</p>

      <div className="grid grid-cols-2 gap-5 mx-48 mt-8">
        <div className="w-full h-full">
          <p>Step 1</p>
          <Card className="bg-transparent text-gray-400 border-gray-600 border-2 rounded-sm mt-2 p-6">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center">
                  <img src="/icons/wallet.svg" className="h-16 w-16 p-2 rounded-sm mx-auto" alt="Wallet icon" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white mb-3 text-lg font-medium">Create Your Membership NFT</p>
              <p className="text-gray-400 text-sm">
                Create a membership token to reward contributors granting them access to exclusive content
                across all your platforms.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="w-full h-full">
          <p>Step 2</p>
          <Card className="bg-transparent text-gray-400 border-gray-600 border-2 rounded-sm mt-2 p-6">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center">
                  <img src="/icons/member.svg" className="h-16 w-16 p-2 rounded-sm mx-auto" alt="Member icon" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white mb-3 text-lg font-medium">Start Your Live Stream Session</p>
              <p className="text-gray-400 text-sm">
                Begin a live stream and paste your live stream URL and Near wallet address, then generate a link to
                share in your chat.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const steps = [
    { title: "", content: <BeginSetup /> },

  ];

  const handleProceed = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      
      navigate("/create-link");
    }
  };

  return (
    <div className="text-center bg-gray-90 rounded-lg p-4 h-[80vh]">
      <div className="">
        <h2 className="text-xl mb-4 text-white">{steps[currentStep].title}</h2>
        {steps[currentStep].content}
        <div className="flex justify-center mt-2">
          <Button
            size={"lg"}
            className="bg-[#CC0000] text-white py-2 px-20 hover:bg-[#CC0000] rounded-full"
            onClick={handleProceed}
          >
            {currentStep < steps.length - 1 ? "Proceed" : "Start Live Stream"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Creator;