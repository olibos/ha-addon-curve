import type { Notification } from './cloud-mailin.model';
import { version } from './package.json';
import express, { type Request } from 'express';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import type { SearchTransactionResponse, AddTransactionRequest, UpdateTransactionRequest } from './firefly.model'

type Options = {
  url: string
  token: string
  mapping: Map<string, string>
}

const options: Options = {} as any;
async function loadOptions(path: string) {
  type OptionFile = {
    FIREFLY_III_URL: string
    FIREFLY_III_ACCESS_TOKEN: string
    ACCOUNTS_MAPPING: Array<{ card: string, account: string }>
  }

  const { FIREFLY_III_URL, FIREFLY_III_ACCESS_TOKEN, ACCOUNTS_MAPPING } = JSON.parse(await readFile(path, 'utf8')) as OptionFile;
  options.url = FIREFLY_III_URL;
  options.token = FIREFLY_III_ACCESS_TOKEN;
  options.mapping = new Map<string, string>(ACCOUNTS_MAPPING.map(entry => [entry.card, entry.account]));
}

loadOptions(process.env.OPTION_FILE ?? '/data/options.json')
  .catch((error) => {
    console.error('Unable to load options\n', error);
    process.exit(1);
  });

const app = express();

app.use(express.json());
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'development') {
  app.get('/', (_, res) => {
    res.send(`Hello ha-addon-curve ${version}!`);
  });
}

const ExpenseExpression = /You made a purchase at:\s+(?<Name>[^\r\n]{1,100})\s*?(?<Devise>[$€£])(?<Amount>\d+(?:\.\d{0,2}))\s+(?<Date>\d{2}\s\w{1,20}\s\d{4}\s\d{2}:\d{2}:\d{2})\s+On this card:\s+(?:[^\n]+)\s+(?<CardAlias>[^\r\n]+)/;
app.post('/process', (req: Request<Record<string, string>, string, Notification>, res) => {
  async function process() {
    if (!req.body.headers.subject.includes('Curve Receipt: Purchase at')) {
      console.warn(`Invalid subject: "${req.body.headers.subject}"`);
      return;
    }

    const match = req.body.plain.match(ExpenseExpression);
    if (match?.groups === undefined) {
      console.warn('Unable to find transaction information:\n', req.body.plain);
      return;
    }

    const { Name, Devise, Amount, Date: date, CardAlias } = match.groups;
    const accountId = options.mapping.get(CardAlias);
    if (!accountId) {
      console.warn(`No account mapping found for "${CardAlias}"`);
      return;
    }

    const transactionDate = new Date(date);
    const json = JSON.stringify({ Name, Devise, Date: transactionDate, CardAlias });
    const internalReference = createHash('sha256').update(json).digest('hex');

    transactionDate.setSeconds(0);
    const searchTransactionResponse = await fetch(
      new URL(`/api/v1/search/transactions?query=internal_reference%3A%22${internalReference}%22&page=1`, options.url),
      {
        headers: { Authorization: `Bearer ${options.token}` }
      });
    const searchTransactionResult = await searchTransactionResponse.json() as SearchTransactionResponse;
    const transactionId = searchTransactionResult.data[0]?.id;
    if (!transactionId) {
      await fetch(
        new URL('/api/v1/transactions', options.url),
        {
          method: 'post',
          headers: {
            Authorization: `Bearer ${options.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error_if_duplicate_hash: false,
            transactions: [
              {
                type: 'withdrawal',
                description: Name,
                amount: Amount,
                date: transactionDate.toISOString(),
                destination_name: Name,
                source_id: accountId,
                internal_reference: internalReference,
                tags: ['Curve']
              }
            ]
          } satisfies AddTransactionRequest)
        });
    } else {
      await fetch(
        new URL(`/api/v1/transactions/${transactionId}`, options.url),
        {
          method: 'put',
          headers: {
            Authorization: `Bearer ${options.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transactions: [{ amount: Amount }]
          } satisfies UpdateTransactionRequest)
        });
    }
  }

  process().catch((error: Error) => {
    console.error(error);
    res.status(500).send('');
  }).finally(() => !res.headersSent && res.end());
});

const PORT = 3000;
export default app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT} ...`);
});
