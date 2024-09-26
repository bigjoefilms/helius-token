import { LightSystemProgram, Rpc, confirmTx, createRpc } from '@lightprotocol/stateless.js';
import { createMint, mintTo, transfer } from '@lightprotocol/compressed-token';
import { Keypair } from '@solana/web3.js';
import { NextResponse } from 'next/server';

const RPC_ENDPOINT = 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY';
const COMPRESSION_RPC_ENDPOINT = RPC_ENDPOINT;

// Generate keypairs for the payer and the recipient
const payer = Keypair.generate();
const tokenRecipient = Keypair.generate();

const connection: Rpc = createRpc(RPC_ENDPOINT, COMPRESSION_RPC_ENDPOINT);

// Define the POST method
export async function POST(request: Request) {
  try {
    // Airdrop lamports to the payer's account to pay transaction fees
    await confirmTx(
      connection,
      await connection.requestAirdrop(payer.publicKey, 10e9) // Airdrop 10 SOL
    );

    // Airdrop some lamports to the tokenRecipient as well
    await confirmTx(
      connection,
      await connection.requestAirdrop(tokenRecipient.publicKey, 1e6) // Airdrop a small amount
    );

    // Step 1: Create a compressed token mint
    const { mint, transactionSignature } = await createMint(
      connection,
      payer,
      payer.publicKey,
      9 // Number of decimals
    );

    // Step 2: Mint tokens to the payer's account
    const mintToTxId = await mintTo(
      connection,
      payer,
      mint,
      payer.publicKey, // Destination is payer's account
      payer,
      1e9 // Amount (1 billion units)
    );

    // Step 3: Transfer some tokens to the recipient
    const transferTxId = await transfer(
      connection,
      payer,
      mint,
      7e8, // Transfer 700 million tokens
      payer,
      tokenRecipient.publicKey
    );

    // Return JSON response with transaction details
    return NextResponse.json({
      mintTx: transactionSignature,
      mintToTx: mintToTxId,
      transferTx: transferTxId,
      payerPubKey: payer.publicKey.toString(),
      recipientPubKey: tokenRecipient.publicKey.toString(),
    });
  } catch (error:any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
