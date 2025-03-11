import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { TokenBalance, NetworkBalances, AccountInfo } from '../types';
import { trackError } from './analytics';

const ZAPPER_API_KEY = '2ab842c7-4893-45ab-838c-7be767e8716c';
const GRAPHQL_URL = 'https://public.zapper.xyz/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-zapper-api-key': ZAPPER_API_KEY,
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const PORTFOLIO_QUERY = gql`
  query PortfolioQuery($addresses: [Address!]!) {
    portfolioV2(addresses: $addresses) {
      tokenBalances {
        byToken(first: 100) {
          edges {
            node {
              tokenAddress
              networkId
              name
              symbol
              decimals
              price
              balance
              balanceUSD
              balanceRaw
              imgUrlV2
              network {
                name
              }
            }
          }
        }
      }
    }
    accounts(addresses: $addresses) {
      address
      displayName {
        value
        source
      }
      ensRecord {
        name
      }
      farcasterProfile {
        username
        metadata {
          displayName
          imageUrl
        }
      }
    }
  }
`;

export async function getWalletBalances(address: string): Promise<{
  tokens: TokenBalance[];
  accountInfo: AccountInfo;
}> {
  try {
    const { data } = await client.query({
      query: PORTFOLIO_QUERY,
      variables: {
        addresses: [address]
      },
    });

    // Process tokens
    const tokens: TokenBalance[] = data?.portfolioV2?.tokenBalances?.byToken?.edges
      ? data.portfolioV2.tokenBalances.byToken.edges
          .map((edge: any) => {
            const node = edge.node;
            return {
              token: node.symbol,
              amount: parseFloat(node.balance),
              value: parseFloat(node.balance) * (node.price || 0), // Use balanceUSD for proper value
              logo: node.imgUrlV2 || 'https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x0000000000000000000000000000000000000000.png',
              network: node.network.name.toLowerCase(),
            };
          })
          .sort((a: TokenBalance, b: TokenBalance) => b.value - a.value)
      : [];

    // Process account info
    const account = data?.accounts?.[0];
    const avatarUrl = account?.farcasterProfile?.metadata?.imageUrl || null;

    const accountInfo: AccountInfo = {
      address,
      ensName: account?.ensRecord?.name || null,
      farcasterName: account?.farcasterProfile?.username || null,
      farcasterDisplayName: account?.farcasterProfile?.metadata?.displayName || null,
      avatar: avatarUrl
    };

    return {
      tokens,
      accountInfo
    };
  } catch (error) {
    if (error instanceof Error) {
      trackError(error);
      console.error('Failed to fetch wallet balances:', error);
    } else {
      const wrappedError = new Error('Unknown error occurred while fetching wallet balances');
      trackError(wrappedError);
      console.error('Failed to fetch wallet balances:', wrappedError);
    }
    return {
      tokens: [],
      accountInfo: {
        address,
        ensName: null,
        farcasterName: null,
        farcasterDisplayName: null,
        avatar: null
      }
    };
  }
}

export async function getNetworkBalances(address: string): Promise<NetworkBalances[]> {
  try {
    const { tokens } = await getWalletBalances(address);
    const networkBalances: NetworkBalances[] = [];

    // Group tokens by network
    const networkGroups: { [key: string]: TokenBalance[] } = {};
    
    for (const token of tokens) {
      const network = token.network;
      if (!networkGroups[network]) {
        networkGroups[network] = [];
      }
      networkGroups[network].push(token);
    }

    // Convert groups to NetworkBalances array
    for (const [network, tokens] of Object.entries(networkGroups)) {
      const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
      networkBalances.push({
        chainName: network.charAt(0).toUpperCase() + network.slice(1),
        balances: tokens,
        totalValue
      });
    }

    // Sort networks by total value
    return networkBalances.sort((a, b) => b.totalValue - a.totalValue);
  } catch (error) {
    if (error instanceof Error) {
      trackError(error);
      console.error('Failed to calculate network balances:', error);
    } else {
      const wrappedError = new Error('Unknown error occurred while calculating network balances');
      trackError(wrappedError);
      console.error('Failed to calculate network balances:', wrappedError);
    }
    return [];
  }
}