FROM node:10.24.1

LABEL org.label-schema.description="Image for launching npm package \"@funbox/crafter\""

ARG CRAFTER_VERSION=latest
WORKDIR /app

RUN npm install -g --silent @funbox/crafter@${CRAFTER_VERSION}

ENTRYPOINT ["crafter"]
