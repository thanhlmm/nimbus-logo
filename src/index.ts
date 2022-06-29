import { Hono } from 'hono'
import { poweredBy } from 'hono/powered-by'
import { basicAuth } from 'hono/basic-auth'

export const app = new Hono()

// Routing
app.get('/', (c) => c.html('<h1>Hello, this is Nimbus logo!</h1>'))

const chainIdFolder = {
  56: 'smartchain',
  1: 'etherium',
  43114: 'avalanchex',
  250: 'fantom',
  137: 'polygon'
}

app.get('/logo/:chainId/:address', async (c, next) => {
  const chainId = c.req.param('chainId');
  const address = c.req.param('address').toLowerCase();
  try {
    const chainFolder = chainIdFolder[chainId];
    if (chainFolder) {
      const tokenList: any = await fetch(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainFolder}/tokenlist.json`).then(response => response.json());
      // console.log(tokenList);
      const tokens = tokenList.tokens;

      const tokenData = tokens.find(token => token.address.toLowerCase() === address);
      if (tokenData) {
        return c.redirect(tokenData.logoURI, 301);
      }
    }
  } catch (error) {
    console.log('error', error);
  }
  return c.redirect('https://assets.debank.com/static/media/contract.13bef102.svg', 302);
});

app.onError((err, c) => {
  // console.error(`${err}`)
  console.log(err);
  return c.text('Custom Error Message', 500)
})

// export default app

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const cacheUrl = new URL(request.url);
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (response) {
      console.log('HIT');
      return response;
    }
    console.log('MISS');
    return app.fetch(request, env, ctx)
  },
}