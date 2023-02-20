FROM node:14.18.0-stretch-slim

ARG CRAFTER_VERSION=latest
ARG BUILD_DATE

LABEL org.opencontainers.image.title="Crafter" \
      org.opencontainers.image.description="An image to launch \"@funboxteam/crafter\" npm package" \
      org.opencontainers.image.vendor="FunBox" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/funbox/crafter" \
      org.opencontainers.image.version=$CRAFTER_VERSION \
      org.opencontainers.artifact.created=$BUILD_DATE

WORKDIR /app

RUN npm install -g --silent @funboxteam/crafter@${CRAFTER_VERSION}

ENTRYPOINT ["crafter"]
