#!/bin/sh

IMAGE_NAME="funbox/crafter"
CRAFTER_VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')

docker build --build-arg CRAFTER_VERSION=$CRAFTER_VERSION -t $IMAGE_NAME:$CRAFTER_VERSION - < Dockerfile
docker push $IMAGE_NAME:$CRAFTER_VERSION
docker tag $IMAGE_NAME:$CRAFTER_VERSION $IMAGE_NAME:latest
docker push $IMAGE_NAME:latest
