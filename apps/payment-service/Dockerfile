FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN npm install
WORKDIR /app/apps/payment-service
EXPOSE 3004
CMD ["npm", "start"]
