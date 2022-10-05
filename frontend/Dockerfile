FROM node:current-alpine3.15 AS build-stage

# Install the http server
RUN npm install -g http-server

# Set working directory
WORKDIR /usr/
COPY app/ /usr/app/



WORKDIR /usr/app
ENV CYPRESS_CACHE_FOLDER=/usr/app/.cache

# Install dependencies
RUN npm install --verbose

# Copy the folders from the workdir
COPY . .

# Generate 


CMD ["npm", "run", "dev"]
