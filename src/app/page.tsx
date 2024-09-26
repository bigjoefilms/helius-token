'use client'
import { useState } from 'react';
import {
  LightSystemProgram,
  Rpc,
  confirmTx,
  createRpc,
} from '@lightprotocol/stateless.js';
import { createMint, mintTo, transfer } from '@lightprotocol/compressed-token';
import { Keypair } from '@solana/web3.js';

const RPC_ENDPOINT = 'https://devnet.helius-rpc.com/?api-key=c7e5b412-c980-4f46-8b06-2c85c0b4a08d';
const COMPRESSION_RPC_ENDPOINT = RPC_ENDPOINT;

// Generate keypairs for the payer and the recipient
const payer = Keypair.generate();
const tokenRecipient = Keypair.generate();

const connection: Rpc = createRpc(RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT);

export default function Home() {
  const [log, setLog] = useState<string>(''); // To store logs
  const [loading, setLoading] = useState<boolean>(false); // To handle button state

  const handleMinting = async () => {
    setLoading(true);
    setLog('Starting minting process...\n');

    try {
      // Step 1: Airdrop lamports to the payer's account to pay transaction fees
      setLog((prev) => prev + 'Requesting airdrop for payer...\n');
      await confirmTx(
        connection,
        await connection.requestAirdrop(payer.publicKey, 10e9) // Airdrop 10 SOL
      );
      setLog((prev) => prev + `Airdropped 10 SOL to ${payer.publicKey.toString()}\n`);

      // Airdrop some lamports to the tokenRecipient as well
      setLog((prev) => prev + 'Requesting airdrop for recipient...\n');
      await confirmTx(
        connection,
        await connection.requestAirdrop(tokenRecipient.publicKey, 1e6) // Airdrop a small amount
      );
      setLog((prev) => prev + `Airdropped lamports to recipient: ${tokenRecipient.publicKey.toString()}\n`);

      // Step 2: Create a compressed token mint
      setLog((prev) => prev + 'Creating mint...\n');
      const { mint, transactionSignature } = await createMint(
        connection,
        payer,
        payer.publicKey,
        9 // Number of decimals
      );
      setLog((prev) => prev + `Mint created! Transaction: ${transactionSignature}\n`);

      // Step 3: Mint tokens to the payer's account
      setLog((prev) => prev + 'Minting tokens to payer...\n');
      const mintToTxId = await mintTo(
        connection,
        payer,
        mint,
        payer.publicKey, // Destination is payer's account
        payer,
        1e9 // Amount (1 billion units)
      );
      setLog((prev) => prev + `Minted tokens to ${payer.publicKey.toString()}! Transaction: ${mintToTxId}\n`);

      // Step 4: Transfer some tokens to the recipient
      setLog((prev) => prev + 'Transferring tokens to recipient...\n');
      const transferTxId = await transfer(
        connection,
        payer,
        mint,
        7e8, // Transfer 700 million tokens
        payer,
        tokenRecipient.publicKey
      );
      setLog((prev) => prev + `Transferred tokens to ${tokenRecipient.publicKey.toString()}! Transaction: ${transferTxId}\n`);
    } catch (error:any) {
      setLog((prev) => prev + `Error: ${error.message}\n`);
    }

    setLoading(false);
  };

  return (
    <div className="h-[100vh]">
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }} className="flex items-center justify-center flex-col h-[100vh]">
        <h1 className="text-[40px] font-bold py-[10px]">Solana Token Minting System</h1>
        <button
          onClick={handleMinting}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e84125',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : 'Start Minting'}
        </button>
        <pre
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f4f4f4',
            borderRadius: '5px',
            maxHeight: '400px',
            overflowY: 'scroll',
          }}
          className="text-[#000]"
        >
          {log}
        </pre>
      </div>
    </div>
  );
}
