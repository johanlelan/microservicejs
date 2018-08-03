FROM node:8-alpine
LABEL maintainer="johan.lelan@gmail.com"

WORKDIR /src

# Provides cached layer for node_modules
ADD package.json package-lock.json .npmrc /src/

# We add some dependencies for node-gyp native node_modules
# https://github.com/nodejs/node-gyp
RUN apk add --no-cache --virtual .build-dependencies git g++ make python \
  # Install npm modules
  && npm install --production \
  # Clean everything
  && npm cache clean --force \
  && apk del .build-dependencies

# Copy application
COPY . /src

# Define env variables
ENV NODE_ENV 'production'

# Expose port
EXPOSE 8080 9229

# At the end, set the user to use when running this image
USER node

# Run app
CMD ["node", "--inspect", "server.js"]
