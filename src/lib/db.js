const MongoClient = require('mongodb').MongoClient;

export async function getClient(uri) {
  let client = new MongoClient(uri);

  try {
    await client.connect();
    return client;
  }
  catch (e) { 
    console.error(e);
    return null;
  }
}