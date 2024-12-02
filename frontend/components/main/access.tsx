import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Unlock } from "lucide-react";
import { useAccount, useReadContract, useSignMessage } from "wagmi";
import { Contract_Address, abi } from "@/constants";


const CONTRACT_ADDRESS = Contract_Address;
const ABI = abi;

interface Platform {
  name: string;
  requiredBalance: number;
}

interface PlatformButtonProps {
  platform: Platform;
  onClick: () => void;
  isLoading: boolean;
  loadingState: string | null;
}

const PlatformButton: React.FC<PlatformButtonProps> = ({ platform, onClick, isLoading, loadingState }) => (
  <Button onClick={onClick} className="w-full h-20 relative overflow-hidden group" disabled={isLoading}>
    <div className="absolute inset-0 bg-primary opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10 flex items-center justify-between w-full">
      <div className="flex items-center">
        <img src={`/icons/${platform.name}.svg`} alt={`${platform.name} logo`} className="w-8 h-8 mr-3" />
        <span className="font-semibold">{platform.name}</span>
      </div>
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : loadingState === "checking" ? (
        <Lock className="w-6 h-6" />
      ) : (
        <Unlock className="w-6 h-6" />
      )}
    </div>
  </Button>
);

const Access: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, string | null>>({});
  const [signedPlatform, setSignedPlatform] = useState<Platform | null>(null);
  const { address } = useAccount();
  const { signMessage } = useSignMessage();

  const platforms: Platform[] = [
    { name: "Patreon", requiredBalance: 1 },
    { name: "YouTube", requiredBalance: 1 },
    { name: "Medium", requiredBalance: 1 },
    { name: "Substack", requiredBalance: 1 },
    { name: "Instagram", requiredBalance: 1 },
    { name: "Farcaster", requiredBalance: 1 },
  ];

  // Read contract data to check if user owns any UTK tokens
  const { data: ownsAnyUTK, refetch: refetchOwnsAnyUTK } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "ownsAnyUTK",
    args: [address],
  });

  const generateRandomString = (prefix: string, length: number = 8): string => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${prefix}-${randomString}`;
  };

  useEffect(() => {
    if (signedPlatform && address) {
      // Add a delay before checking access
      const timer = setTimeout(() => {
        checkAccessAndGrant(signedPlatform);
      }, 3000); // 3 second delay

      return () => clearTimeout(timer);
    }
  }, [signedPlatform, address]);

  const checkAccessAndGrant = async (platform: Platform) => {
    try {
      // Refetch the current token ownership status
      await refetchOwnsAnyUTK();

      if (ownsAnyUTK) {
        const passkey = generateRandomString(platform.name);
        toast({
          title: "Access Granted",
          description: `You now have access to exclusive content on ${platform.name}! Your passkey: ${passkey}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: `You need to own a creator token to access ${platform.name} contents.`,
        });
      }

      setLoadingStates((prev) => ({ ...prev, [platform.name]: null }));
      setSignedPlatform(null);
    } catch (error) {
      console.error("Error checking access:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify token ownership",
      });
      setLoadingStates((prev) => ({ ...prev, [platform.name]: null }));
    }
  };

  const handleAccess = async (platform: Platform) => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to access exclusive content.",
      });
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [platform.name]: "accessing" }));

    try {
      
      // Sign message configuration
      () =>
        signMessage({
          message: "I authorize checking my wallet for creator NFT ownership",
        });

      // Set checking state after signature
      setLoadingStates((prev) => ({ ...prev, [platform.name]: "checking" }));
      setSignedPlatform(platform);

      // Show loading toast
      toast({
        title: "Verifying Access",
        description: "Please wait while we verify your token ownership...",
      });
    } catch (error) {
      console.error("Error during access request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process access request",
      });
      setLoadingStates((prev) => ({ ...prev, [platform.name]: null }));
    }
  };

  return (
    <div className="h-[75vh] flex justify-center items-center">
      <Card className="w-full max-w-4xl mx-auto bg-transparent border-2 border-gray-400">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-50 font-bold text-center mb-2">Access Exclusive Contents</CardTitle>
          <CardDescription className="text-center text-base">
            Connect your wallet to unlock premium content using your membership token
          </CardDescription>
        </CardHeader>

        {!address ? (
          <div className="flex justify-center my-24">
            
          </div>
        ) : (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <PlatformButton
                  key={platform.name}
                  platform={platform}
                  onClick={() => handleAccess(platform)}
                  isLoading={!!loadingStates[platform.name]}
                  loadingState={loadingStates[platform.name]}
                />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Access;
