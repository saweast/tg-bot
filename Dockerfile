FROM node:22-bookworm-slim

ARG YT_DLP_VERSION=2025.12.08
ARG TARGETARCH
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    ca-certificates \
    && case "${TARGETARCH}" in \
        amd64)  YT_DLP_ASSET="yt-dlp_linux" ;; \
        arm64)  YT_DLP_ASSET="yt-dlp_linux_aarch64" ;; \
        *)      echo "Unsupported arch: ${TARGETARCH}"; exit 1 ;; \
       esac \
    && curl -L -o /usr/local/bin/yt-dlp \
    "https://github.com/yt-dlp/yt-dlp/releases/download/${YT_DLP_VERSION}/${YT_DLP_ASSET}" \
    && chmod +x /usr/local/bin/yt-dlp \
    && /usr/local/bin/yt-dlp --version \
    && apt-get purge -y --auto-remove curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

CMD ["node", "src/index.js"]
