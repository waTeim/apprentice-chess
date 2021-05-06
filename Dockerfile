FROM node:11
RUN apt-get update && apt-get install -y lsof netcat && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package* /app/
RUN npm install && npm install -g typescript && npm install -g ts-api
RUN mkdir -p dist 
COPY . /app
RUN chmod +x entrypoint.sh
RUN tsc
RUN cg
EXPOSE 64100
CMD bash entrypoint.sh

