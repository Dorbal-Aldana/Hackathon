import { parseMaterialBytes } from './material-parser.js';
process.once('message', async workerData => {
  let result;
  try { result = { text: await parseMaterialBytes(Buffer.from(workerData.base64, 'base64'), workerData.extension) }; }
  catch (error) { result = { error: error.message }; }
  process.send(result, () => process.disconnect());
});
