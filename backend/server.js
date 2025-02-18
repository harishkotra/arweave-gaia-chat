const express = require('express');
const axios = require('axios');
const Arweave = require('arweave');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for data uploads

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 60000, // Increased timeout to 60 seconds
});

// Load the wallet key from a file (securely store this in a real application)
const walletKey = JSON.parse(fs.readFileSync('./wallet.json'));

/* 
  Available functions that can be called by the AI model.
*/
const availableFunctions = {
  getWalletBalance: {
    name: 'getWalletBalance',
    description: 'Gets the balance of a wallet address.',
    parameters: [
      { name: 'address', type: 'string', description: 'The wallet address.', required: true },
    ],
  },
  createTransaction: {
    name: 'createTransaction',
    description: 'Creates a transaction to send AR or upload data.',
    parameters: [
      { name: 'target', type: 'string', description: 'The recipient wallet address (optional).', required: false },
      { name: 'quantity', type: 'string', description: 'The amount of AR to send in Winston (optional).', required: false },
      { name: 'data', type: 'string', description: 'The data to upload (optional).', required: false },
    ],
  },
  getLastTransactionID: {
    name: 'getLastTransactionID',
    description: 'Gets the last transaction ID from a wallet address.',
    parameters: [
      { name: 'address', type: 'string', description: 'The wallet address.', required: true },
    ],
  },
  storeData: {
    name: 'storeData',
    description: 'Stores data on the Arweave permaweb.',
    parameters: [
      { name: 'data', type: 'string', description: 'The data to store.', required: true },
      { name: 'contentType', type: 'string', description: 'The content type of the data (e.g., text/html, text/plain).', required: false },
    ],
  },
  // Add more functions here...
};


/**
 * @function getWalletBalance
 * @description Gets the balance of a wallet address in AR.
 * @param {string} address - The wallet address to get the balance for.
 * @returns {Promise<string>} - A promise that resolves with the wallet balance in AR.
 * @throws {Error} - If there is an error getting the wallet balance.
 */
async function getWalletBalance(address) {
  try {
    const balance = await arweave.wallets.getBalance(address);
    return arweave.ar.winstonToAr(balance);
  } catch (error) {
    console.error(`Error getting wallet balance for address ${address}:`, error);
    throw new Error(`Unable to get wallet balance: ${error.message}`);
  }
}

/**
 * @function createTransaction
 * @description Creates a transaction to send AR or upload data to the Arweave network.
 * @param {string} [target] - The recipient wallet address (optional).
 * @param {string} [quantity] - The amount of AR to send in Winston (optional).
 * @param {string} [data] - The data to upload (optional).
 * @returns {Promise<string>} - A promise that resolves with the transaction ID.
 * @throws {Error} - If the transaction fails to be created or posted.
 */
async function createTransaction(target, quantity, data) {
  try {
    let transaction;

    if (data) {
      transaction = await arweave.createTransaction({ data: data }, walletKey);
    } else {
      transaction = await arweave.createTransaction({
        target: target,
        quantity: quantity,
      }, walletKey);
    }

    await arweave.transactions.sign(transaction, walletKey);
    const response = await arweave.transactions.post(transaction);

    if (response.status === 200) {
      return transaction.id;
    } else {
      throw new Error(`Transaction failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error creating transaction:`, error);
    throw new Error(`Unable to create transaction: ${error.message}`);
  }
}

/**
 * @function getLastTransactionID
 * @description Gets the last transaction ID from a wallet address.
 * @param {string} address - The wallet address to get the last transaction ID for.
 * @returns {Promise<string>} - A promise that resolves with the last transaction ID.
 * @throws {Error} - If there is an error getting the last transaction ID.
 */
async function getLastTransactionID(address) {
  try {
    return await arweave.wallets.getLastTransactionID(address);
  } catch (error) {
    console.error(`Error getting last transaction ID for address ${address}:`, error);
    throw new Error(`Unable to get last transaction ID: ${error.message}`);
  }
}

/**
 * @function storeData
 * @description Stores data on the Arweave permaweb using chunked uploading.
 * @param {string} data - The data to store.
 * @param {string} [contentType] - The content type of the data (e.g., text/html, text/plain).
 * @returns {Promise<string>} - A promise that resolves with the transaction ID.
 * @throws {Error} - If the transaction fails to be created, signed, or uploaded.
 */
async function storeData(data, contentType) {
  try {
    const transaction = await arweave.createTransaction({ data: data }, walletKey);

    if (contentType) {
      transaction.addTag('Content-Type', contentType);
    }

    // Manually set the reward (increase this value if needed)
    transaction.reward = '80000000'; // Example: 0.00000008 AR

    await arweave.transactions.sign(transaction, walletKey);

    let uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      try {
        await uploader.uploadChunk();
        console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
      } catch (uploadError) {
        console.error("Error uploading chunk:", uploadError);
        throw new Error(`Chunk upload failed: ${uploadError.message}`);
      }
    }

    return transaction.id;
  } catch (error) {
    console.error(`Error storing data:`, error);
    throw new Error(`Unable to store data: ${error.message}`);
  }
}

