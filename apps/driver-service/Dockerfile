FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN npm install
WORKDIR /app/apps/driver-service
EXPOSE 3002
CMD ["npm", "start"]
