import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { useAccount, useNetwork, useWalletClient } from "wagmi";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { payRequest, hasSufficientFunds, hasErc20Approval, approveErc20 } from "@requestnetwork/payment-processor";
import { Web3SignatureProvider } from "@requestnetwork/web3-signature";
import { useEthersV5Signer } from "@/hooks/use-ethers-signer";
import { useEthersV5Provider } from "@/hooks/use-ethers-provider";
import { currencies } from "@/hooks/currency";
import { storageChains } from "@/hooks/storage-chain";

const Payment: React.FC = () => {
  const { chain } = useNetwork();
  const provider = useEthersV5Provider();
  const signer = useEthersV5Signer();
  const [storageChain] = useState(() => {
    const chains = Array.from(storageChains.keys());
    return chains.length > 0 ? chains[0] : "";
  });

  // Wallet connection
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [currency] = useState(() => {
    const currencyKeys = Array.from(currencies.keys());
    return currencyKeys.length > 0 ? currencyKeys[0] : "";
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Request Network specific states
  const [requestData, setRequestData] = useState<Types.IRequestDataWithEvents>();
  const [requestId] = useState(new URLSearchParams(window.location.search).get("requestId") || "");
  const [recipientAddress] = useState(new URLSearchParams(window.location.search).get("lnaddr") || "");
  const [videoId] = useState(new URLSearchParams(window.location.search).get("vid") || "");

  const payTheRequest = async () => {
    console.log("Starting payTheRequest function");

    if (!requestId) {
      console.error("No request ID found");
      toast({
        title: "Error",
        description: "No request found to pay",
      });
      return;
    }

    const selectedCurrency = currencies.get(currency);
    const selectedStorageChain = storageChains.get(storageChain);

    if (!selectedCurrency || !selectedStorageChain) {
      console.error("Invalid currency or storage chain configuration", {
        currency,
        storageChain,
      });
      toast({
        title: "Configuration Error",
        description: "Invalid currency or storage chain configuration",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      console.log("Setting up signature provider and request client");

      const signatureProvider = new Web3SignatureProvider(walletClient);
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: selectedStorageChain.gateway,
        },
        signatureProvider,
      });

      console.log("Fetching request data for requestId:", requestId);
      const request = await requestClient.fromRequestId(requestId);
      const requestData = request.getData();

      console.log("Request data retrieved:", {
        network: requestData.currencyInfo.network,
        expectedAmount: requestData.expectedAmount,
        currency: requestData.currency,
      });

      if (!requestData.expectedAmount || requestData.expectedAmount === "0") {
        console.error("Invalid amount for payment");
        toast({
          title: "Payment Error",
          description: "Invalid payment amount",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (requestData.currencyInfo.network !== chain?.network) {
        console.error("Network mismatch", {
          requestNetwork: requestData.currencyInfo.network,
          currentNetwork: chain?.network,
        });
        toast({
          title: "Network Mismatch",
          description: `Please switch to ${requestData.currencyInfo.network}`,
        });
        setLoading(false);
        return;
      }

      console.log("Checking for sufficient funds");
      const hasFunds = await hasSufficientFunds({
        request: requestData,
        address: address as string,
        providerOptions: {
          provider: provider,
        },
      });

      if (!hasFunds) {
        console.error("Insufficient funds for the request");
        toast({
          title: "Insufficient Funds",
          description: "You do not have enough funds to pay this request",
        });
        setLoading(false);
        return;
      }

      console.log("Checking ERC20 approval");
      const _hasErc20Approval = await hasErc20Approval(requestData, address as string, provider);
      if (!_hasErc20Approval) {
        console.log("Requesting ERC20 approval");
        const approvalTx = await approveErc20(requestData, signer);
        await approvalTx.wait(2);
        console.log("ERC20 approval transaction completed");
      }

      console.log("Paying the request");
      const paymentTx = await payRequest(requestData, signer);
      await paymentTx.wait(2);

      if (paymentTx.hash) {
        console.log(`Payment successful, transaction hash: ${paymentTx.hash}`);
      }

      const ethereumAmount = Number(requestData.expectedAmount) / Math.pow(10, 18);

      console.log(`Preparing API call to confirm payment with params`, {
        message,
        amount: ethereumAmount,
        videoId,
        address: recipientAddress,
        hash: paymentTx.hash,
      });

      const backendResponse = await fetch("https://aptopus-backend.vercel.app/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          amount: ethereumAmount,
          videoId,
          address: recipientAddress,
          hash: paymentTx.hash,
        }),
      });

      console.log("API call made, waiting for response");
      const data = await backendResponse.json();

      if (data.success) {
        console.log("Backend payment confirmation successful");
        toast({
          title: "Success",
          description: `Payment sent successfully! Transaction hash: ${paymentTx.hash}`,
        });

        setSuccessMessage(`Your Superchat has been posted ⚡⚡ successfully`);
      } else {
        console.error("Backend payment confirmation failed", data);
        toast({
          title: "Error",
          description: "Payment processing failed. Please try again.",
          variant: "destructive",
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Comprehensive payment error:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing the payment",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadRequestData = async () => {
      if (requestId) {
        try {
          const requestClient = new RequestNetwork({
            nodeConnectionConfig: {
              baseURL: storageChains.get(storageChain)!.gateway,
            },
          });

          const request = await requestClient.fromRequestId(requestId);
          setRequestData(request.getData());
        } catch (error) {
          console.error("Error loading request data:", error);
          toast({
            title: "Error",
            description: "Could not load request details",
            variant: "destructive",
          });
        }
      }
    };

    loadRequestData();
  }, [requestId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 ">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#CC0000] mb-2 flex justify-center items-center">
              ReFi (Request Finance)
            </h1>
            <p className="text-gray-300 text-sm font-light">Send creator a superchat, it's a easy as typing a message and hitting send!</p>
          </div>

          {!address ? (
            <div className="text-center text-gray-400 mb-6">Please connect your wallet to send a SuperChat</div>
          ) : (
            <div className="space-y-4">
              <Input
                name="message"
                placeholder="Your SuperChat message.."
                type="text"
                maxLength={220}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-[#2d3e50] border-none text-white placeholder-gray-400"
              />

              {requestData?.expectedAmount && requestData?.currency && (
                <div className="flex justify-between text-gray-300 text-sm mb-4">
                  <p className="font-semibold">
                    {Number(requestData?.expectedAmount) / Math.pow(10, 18)} {requestData?.currency}
                  </p>
                </div>
              )}

              <Button
                onClick={payTheRequest}
                disabled={loading}
                className={`w-full ${
                  loading
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#CC0000] to-[#880606] text-white hover:opacity-90"
                } transition-all duration-300`}
              >
                {loading
                  ? "Sending..."
                  : `🎁 ${Number(requestData?.expectedAmount || '1000000000000000000') / Math.pow(10, 18)} ${requestData?.currency || 'FAU'}`}
              </Button>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="p-4 bg-[#16213e] text-white rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#5DEB5A]">Payment Successful!</h2>
                <p className="text-sm text-gray-300 mt-1">{successMessage}</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[#CC0000]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}

        <span className="text-xs text-gray-600 flex items-center justify-center mb-3 font-medium">powered by Request Network</span>
      </div>
    </div>
  );
};

export default Payment;
