import init from './init';

let PORT:number;

if(process.env.PORT != null) PORT = parseInt(process.env.PORT);
else PORT = 64100;

async function initServer(mongoUri:string)
{
  let app:any = await init(mongoUri);
  let server = app.listen(PORT, () => { console.log(`App is running at http://localhost:${PORT}`); });

  return server;
}

export default async function main(program:any)
{
  let mongoUri:string = program.args[0];

  if(mongoUri != null) await initServer(mongoUri);
  else program.help();
}
