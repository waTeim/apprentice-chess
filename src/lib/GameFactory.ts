import { MongoClient,ObjectId } from 'mongodb';

export interface Board
{
  moveNumber:number;
  position:string;
}

export interface Game
{
  _id:string;
  boardPositions: Board[];
}

export class GameFactory
{
  static getInitialPosition(): string
  {
    let initial:string = 'RNBQKBNRPPPPPPPP--------------------------------pppppppprnbqkbnr';

    return initial;
  }

  static async newGame(client:MongoClient):Promise<Game>
  {
    let initial:string = GameFactory.getInitialPosition();
    let board:Board = { moveNumber:0, position:initial };
    let game:Game = { _id:null, boardPositions:[board] };

    let res = await client.db().collection('games').insertOne(game);

    return game;
  }

  static async getGame(client:MongoClient,gameId:string):Promise<Game>
  {
    let res = await client.db().collection('games').find(new ObjectId(gameId));
    let games:Game[] = await res.toArray();

    if(games.length > 0) return games[0];
    return null;
  }

  static async updateGame(client:MongoClient,game:Game):Promise<null>
  {
    await client.db().collection('games').updateOne({ _id:game._id },{ $set:{ boardPositions:game.boardPositions }});
    return null;
  }
}