FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Avoid installing devDependencies or ensure uuid compatibility if needed
# We need typescript to build, so we just do npm install (includes devDeps) or specific
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
