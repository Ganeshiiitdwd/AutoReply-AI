🤖 AutoReply AI
=====================

A sophisticated, multi-tenant SaaS platform designed to act as an intelligent personal assistant for managing email. This application automates the entire email processing pipeline—from fetching and understanding new emails to generating context-aware replies and sending them on the user's behalf.

✨ Key Features
--------------

*   **📧 Secure Email Integration:** Uses OAuth 2.0 to safely connect to user's Gmail accounts without storing passwords.
    
*   **🧠 Advanced AI Replies (RAG):** Implements Retrieval-Augmented Generation with a vector database (MongoDB Atlas Vector Search) to draft context-aware replies based on a user's personal knowledge base.
    
*   **⚙️ Full Automation Pipeline:** A background worker system (using BullMQ & Redis) periodically checks for new emails, processes them with AI, and sends replies without user intervention.
    
*   **📊 Analytics Dashboard:** Provides users with a rich dashboard to visualize key metrics like emails processed, average response time, and daily volume.
    
*   **💰 Subscription Monetization:** Fully integrated with Stripe to manage recurring subscription plans and handle payments securely.
    
*   **📝 Action Logging:** Automatically logs a summary of every AI action to a user-specific Google Sheet for easy tracking and history.
    
*   **🐳 Fully Containerized:** The entire multi-service application is containerized with Docker and Docker Compose for portability and ease of development.
    

🚀 System Architecture
----------------------

The application is built on a **MERN stack** (MongoDB, Express.js, React.js, Node.js) and is designed with a robust, scalable multi-tenant architecture. All services are containerized using Docker for consistency across all environments.

*   **Frontend:** React.js, Tailwind CSS, Recharts
    
*   **Backend:** Node.js, Express.js
    
*   **Database:** MongoDB Atlas (with Vector Search)
    
*   **Job Queue:** BullMQ & Redis
    
*   **External APIs:** Google (Gmail, Sheets, Gemini), Stripe
    

🛠️ Local Setup & Installation
------------------------------

To run this project locally, you will need **Node.js**, **Docker Desktop**, and a **Redis** instance running (which will be handled by Docker Compose).

### 1\. Prerequisites

*   Node.js (v18 or later)
    
*   Docker Desktop
    
*   A MongoDB Atlas account
    
*   API keys for Google Cloud, Gemini, and Stripe
    

### 2. Clone the Repository:
```bash
git clone https://github.com/Ganeshiiitdwd/AutoReply-AI
cd AutoReply-AI
```

### 3\. Configure Environment Variables

**A. Backend Environment**

Create a file at ```backend/.env``` and fill in your secrets.
```bash
  # Server Configuration
PORT=5000
JWT_SECRET=your_jwt_secret_here

# Database & Queue
MONGO_URI=your_mongodb_connection_string_here
REDIS_HOST=redis
REDIS_PORT=6379

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Google AI (Gemini) API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
STRIPE_PRO_PRICE_ID=your_stripe_pro_price_id_here

```
**B. Frontend Environment**

Create a file at ```frontend/.env``` and add your public Stripe key.
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY==your_stripe_public_key_here 
```
### 4\. Run the Application

The entire application stack (frontend, backend, database, Redis) can be started with a single command from the **project root directory**.
```bash
 docker-compose up --build   
```
*   The frontend will be available at [Frontend → http://localhost:3000](http://localhost:3000)
    
*   The backend API will be available at [Backend → http://localhost:5000](http://localhost:5000)

    

### 5\. Start the Background Services

To enable the full automation pipeline, you need to run the **worker** and **scheduler** processes. Open two new terminals, navigate to the backend directory in each, and run the following commands:

**In Terminal 1 (for the Worker):**
```bash
   cd backend  npm run worker   
```
**In Terminal 2 (for the Scheduler):**
```bash
  cd backend  npm run scheduler   
```
### 6\. Set Up Stripe Webhooks for Local Testing

To test the Stripe integration, you need to forward webhook events to your local server.

**In Terminal 3 (for Stripe CLI):**
```bash
  stripe listen --forward-to http://localhost:5000/api/stripe/webhook   
```
*   This command will output a webhook signing secret (whsec\_...). Copy this secret and paste it as the value for ```STRIPE\_WEBHOOK\_SECRET``` in your ```backend/.env``` file.
    

🚀 Future Improvements
----------------------

*   **CI/CD Pipeline:** Set up GitHub Actions to automatically test and deploy the application to a cloud provider like AWS.
    
*   **Comprehensive Testing:** Add a suite of unit and integration tests using Jest to ensure code quality.
    
*   **Team-Based Features:** Fully implement the tenantId logic to allow companies to sign up and have multiple users share a single subscription and knowledge base.
  
