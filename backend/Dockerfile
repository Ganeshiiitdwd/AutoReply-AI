# backend/Dockerfile

# Start with a lightweight version of Node.js
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files to leverage Docker's caching
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of your application's code
COPY . .

# Tell Docker that the container listens on port 5000
EXPOSE 5000

# The command to run when the container starts
CMD ["npm", "start"]