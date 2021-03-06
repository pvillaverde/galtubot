FROM node:15-alpine
MAINTAINER Pablo Villaverde <https://github.com/pvillaverde>
## Install App dependencies
## Using wildcard to copy both package.json and package-lock.json
## This forces Docker not to use cache when we change our dependencies
ADD package*.json /tmp/
RUN cd /tmp && apk add --no-cache --virtual .gyp python make g++ && npm install && apk del .gyp
RUN mkdir -p /opt/galtubot && cp -a /tmp/node_modules /opt/app
## Now we copy our App source code, having the dependencies previously cached if possible.
WORKDIR /opt/galtubot
ADD . /opt/galtubot

CMD [ "node", "index.js" ]