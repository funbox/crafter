FROM node:18.15.0-bullseye-slim

ARG CRAFTER_VERSION=latest
ARG BUILD_DATE

LABEL org.opencontainers.image.title="Crafter" \
      org.opencontainers.image.description="An image to launch \"@funboxteam/crafter\" npm package" \
      org.opencontainers.image.vendor="FunBox" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.source="https://github.com/funbox/crafter" \
      org.opencontainers.image.version=$CRAFTER_VERSION \
      org.opencontainers.artifact.created=$BUILD_DATE

WORKDIR /app

RUN npm install -g --silent @funboxteam/crafter@${CRAFTER_VERSION}

ENTRYPOINT ["crafter"]
