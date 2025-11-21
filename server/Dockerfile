FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --silent || (echo "No package-lock.json, continuing with npm install" && npm install --silent)
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

