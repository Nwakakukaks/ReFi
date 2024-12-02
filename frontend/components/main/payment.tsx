import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { paymentContract, paymentAbi } from "@/constants";


const Payment: React.FC = () => {
  const { address } = useAccount();
  const { writeContract, data: txHash } = useWriteContract();
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [videoId] = useState(new URLSearchParams(window.location.search).get("vid") || "");
  const [recipientAddress] = useState(new URLSearchParams(window.location.search).get("lnaddr") || "");

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const sendSuperBase = async () => {
    console.log("Starting sendSuperBase function");
    console.log("Current state:", {
      address,
      message,
      amount,
      recipientAddress,
      videoId,
    });

    if (!address) {
      console.error("Wallet not connected");
      toast({
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    if (!recipientAddress) {
      console.error("Recipient address is missing");
      toast({
        title: "Error",
        description: "Recipient address is missing",
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { 
      console.error("Invalid amount:", amount);
      toast({
        title: "Error",
        description: "Please enter a valid amount",
      });
      return;
    }

    if (!message) {
      console.error("Message is empty");
      toast({
        title: "Error",
        description: "Please enter a message",
      });
      return;
    }

    if (message && amount && recipientAddress) {
      setLoading(true);
      console.log("Preparing transaction with params:", {
        recipientAddress,
        amount,
        contract: paymentContract,
      });

      try {
        console.log("Converting amount to Wei:", amount);
        const amountInWei = parseEther(amount);
        console.log("Amount in Wei:", amountInWei);

        console.log("Initiating contract write...");
        const tx = await writeContract({
          address: paymentContract,
          abi: paymentAbi,
          functionName: "payment",
          args: [recipientAddress],
          value: amountInWei,
        });

        console.log("Transaction initiated:", tx);
      } catch (error) {
        console.error("Detailed error in sending payment:", {
          error,
          errorMessage: error,
          errorCode: error,
        });

        setLoading(false);
      }
    } else {
      console.log("Validation failed:", {
        hasMessage: !!message,
        hasAmount: !!amount,
        hasRecipient: !!recipientAddress,
      });
      toast({
        title: "Error",
        description: "Please fill in all fields",
      });
    }
  };

  const showSuccessMessage = async () => {
    console.log("Showing success message");
    await generateClaimUrl();
    setSuccessMessage(`Your Superchat has been posted ⚡⚡`);
  };

  const generateClaimUrl = async () => {
    console.log("Generating claim URL for:", { videoId, recipientAddress });

    if (videoId && recipientAddress) {
      try {
        console.log("Making API request to generate short URL");
        const response = await fetch("https://aptopus-backend.vercel.app/generate-short-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId, address: recipientAddress }),
        });
        const data = await response.json();
        console.log("API response:", data);

        if (data.error) {
          console.error("API returned error:", data.error);
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error,
          });
        } else {
          const claimUrl = `${window.location.origin}/c/${data.shortCode}`;
          console.log("Generated claim URL:", claimUrl);
          setGeneratedUrl(claimUrl);
        }
      } catch (error) {
        console.error("Error generating claim URL:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `An error occurred: ${error}`,
        });
      }
    } else {
      console.error("Missing required parameters:", { videoId, recipientAddress });
      toast({
        variant: "default",
        title: "Claim Link Error",
        description: "Failed to generate Claim Link - Missing parameters",
      });
    }
  };

  React.useEffect(() => {
    console.log("Transaction status changed:", {
      isConfirmed,
      txHash,
      isConfirming,
    });

    if (isConfirmed && txHash) {
      console.log("Transaction confirmed:", txHash);
      setLoading(true);
    
      fetch("https://aptopus-backend.vercel.app/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          amount,
          videoId,
          address: recipientAddress,
          hash: txHash,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Backend response:", data);
          if (data.success) {
            toast({
              title: "Success",
              description: `Payment sent successfully! Transaction hash: ${txHash}`,
            });
            showSuccessMessage();
          } else {
            toast({
              title: "Error",
              description: "Payment processing failed. Please try again.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error("Backend error:", error);
          toast({
            title: "Error",
            description: "An error occurred while processing the payment.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isConfirmed, txHash]);

  return (
    <div className="flex flex-col gap-3 justify-center items-center mx-auto h-[75vh]">
      {!address ? (
        <div className="">
     
        </div>
      ) : (
        <div className={`bg-white rounded-lg shadow-md px-6 py-12 w-[85%]`}>
          <h1 className="text-2xl text-[#5DEB5A]">Superbase </h1>
          <Input
            name="message"
            placeholder="Enter your Superchat message"
            type="text"
            maxLength={220}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded p-2 mt-2 mb-4 text-gray-800"
          />
          <Input
            name="amount"
            placeholder="Amount in ETH"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded p-2 mt-2 mb-4 text-gray-800"
          />
          <Button
            id="send-superchat-button"
            onClick={sendSuperBase}
            disabled={loading || isConfirming}
            className={`w-full bg-gradient-to-br from-[#5DEB5A] to-[#5DEB5A] text-white rounded p-2 transition-all duration-300 ${
              loading || isConfirming ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading || isConfirming ? "Sending..." : "Send Superchat"}
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="bg-white text-gray-900 rounded-md p-2 mt-1 w-[90%]">
          <h2 className="text-base font-semibold">Payment Successful!</h2>
          <p className="text-sm">{successMessage}</p>
          <p className="text-xs mt-2">
            Hurray! claim your token here:{" "}
            <a href={generatedUrl} className="text-[#5DEB5A]">
              {generatedUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default Payment;
