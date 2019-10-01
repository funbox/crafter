#!/bin/bash

IMAGE_NAME="funbox/crafter"
CRAFTER_VERSION=`npm view @funbox/crafter dist-tags.latest`

docker build -t $IMAGE_NAME:$CRAFTER_VERSION - < Dockerfile
docker push $IMAGE_NAME:$CRAFTER_VERSION
docker tag $IMAGE_NAME:$CRAFTER_VERSION $IMAGE_NAME:latest
docker push $IMAGE_NAME:latest
