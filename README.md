# Arweave + Gaia Chat

This application is a chat interface that allows users to interact with the Arweave network using natural language. It leverages the power of Large Language Models (LLMs) running on a Gaia node to translate user prompts into specific Arweave JS function calls, making it easier to perform various Arweave-related tasks.

## Overview

The application consists of two main parts:

*   **Frontend:** A React-based chat interface built with Shadcn UI and Tailwind CSS. It provides a user-friendly way to interact with the Arweave network.
*   **Backend:** A Node.js server that handles API requests from the frontend, translates user prompts into Arweave JS function calls using an LLM, and executes those function calls.

## Functionality

The application allows users to:

*   Get the balance of a wallet address.
*   Get the last transaction ID from a wallet address.
*   Store data on the Arweave permaweb.
*   Send AR tokens from one wallet to another.

## Technology Stack

*   Frontend: React, Typescript, Shadcn UI, Tailwind CSS, Axios
*   Backend: Node.js, Express, Axios, Arweave JS
*   LLM API: Gaia Node [Getting Started](https://docs.gaianet.ai/getting-started/quick-start)

## The Role of Gaia (LLM API)

This application uses a Gaia Node as a "tool-calling" engine. Gaia plays a crucial role in:

1.  **Understanding User Intent:** It analyzes the user's natural language prompt to understand what the user wants to achieve.

2.  **Function Selection:** Based on the user's intent, it determines which Arweave JS function is the most appropriate to call.

3.  **Argument Extraction:** It extracts the necessary arguments from the user's prompt and formats them for the selected Arweave JS function.

In essence, Gaia acts as the "translator" between natural language and Arweave JS code, enabling users to interact with the Arweave network without needing to know the specific syntax of Arweave JS.

## Setup and Usage

1.  **Clone the Repository:**

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Backend Setup:**

    *   Navigate to the `backend` directory:

        ```bash
        cd backend
        ```

    *   Install dependencies:

        ```bash
        npm install
        ```

    *   Create a `wallet.json` file in the `backend` directory and securely store your Arweave wallet key in JSON format. **Never commit this file to version control.**

    *   Start the backend server:

        ```bash
        npm start
        ```

3.  **Frontend Setup:**

    *   Open a new terminal window and navigate to the `frontend` directory:

        ```bash
        cd frontend
        ```

    *   Install dependencies:

        ```bash
        npm install
        ```

    *   Start the frontend development server:

        ```bash
        npm run dev
        ```

4.  **Access the Application:**

    *   Open your web browser and navigate to the address where the frontend is running (usually `http://localhost:5173`).

5.  **Interact with Arweave:**

    *   Use the chat interface to enter your Arweave-related requests in natural language.
    *   The application will translate your requests into Arweave JS function calls and display the results.

## Important Notes

*   **Security:** This application is a simplified example and may not be suitable for production use without further security hardening. Carefully review the code and implement appropriate security measures before deploying it to a live environment.
*   **API Costs:** Be aware that using the LLM API (Gaia) may incur costs. Check the pricing of the API provider before using it extensively.
*   **Arweave Network Fees:** Uploading data to Arweave requires paying network fees. Make sure you have sufficient AR tokens in your wallet to cover these fees.
*   **LLM Limitations:** The LLM may not always generate the correct Arweave JS function calls. You may need to experiment with different prompts to get the desired results.

## Contributing

Contributions are welcome! Please submit a pull request with your changes.