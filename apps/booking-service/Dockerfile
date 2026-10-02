FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN npm install
WORKDIR /app/apps/booking-service
EXPOSE 3003
CMD ["npm", "start"]
