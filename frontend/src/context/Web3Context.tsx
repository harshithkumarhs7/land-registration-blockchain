import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ApiService } from '../api/client';
import { useAuth } from './AuthContext';

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  connectWallet: () => Promise<string | null>;
  linkWalletToAccount: () => Promise<boolean>;
  switchToHardhatNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false);

  useEffect(() => {
    const checkEthereum = async () => {
      const { ethereum } = window as any;
      if (ethereum) {
        setIsMetaMaskInstalled(true);
        try {
          const provider = new ethers.BrowserProvider(ethereum);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));

          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }

          // Listen for account/network changes
          ethereum.on('accountsChanged', (newAccounts: string[]) => {
            setAccount(newAccounts.length > 0 ? newAccounts[0] : null);
          });

          ethereum.on('chainChanged', (newChainId: string) => {
            setChainId(parseInt(newChainId, 16));
          });
        } catch (err) {
          console.error('Error initializing Web3:', err);
        }
      }
    };

    checkEthereum();
  }, []);

  const connectWallet = async (): Promise<string | null> => {
    const { ethereum } = window as any;
    if (!ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to interact with the blockchain.');
      return null;
    }

    setIsConnecting(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const connectedAccount = accounts[0];
      setAccount(connectedAccount);

      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));

      setIsConnecting(false);
      return connectedAccount;
    } catch (err: any) {
      setIsConnecting(false);
      console.error('Wallet connection rejected:', err);
      return null;
    }
  };

  const linkWalletToAccount = async (): Promise<boolean> => {
    const { ethereum } = window as any;
    if (!ethereum || !user) return false;

    try {
      let currentAccount = account;
      if (!currentAccount) {
        currentAccount = await connectWallet();
        if (!currentAccount) return false;
      }

      // 1. Request challenge nonce
      const nonceRes = await ApiService.getNonce(currentAccount);
      const { message } = nonceRes.data.data;

      // 2. Sign message with MetaMask
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // 3. Verify signature on backend
      await ApiService.linkWallet({
        walletAddress: currentAccount,
        signature,
        message,
      });

      await refreshUser();
      alert(`Wallet ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)} linked successfully!`);
      return true;
    } catch (err: any) {
      console.error('Failed to link wallet:', err);
      alert(`Wallet linking failed: ${err.response?.data?.message || err.message}`);
      return false;
    }
  };

  const switchToHardhatNetwork = async () => {
    const { ethereum } = window as any;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7a69',
              chainName: 'Hardhat Local Node',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            },
          ],
        });
      }
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnecting,
        isMetaMaskInstalled,
        connectWallet,
        linkWalletToAccount,
        switchToHardhatNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
