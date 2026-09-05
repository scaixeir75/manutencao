FROM node:22-bookworm-slim
WORKDIR /app
COPY server/photo-ai/package*.json ./server/photo-ai/
RUN cd server/photo-ai && npm ci --omit=dev
COPY photo-ai-contract.js ./
COPY server/photo-ai/*.js ./server/photo-ai/
ENV NODE_ENV=production
USER node
CMD ["node", "server/photo-ai/server.js"]
