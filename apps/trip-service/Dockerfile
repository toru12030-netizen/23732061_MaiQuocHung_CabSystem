FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
RUN npm install
WORKDIR /app/apps/trip-service
EXPOSE 3008
CMD ["npm", "start"]
