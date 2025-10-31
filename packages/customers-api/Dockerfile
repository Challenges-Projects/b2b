FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
#RUN npm ci --quiet
RUN npm install --quiet --unsafe-perm
COPY tsconfig.json ./
COPY src ./src
COPY openapi.yaml ./
RUN npm run build
EXPOSE 3001
CMD ["npm","start"]
