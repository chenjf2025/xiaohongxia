FROM node:20
WORKDIR /app

RUN npm install -g pnpm --registry https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml* ./
RUN pnpm config set registry https://registry.npmmirror.com && pnpm install

COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build Next.js
ENV NODE_ENV=production
RUN pnpm build

EXPOSE 3100

CMD ["node", "server.mjs"]
