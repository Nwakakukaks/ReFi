import { Chain } from 'wagmi/chains';

export const aurora: Chain = {
  id: 1313161554,
  name: 'Aurora Mainnet',
  testnet: false,
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.aurora.dev'],
    },
    public: {
      http: ['https://mainnet.aurora.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Aurorascan',
      url: 'https://aurorascan.dev',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 62840020,
    },
  },
};

export const auroraTestnet: Chain = {
  id: 1313161555,
  name: 'Aurora Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.aurora.dev'],
    },
    public: {
      http: ['https://testnet.aurora.dev'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Aurorascan',
      url: 'https://testnet.aurorascan.dev',
    },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 7385001,
    },
  },
};

const contractPerNetwork = {
  mainnet: 'hello.near-examples.near',
  testnet: 'hello.near-examples.testnet',
};

// Chains for EVM Wallets 
const evmWalletChains = {
  mainnet: {
    chainId: 397,
    name: "Near Mainnet",
    explorer: "https://eth-explorer.near.org",
    rpc: "https://eth-rpc.mainnet.near.org",
  },
  testnet: {
    chainId: 398,
    name: "Near Testnet",
    explorer: "https://eth-explorer-testnet.near.org",
    rpc: "https://eth-rpc.testnet.near.org",
  },
}

export const NetworkId = 'testnet';
export const HelloNearContract = contractPerNetwork[NetworkId];
export const EVMWalletChain = evmWalletChains[NetworkId];