import {version} from "./package.json";
import express from "express";

const app = express();
const port = process.env.PORT ?? 3000;

app.get("/", (_, res) => {
  res.send(`Hello ha-addon-curve ${version}!`);
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port} ...`);
});
