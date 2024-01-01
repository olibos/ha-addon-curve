import { version } from './package.json';
import express from 'express';

const app = express();
const port = process.env.PORT ?? 3000;

app.disable('x-powered-by');
app.get('/', (_, res) => {
  res.send(`Hello ha-addon-curve ${version}!`);
});

export default app.listen(port, () => {
  console.log(`Listening on http://localhost:${port} ...`);
});
