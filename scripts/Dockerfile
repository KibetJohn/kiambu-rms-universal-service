# Stage 1: Build
FROM node:18-alpine AS build

# Install build dependencies
RUN apk add --no-cache g++ make py3-pip

# Set working directory
WORKDIR /src

# Copy project files to the container
COPY . .

# Install dependencies
RUN npm install --legacy-per-deps

# Build the project
RUN npm run build

# Stage 2: Final
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache g++ make py3-pip

# Set build-time argument for NODE_ENV
ARG NODE_ENV

# Set environment variable for build
ENV NODE_ENV=${NODE_ENV}
# Accept the secret as a build argument
ARG VAULT_PWD

# Use the secret as an environment variable (optional)
ENV VAULT_PWD=${VAULT_PWD}

# Set working directory
WORKDIR /src

# Copy built files from the build stage
COPY --from=build /src/dist .

# Install only production dependencies
RUN npm install --legacy-per-deps

# Expose the application port
EXPOSE 9006

# Start the application
CMD ["npm", "start"]