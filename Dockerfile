# Use the official Node.js image.
FROM node:lts-alpine

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json
COPY package.json ./
# Copy the rest of your application code.
COPY . .
# install packages if not already
RUN npm install

# Expose the port that your app runs on.
EXPOSE 4000

# Command to run your application.
CMD ["npm", "start"]