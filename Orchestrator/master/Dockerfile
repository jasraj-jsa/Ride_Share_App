FROM node:current-slim
ENV TEAM_NAME=CC_0085_0133_0171_0289
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
RUN npm install
RUN npm install pm2@3.5.1 -g
EXPOSE 3000
CMD [ "node", "master.js" ]
COPY . /app
