import React, { useEffect, useState } from "react";

const RedirectToClaim: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);

  const fetchClaimUrl = async () => {
    setIsLoading(true);
    try {
      const pathParts = window.location.pathname.split("/");
      const shortCode = pathParts[pathParts.length - 1];

      const response = await fetch(`https://aptopus-backend.vercel.app/c/${shortCode}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Invalid data returned");
      }

      setClaimUrl(data.url);
      return data.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPopup = async () => {
    const url = claimUrl || (await fetchClaimUrl());
    console.log(url);
    if (!url) return;

    // Modify the URL
    const modifiedUrl = url.replace("https://aptopus.vercel.app", "https://superbased.vercel.app");

    window.location.href = modifiedUrl;
  };

  useEffect(() => {
    handleOpenPopup();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {!isLoading && error ? <div className="text-[#5DEB5A] mb-4">{error}</div> : null}

      <p>Redirecting to claim page...</p>
    </div>
  );
};

export default RedirectToClaim;
