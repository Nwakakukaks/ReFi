import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  walletConnectWallet,
  metaMaskWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { http, createConfig } from 'wagmi';
import { aurora, auroraTestnet } from './config';

// Replace this with your actual environment variable import method for Vite
const VITE_WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID;

const projectId = VITE_WC_PROJECT_ID;

if (!projectId) {
  const providerErrMessage =
    'To connect to all Wallets you need to provide a VITE_WC_PROJECT_ID env variable';
  throw new Error(providerErrMessage);
}

// Aurora Pass specific options
const walletConnectOptions = {
  projectId,
  options: {
    qrModalOptions: {
      desktopWallets: [],
      mobileWallets: [],
    },
    defaultChain: aurora,
    includeWalletIds: [
      '76260019aec5a3c44dd2421bf78e80f71a6c090d932c413a287193ed79450694', // AuroraPass
    ],
  },
};

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        () => walletConnectWallet(walletConnectOptions),
      ],
    },
    {
      groupName: 'Other Wallets',
      wallets: [
        () => rainbowWallet(walletConnectOptions),
        () => metaMaskWallet(walletConnectOptions),
      ],
    },
  ],
  {
    appName: 'NearPay',
    projectId,
  }
);

export const wagmiConfig = createConfig({
  chains: [aurora, auroraTestnet],
  multiInjectedProviderDiscovery: false,
  connectors,
  transports: {
    [aurora.id]: http(),
    [auroraTestnet.id]: http(),
  },
});