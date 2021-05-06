import { ControllerBase, ControllerProperties, get, post, controller, Res } from 'ts-api';

import { Db, MongoClient } from 'mongodb';
import { Board,Game,GameFactory } from '../lib/GameFactory';
import { getClient } from '../lib/db';

interface NewGameResBody {
  success:boolean,
  message:string,
  game?:Game
}

interface FindResBody {
  success:boolean,
  message:string,
  game?:Game
};

interface CandidateMoveResBody {
  success:boolean,
  message:string,
  moves?:Move[]
};

interface UpdateResBody {
  success:boolean,
  message:string,
  game?:Game
};

interface GameMoveResBody {
  success:boolean,
  message:string
}

interface Move {
  from:string;
  to:string;
  piece:string;
  isCapture:boolean;
};

type NewGameRes = Res<200,NewGameResBody>;
type FindRes = Res<200|404,FindResBody>;
type CandidateMovesRes = Res<200|400,CandidateMoveResBody>;
type UpdateRes = Res<200|400,UpdateResBody>;
type GameMovesRes = Res<501,GameMoveResBody>;

@controller('/api')
export default class GameController extends ControllerBase
{
  private static client:MongoClient;

  private async getGame(id:string): Promise<Game>
  {
    console.log(`retrieving using ${id}`);
    if(!GameController.client) GameController.client = await getClient(this.properties.context.mongoUri);
    let game:Game = await GameFactory.getGame(GameController.client,id);

    return game;
  }

  private async updateGame(game:Game):Promise<null>
  {
    if(!GameController.client) GameController.client = await getClient(this.properties.context.mongoUri);
    await GameFactory.updateGame(GameController.client,game);
    return null;
  }

  private decodePosition(spos:string):string[][]
  {
    let dpos:string[][] = [];
    let index = 0;

    console.log("spos = ",spos);
    
    for(let i = 0;i < 8;i++)
    {
      dpos.push([]);
      dpos[i].push('-');
      for(let j = 0;j < 8;j++) dpos[i].push(spos[index++]);
      dpos[i].push('-');
    }
    return dpos;
  }

  private encodePosition(dpos:string[][]):string
  {
    let spos:string = "";

     for(let i = 0;i < dpos.length;i++)
     {
       for(let j = 1;j < dpos[i].length - 1;j++) spos += dpos[i][j];
     }
     return spos;
  }

  private decodeSquare(encoded:string):number[]
  {
    let code = encoded.toUpperCase();
    let index1 = code.charCodeAt(1) - '1'.charCodeAt(0);
    let index2 = code.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

    return [index1,index2];
  }

  private encodeSquare(index1:number,index2:number):string
  {
    return String.fromCharCode('A'.charCodeAt(0) + index2 - 1) + String.fromCharCode('1'.charCodeAt(0) + index1);
  }

  private genPotentialMovesFromPosition(positionArray:string[][],from:string): Move[]
  {
    let moves:Move[] = [];

    let indexes = this.decodeSquare(from);
    let piece = positionArray[indexes[0]][indexes[1]];
     
    console.log(`getting potentials for ${from} index1 = ${indexes[0]} index2 = ${indexes[1]}`);
    if(piece == 'P')
    {
      if(indexes[0] < 7 && positionArray[indexes[0] + 1][indexes[1] - 1] != '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] + 1,indexes[1] - 1);
        moves.push({ from:from, to:encodedSquare, piece:'P', isCapture:true });
      }
      if(indexes[0] < 7 && positionArray[indexes[0] + 1][indexes[1] + 1] != '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] + 1,indexes[1] + 1);
        moves.push({ from:from, to:encodedSquare, piece:'P', isCapture:true });
      }
      if(indexes[0] < 7 && positionArray[indexes[0] + 1][indexes[1]] == '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] + 1,indexes[1]);
        moves.push({ from:from, to:encodedSquare, piece:'P', isCapture:false });
      }
      if(indexes[0] == 1 && positionArray[indexes[0] + 2][indexes[1]] == '-' && positionArray[indexes[0] + 1][indexes[1]] == '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] + 2,indexes[1]);
        moves.push({ from:from, to:encodedSquare, piece:'P', isCapture:false });
      }
    }
    else if(piece == 'p')
    {
      if(indexes[0] > 0 && positionArray[indexes[0] - 1][indexes[1] - 1] != '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] - 1,indexes[1] - 1);
        moves.push({ from:from, to:encodedSquare, piece:'p', isCapture:true });
      }
      if(indexes[0] > 0 && positionArray[indexes[0] - 1][indexes[1] + 1] != '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] - 1,indexes[1] + 1);
        moves.push({ from:from, to:encodedSquare, piece:'p', isCapture:true });
      }
      if(indexes[0] > 0 && positionArray[indexes[0] - 1][indexes[1]] == '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] - 1,indexes[1]);
        moves.push({ from:from, to:encodedSquare, piece:'p', isCapture:false });
      }
      if(indexes[0] == 6 && positionArray[indexes[0] - 2][indexes[1]] == '-' && positionArray[indexes[0] - 1][indexes[1]] == '-') 
      {
        let encodedSquare = this.encodeSquare(indexes[0] - 2,indexes[1]);
        moves.push({ from:from, to:encodedSquare, piece:'p', isCapture:false });
      }
    }
    else return null;
    return moves;
  }

