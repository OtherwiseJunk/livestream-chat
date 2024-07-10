FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN mv dist/* .
EXPOSE 3001
CMD [ "npm", "run", "start" ]