/**
 * @function functionDispatcher
 * @description Dispatches the appropriate function based on the function name.
 * @param {string} functionName - The name of the function to call.
 * @param {object} args - The arguments to pass to the function.
 * @returns {Promise<any>} - A promise that resolves with the result of the function call.
 * @throws {Error} - If the function name is not found.
 */
const functionDispatcher = async (functionName, args) => {
  switch (functionName) {
    case 'getWalletBalance':
      return getWalletBalance(args.address);
    case 'createTransaction':
      return createTransaction(args.target, args.quantity, args.data);
    case 'getLastTransactionID':
      return getLastTransactionID(args.address);
    case 'storeData':
      return storeData(args.data, args.contentType);
    default:
      throw new Error(`Function "${functionName}" not found.`);
  }
};

app.post('/api/arweave', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    // Call the OpenAI-compatible API
    const llmResponse = await axios.post(
      'https://NODE-ID.gaia.domains/v1/chat/completions', // Replace with your actual API endpoint
      {
        model: 'Meta-Llama-3.1-8B-Instruct-Q5_K_M', // Or the model you prefer
        messages: [
          {
            role: 'system',
            content: `You are a tool-calling assistant. The available functions are: ${JSON.stringify(
              availableFunctions
            )}. Analyze the user prompt and determine which function to call and what arguments to use. Return ONLY a valid JSON object with the "function" and "arguments" keys. Do not include any other text or explanations. If no function is appropriate, return {"function": null}.  For example: {"function": "getWalletBalance", "arguments": {"address": "your_address"}}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300, // Increased max_tokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          //'Authorization': 'Bearer YOUR_GAIA_API_KEY', // Add your API key
        },
      }
    );

    const llmResponseText = llmResponse.data.choices[0].message.content.trim(); // Access the content

    // Extract the JSON object using a regular expression (more precise)
    const jsonMatch = llmResponseText.match(/^\{[\s\S]*?\}$/); // Match only if the entire string is a JSON object

    if (!jsonMatch) {
      console.error('No JSON object found in LLM response:', llmResponseText);
      return res.status(400).json({ error: 'No JSON object found in LLM response' });
    }

    const jsonString = jsonMatch[0];

    let functionCall;

    try {
      functionCall = JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return res.status(400).json({ error: 'Invalid LLM response format', details: error.message });
    }

    if (!functionCall.function) {
      return res.json({ result: 'No function needed.' });
    }

    try {
      const result = await functionDispatcher(functionCall.function, functionCall.arguments);
      res.json({ result });
    } catch (error) {
      console.error('Error executing function:', error);
      let errorMessage = error.message;

      // Check for "Transaction verification failed" error
      if (errorMessage.includes('Transaction verification failed')) {
        errorMessage = 'Transaction failed. Please ensure you have sufficient AR tokens in your wallet to cover the transaction fee and data storage costs. Add funds to your wallet and try again.';
      }

      res.status(500).json({ error: 'Failed to execute function', details: errorMessage });
    }
  } catch (error) {
    console.error('Error calling OpenAI-compatible API:', error);
    res.status(500).json({ error: 'Failed to call OpenAI-compatible API', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});