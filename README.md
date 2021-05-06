## A solution to apprentice chess.

This repository contains a program supporting an API that implements the
build a “Chess as a Service” API task.

It is a server written in typescript, but when transformed with the typescript
compiler (tsc), is transformed to javascript suitable to be executed by node.js.

There are 2 main files where the logic lies:

1. `src/lib/GameFactory.ts`
2. `src/controllers/GameController.ts

There are other files which support configuration and documentation as well
a boilerplate kind of files that exist to comply with a framework ts-api

### Installation and build

    npm install
    npm run build

this will cause not only npm to install the various support packages, but also compile and
generate additional files and place them in dist.

### Running

there is a command in bin which will start the server but requires mongo to alreayd be available
at the indicated uri

   ./bin/apprentice-chess mongodb://<mongo host>

### Docker Compose

To avoid all the subtlties of install and building configuration and environment during execution,
2 docker-compose files are provided one in the top level directory which corresponds to the app itself,
and one in the apprentice-chess-infra directory and can be built and run in the following way
starting in the top level directory

    docker network create apprentice-chess
    docker-compose build
    cd apprentice-chess-infra
    docker-compose up -d
    cd ..
    docker-compose up -d

### API Endpoints

1. localhost:64100/docs: Online OpenAPI swaggar.io type documentation and interactive testing
2. localhost:64100/api/game/new: Create a new game
3. localhost:64100/api/game/{id}: given an id, retrieve a game
4. localhost:64100/api/game/{id}/potentials: given a game and an origin square, return all moves of that piece in that square
5: localhost:64100/api/game/{id}/next: update the game state with a move
6: localhost:64100/api/game/{id}/moves: Always returns 501

Using the swagger.io online docs illustrates how to interact with the server using curl.

### Visual Studio Code Support

There is also a visual studio code .devcontainer directory that will cause that IDE to automatically build a
testing environment. Note that it would probably require the apprentice-chess network to already exist as
from above

    docker network create apprentice-chess
