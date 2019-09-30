FROM node:10.24.1

LABEL org.label-schema.description="Image for launching npm package \"@funbox/crafter\""

WORKDIR /app

RUN npm install -g --silent @funbox/crafter

ENTRYPOINT ["crafter"]
