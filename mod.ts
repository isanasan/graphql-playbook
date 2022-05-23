import {
  ClientError,
  gql,
  GraphQLClient,
} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";

const GITHUB_GRAPHQL_ENDPOINT = Deno.env.get("GITHUB_ENDPOINT") ||
  "https://api.github.com/graphql";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

if (GITHUB_TOKEN === undefined) {
  console.error("require GITHUB_TOKEN");
  Deno.exit(1);
}

export const graphQLClient = new GraphQLClient(GITHUB_GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${GITHUB_TOKEN}`,
  },
});

const query = gql`
    query($after: String) {
        search(query: "is:repo org:LancersDevTeam archived:false sort:committer-date",type:REPOSITORY,first:100,after: $after) {
            repositoryCount,
            edges{
                node{
                    ... on Repository {
                        name,
                    }
                }
            }
        }
    }
    `;

let after: string | undefined;

while (true) {
  try {
    const data = await graphQLClient.request(query, { after });
    data.search.edges.map((e: any) => console.log(e.node.name));
    if (!data.search.pageInfo.hasNextPage) break;
    after = data.search.pageInfo.endCursor;
  } catch (error) {
    if (error instanceof ClientError) {
      switch (error.response.status) {
        case 401:
          console.error(JSON.stringify(error, undefined, 2));
          Deno.exit(1);
      }
    } else {
      console.error(JSON.stringify(error, undefined, 2));
      Deno.exit(1);
    }
  }
}
