# --- Stage 1: The Build Stage ---
FROM node:18-alpine AS build

# Declare the build arguments
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY
ARG REACT_APP_STRIPE_PRO_PRICE_ID

# Set them as environment variables for the build process
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_STRIPE_PRO_PRICE_ID=$REACT_APP_STRIPE_PRO_PRICE_ID
# -----------------------------

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: The Production Stage ---
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]