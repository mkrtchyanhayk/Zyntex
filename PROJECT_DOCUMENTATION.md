# Project Documentation: Instagram Clone

## 1. Project Overview
This project is a full-stack web application designed as a clone of Instagram. It features a modern, responsive user interface and a robust backend API. The application allows users to sign up, log in, create posts, follow other users, like and comment on posts, and engage in direct messaging and group chats.

The project is containerized using Docker, ensuring consistent environments for development and deployment.

## 2. Technology Stack & Tools

### Client (Frontend)
The client-side application is built with **React** and styled using **Tailwind CSS**.

*   **Core Framework**: [React](https://reactjs.org/) (v18.3.1) - A JavaScript library for building user interfaces.
*   **Routing**: [React Router DOM](https://reactrouter.com/) (v6.26.1) - Handles client-side routing for seamless navigation.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v3.4.10) - A utility-first CSS framework for rapid UI development.
*   **HTTP Client**: [Axios](https://axios-http.com/) (v1.7.2) - Used for making HTTP requests to the backend API.
*   **Password Strength**: [zxcvbn](https://github.com/dropbox/zxcvbn) (v4.4.2) - A realistic password strength estimator.
*   **Build Tool**: [React Scripts](https://create-react-app.dev/) (v5.0.1) - Configuration and scripts for Create React App.

### Server (Backend)
The server-side application is a RESTful API built with **Node.js** and **Express**.

*   **Runtime**: [Node.js](https://nodejs.org/) - JavaScript runtime environment.
*   **Framework**: [Express](https://expressjs.com/) (v4.19.2) - Fast, unopinionated, minimalist web framework for Node.js.
*   **Database ODM**: [Mongoose](https://mongoosejs.com/) (v7.8.0) - Elegant mongodb object modeling for node.js.
*   **Authentication**:
    *   [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (v9.0.2) - For generating and verifying JWTs for secure authentication.
    *   [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (v2.4.3) - For hashing passwords.
*   **Middleware**:
    *   [cors](https://github.com/expressjs/cors) (v2.8.5) - Enable Cross-Origin Resource Sharing.
    *   [morgan](https://github.com/expressjs/morgan) (v1.10.0) - HTTP request logger middleware.
    *   [multer](https://github.com/expressjs/multer) (v1.4.5-lts.1) - Middleware for handling `multipart/form-data`, used for file uploads.
*   **Environment Variables**: [dotenv](https://github.com/motdotla/dotenv) (v16.4.5) - Loads environment variables from a `.env` file.

### Infrastructure & DevOps
*   **Containerization**: [Docker](https://www.docker.com/) - Used to containerize both the client and server applications.
*   **Orchestration**: [Docker Compose](https://docs.docker.com/compose/) - Defines and runs multi-container Docker applications (Client, Server, MongoDB).
*   **Database**: [MongoDB](https://www.mongodb.com/) (v7) - NoSQL database used for storing application data.

## 3. Architecture

### Client Architecture
The client is structured as a standard React application.
*   **`src/`**: Contains the source code.
    *   **`App.js`**: The main component that sets up routing and global state.
    *   **`index.js`**: The entry point that renders the React app into the DOM.
    *   **`components/`** (Inferred): Likely contains reusable UI components (Buttons, Inputs, PostCards, etc.).
    *   **`pages/`** (Inferred): Contains page-level components (Login, Feed, Profile, etc.).

### Server Architecture
The server follows a Model-View-Controller (MVC) pattern (minus the View, as it's an API).
*   **`app.js`**: The main application file. It configures middleware (CORS, JSON parsing, logging), connects to the database, and sets up route handlers.
*   **`server.js`**: The entry point that starts the server listening on a port.
*   **`config/db.js`**: Handles the connection to the MongoDB database.
*   **`models/`**: Defines the Mongoose schemas for data validation and structure.
    *   `User.js`, `Post.js`, `Comment.js`, `Message.js`, `Conversation.js`, `Group.js`, `Invitation.js`, `Notification.js`.
*   **`controllers/`**: Contains the business logic for handling requests.
    *   `auth.controller.js`, `post.controller.js`, `user.controller.js`, etc.
*   **`routes/`**: Defines the API endpoints and maps them to controller functions.
    *   `auth.routes.js`, `post.routes.js`, `user.routes.js`, etc.
*   **`middleware/`**: Custom middleware functions (e.g., authentication checks).

### Database Schema
The application uses a relational-like structure within MongoDB using references (`ObjectId`).
*   **Users**: Store profile info, credentials, and references to posts/followers.
*   **Posts**: Store content (text/image), author reference, likes, and comments.
*   **Comments**: Linked to specific posts and users.
*   **Conversations/Messages**: Handle direct messaging logic.
*   **Groups/Invitations**: Handle group chat functionality.

## 4. Setup & Deployment

### Docker Setup
The project uses `docker-compose.yml` to spin up the entire stack with a single command.

**Services:**
1.  **`mongo`**:
    *   Image: `mongo:7`
    *   Port: `27017`
    *   Volume: Persists data to `mongo_data`.
2.  **`server`**:
    *   Build context: `./server`
    *   Port: `5000`
    *   Depends on: `mongo`
    *   Environment Variables:
        *   `PORT`: 5000
        *   `MONGO_URI`: `mongodb://mongo:27017/zyntex`
        *   `JWT_SECRET`: Secret key for signing tokens.
        *   `CLIENT_URL`: URL of the frontend (for CORS).
3.  **`client`**:
    *   Build context: `./client`
    *   Port: `3000`
    *   Depends on: `server`
    *   Environment Variables:
        *   `REACT_APP_API_URL`: `http://localhost:5000` (API endpoint).

### Running the Project
To start the application locally using Docker:
```bash
docker-compose up --build
```
This command builds the images for the client and server, starts the MongoDB container, and connects them all in a shared network.

## 5. Detailed File Structure

```
/
├── docker-compose.yml      # Docker orchestration config
├── client/                 # Frontend React Application
│   ├── Dockerfile          # Client container config
│   ├── package.json        # Client dependencies
│   ├── tailwind.config.js  # Tailwind CSS config
│   ├── public/             # Static assets
│   └── src/                # React source code
│       ├── App.js          # Main App component
│       └── ...
├── server/                 # Backend Express Application
│   ├── Dockerfile          # Server container config
│   ├── package.json        # Server dependencies
│   ├── server.js           # Server entry point
│   ├── app.js              # App configuration
│   ├── config/             # Configuration files (DB)
│   ├── controllers/        # Request handlers
│   ├── models/             # Database schemas
│   ├── routes/             # API route definitions
│   └── middleware/         # Custom middleware
└── README.md               # General project info
```
