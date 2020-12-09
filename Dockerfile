FROM node:alpine

RUN mkdir /app
COPY . /app

CMD ["yarn", "start"]