  private genPotentialMovesFromGame(game:Game,from:string): Move[]
  {
    let moves:Move[] = [];

    if(from.match(/[A-H][1-8]/i))
    {
      let positionArray = this.decodePosition(game.boardPositions[game.boardPositions.length - 1].position);

      moves = this.genPotentialMovesFromPosition(positionArray,from);
    }
    else return null;
    return moves;
  }

  private copyPosition(from:string[][]):string[][]
  {
    let to:string[][] = [];

    for(let i = 0;i < from.length;i++)
    {
      to.push([]);
      for(let j = 0;j < from[i].length;j++) 
      {
        to[i].push(from[i][j]);
      }
    }
    return to;
  }

  private updateWithMove(game:Game,from:string,to:string):boolean
  {
    if(game != null) 
    {
      let currentPosition = this.decodePosition(game.boardPositions[game.boardPositions.length - 1].position);
      let currentMoveNumber = game.boardPositions[game.boardPositions.length - 1].moveNumber;
      let moves = this.genPotentialMovesFromPosition(currentPosition,from);
      let valid = false;

      console.log("potentials",moves);
      if(moves != null && moves.length > 0)
      {
        for(let i = 0;i < moves.length;i++) 
        {
          if(to == moves[i].to) 
          {
            if(moves[i].piece == 'P' && currentMoveNumber % 2 == 0) valid = true;
            if(moves[i].piece == 'p' && currentMoveNumber % 2 == 1) valid = true;
            if(!valid) return false;
            break;
          }
        }
      }
      if(valid)
      {
        let fromIndexes = this.decodeSquare(from);
        let toIndexes = this.decodeSquare(to);
        let newPosition = this.copyPosition(currentPosition);
        let piece = currentPosition[fromIndexes[0]][fromIndexes[1]];

        newPosition[fromIndexes[0]][fromIndexes[1]] = '-';
        newPosition[toIndexes[0]][toIndexes[1]] = piece;

        let newBoard:Board = { moveNumber:currentMoveNumber + 1, position:this.encodePosition(newPosition) };

        game.boardPositions.push(newBoard);
        return true;
      }
      return false;
    }
    return true;
  }

  constructor(properties:ControllerProperties)
  {
    super(properties);
  }

  @get('/game/new') async newGame(): Promise<NewGameRes>
  {
    if(!GameController.client) GameController.client = await getClient(this.properties.context.mongoUri);
    let game:Game = await GameFactory.newGame(GameController.client);
    return { statusCode:200, body:{ success:true, message:`new game ${game._id} created`, game:game }};
  }

  @get('/game/:id') async findGame(id:string): Promise<FindRes>
  {
    let game:Game = await this.getGame(id);

    if(game != null) return { statusCode:200, body:{ success:true, message:`game ${id} found`, game:game }};
    else return { statusCode:404, body:{ success:false, message:`game ${id} not found` }};
  }

  @get('/game/:id/potentials') async getPotentialMoves(id:string,from:string):Promise<CandidateMovesRes> {
    let game:Game = await this.getGame(id);
    let moveList:Move[];

    from = from.toUpperCase();
    if(game != null) moveList = this.genPotentialMovesFromGame(game,from);
    if(moveList == null) return { statusCode:400, body:{ success:false, message:`invalid square (${from}) for game ${id}`}};
    return { statusCode:200, body:{ success:true, message:`found candidate moves for game ${id} at square ${from}`, moves:moveList }};
  }

  @post('/game/:id/next') async getMove(id:string,from:string,to:string):Promise<UpdateRes> {
    let game:Game = await this.getGame(id);
    let moveList:Move[];

    from = from.toUpperCase();
    to = to.toUpperCase();
    if(game != null && this.updateWithMove(game,from,to))
    {
      await this.updateGame(game);
      return  { statusCode:200, body:{ success:true, message:`game ${id} updated with move ${from} -> ${to}`}};
    }
    return  { statusCode:400, body:{ success:false, message:`game ${id} not updated with move ${from} -> ${to}: illegal move`}};
  }

  @get('/game/:id/moves') async getMoves(id:string): Promise<GameMovesRes> {
    return { statusCode:501, body:{ success:false, message:"Retireving game moves not implemented"}};
  }
}