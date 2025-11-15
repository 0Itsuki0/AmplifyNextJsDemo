import { a, defineData, type ClientSchema } from '@aws-amplify/backend'
import { echoFunction } from '../functions/echo/resource'

// database (dynamo) schema
// to model relationship such as one-to-many, one-to-one, and many-to-many:
// https://docs.amplify.aws/nextjs/build-a-backend/data/data-modeling/relationships/
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-relational-modeling.html
const schema = a.schema({
    Todo: a.model({
        content: a.string(),
        isDone: a.boolean()
    })
        //  anyone authenticated using an API key can create, read, update, and delete todos.
        .authorization(allow => [allow.publicApiKey()]),

    // functions to be invoked with frontend
    echo: a
        .query()
        .arguments({ input: a.string().required() })
        .returns(a.json())
        .authorization((allow) => [allow.publicApiKey()])
        .handler(a.handler.function(echoFunction)),

})


// Used for code completion / highlighting when making requests from frontend
export type Schema = ClientSchema<typeof schema>

// defines the data resource to be deployed
export const data = defineData({
    schema,
    authorizationModes: {
        // other options: "iam" | "identityPool" | "userPool" | "oidc" | "apiKey" | "lambda"
        defaultAuthorizationMode: 'apiKey',
        apiKeyAuthorizationMode: { expiresInDays: 30 }
    }
})