FROM node:20-alpine

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Build-time placeholder to avoid Next.js build crash when DATABASE_URL is absent
# Runtime env var from CloudBase will override this value
ENV DATABASE_URL="postgres://placeholder:placeholder@127.0.0.1:5432/placeholder"

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
