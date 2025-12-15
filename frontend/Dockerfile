FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the frontend
RUN npm run build

EXPOSE 5173

# Serve using vite preview or a static server
# Preview is easy for demo, simulates prod build
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
