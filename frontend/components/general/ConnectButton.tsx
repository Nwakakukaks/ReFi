import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="bg-gradient-to-r from-[#CC0000] to-[#d03636] hover:from-[#5b0202] hover:to-[#CC0000] text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base min-w-[160px]"
                  >
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    className="bg-[#CC0000] hover:bg-[#CC0000] text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
                  >
                    Wrong Network
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={openChainModal}
                    className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-medium py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    {chain.hasIcon && (
                      <div className="w-5 h-5">
                        {chain.iconUrl && (
                          <img alt={chain.name ?? "Chain icon"} src={chain.iconUrl} className="w-5 h-5" />
                        )}
                      </div>
                    )}
                    <span className="text-sm">{chain.name}</span>
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    className="bg-gradient-to-r from-[#CC0000] to-[#d03636] hover:from-[#5b0202] hover:to-[#CC0000] text-white font-medium py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{account.displayBalance ? `${account.displayBalance}` : ""}</span>
                      <span className="text-sm">{account.displayName}</span>
                    </div>
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
