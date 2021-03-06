import { Hono } from 'hono'
import { ethers } from "ethers";

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

interface IChainConfig {
  folder: string;
  id: string;
  json_rpc: string;
}

const getChainIdConfig = (id: string): IChainConfig | null => {
  switch (id) {
    case '1':
      return {
        folder: 'etherium',
        id,
        json_rpc: 'https://speedy-nodes-nyc.moralis.io/1a2b3c4d5e6f1a2b3c4d5e6f/eth/mainnet'
      }
    case '56':
      return {
        folder: 'smartchain',
        id,
        json_rpc: 'https://bsc--mainnet--rpc.datahub.figment.io:8545/apikey/00c6fa81ad8c6e888dba7ce01ee33b34'
      }
    case '43114':
      return {
        folder: 'avalanchex',
        id,
        json_rpc: 'https://speedy-nodes-nyc.moralis.io/1a2b3c4d5e6f1a2b3c4d5e6f/avalanche/mainnet'
      }
    case '250':
      return {
        folder: 'fantom',
        id,
        json_rpc: '' // TODO:
      }
    case '137':
      return {
        folder: 'polygon',
        id,
        json_rpc: 'https://speedy-nodes-nyc.moralis.io/1a2b3c4d5e6f1a2b3c4d5e6f/polygon/mainnet'
      }
  }
  return null;
};

const getAddressLogo = async ({ chainId, address, type }) => {
  console.log({ chainId, address, type });
  const defaultLogo = type === 'token' ? 'https://raw.githubusercontent.com/thanhlmm/nimbus-logo/main/assets/coin.svg' : 'https://raw.githubusercontent.com/thanhlmm/nimbus-logo/main/assets/smart-contract.png';
  try {
    const chainConfig = getChainIdConfig(chainId);
    if (chainConfig) {
      // TODO: Cache this fetch list
      const tokenList: any = await fetch(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainConfig.folder}/tokenlist.json`).then(response => response.json());
      // console.log(tokenList);
      const tokens = tokenList.tokens;

      const tokenData = tokens.find(token => token.address.toLowerCase() === address);
      if (tokenData?.logoURI) {
        return tokenData.logoURI
      }
      const addressInfo: any = await fetch(`https://getnimbus.xyz/api/address/${chainId}/${address}`).then(response => response.json());
      return addressInfo?.data?.isContract ? defaultLogo : 'https://raw.githubusercontent.com/thanhlmm/nimbus-logo/main/assets/user.png';
    }
  } catch (error) {
    console.log(error);
    console.log('error', error);
  }

  return defaultLogo;
}

app.get('/logo/:chainId/:address', async (c) => {
  const chainId = c.req.param('chainId');
  const address = c.req.param('address').toLowerCase();

  return c.redirect(await getAddressLogo({ chainId, address, type: undefined }), 301);
});

app.get('/logo/:chainId/:address/token', async (c) => {
  const chainId = c.req.param('chainId');
  const address = c.req.param('address').toLowerCase();

  return c.redirect(await getAddressLogo({ chainId, address, type: 'token' }), 301);
});

app.get('/info/:chainId/:address', async (c) => {
  const chainId = c.req.param('chainId');
  const address = c.req.param('address').toLowerCase();

  const key = `${chainId}-${address}`;
  const info = await c.env.NIMBUS.get(key);
  const data = info ? JSON.parse(info) : null;

  return c.json({ data });
})

app.onError((err, c) => {
  // console.error(`${err}`)
  console.log(err);
  return c.text('Custom Error Message', 500)
})

export default app