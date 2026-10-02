FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN npm install
WORKDIR /app/apps/api-gateway
EXPOSE 3000
CMD ["npm", "start"]
