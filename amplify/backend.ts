import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { echoFunction } from "./functions/echo/resource"
import { CfnManagedLoginBranding } from 'aws-cdk-lib/aws-cognito'
import { SqsEventSource, S3EventSourceV2 } from 'aws-cdk-lib/aws-lambda-event-sources'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { AuthorizationType, CognitoUserPoolsAuthorizer, EndpointType, IdentitySource, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications'
import { EventType } from 'aws-cdk-lib/aws-s3'

const backend = defineBackend({
    auth: auth,
    data: data,
    // for functions we want to invoke from the frontend (page.tsx),
    // we will need define those as query in data/resources.ts as well.
    echoFunction: echoFunction,
    storage: storage
})


// an example of setting up domain and managed login so that we can use the cognito with other react libaries such as react-oidc-context
// backend.auth.resources.cfnResources.cfnUserPoolClient.callbackUrLs = ["http://localhost:3000"]

// backend.auth.resources.userPool.addDomain("managed-login-domain", {
//     cognitoDomain: {
//         domainPrefix: "itsuki-domain"
//     },
//     // 1 for classic HostedUI
//     managedLoginVersion: 2
// })

// const branding = new CfnManagedLoginBranding(backend.stack, "managed-login-branding", {
//     userPoolId: backend.auth.resources.userPool.userPoolId,
//     clientId: backend.auth.resources.userPoolClient.userPoolClientId,
//     useCognitoProvidedValues: true,
// })

// // an example of adding SQS to trigger lambda
// const queue = new Queue(backend.stack, "lambda-trigger-queue", {})
// backend.echoFunction.resources.lambda.addEventSource(new SqsEventSource(queue))

// add triggers to S3 Bucket
// Option 1: with S3EventSourceV2
backend.echoFunction.resources.lambda.addEventSource(new S3EventSourceV2(backend.storage.resources.bucket, {
    events: [EventType.OBJECT_CREATED_PUT]
}))
// Option 2: with addEventNotification
backend.storage.resources.bucket.addEventNotification(EventType.OBJECT_CREATED_PUT, new LambdaDestination(backend.echoFunction.resources.lambda))

// // an example of adding to lambda role policy
// backend.echoFunction.resources.lambda.addToRolePolicy(new PolicyStatement({
//     sid: "S3ReadWrite",
//     effect: Effect.ALLOW,
//     actions: [
//         "s3:PutObject",
//         "s3:GetObject",
//         "s3:DeleteObject"
//     ],
//     resources: ["*"]
// }))


// // an example of adding API Gateway, connect it to lambda and authorize with cognito above
// const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(backend.stack, 'ApigatewayAuthorizer', {
//     cognitoUserPools: [backend.auth.resources.userPool],
//     identitySource: IdentitySource.header("Authorization")
// })

// const restApi = new LambdaRestApi(backend.stack, 'APIGatewayRestAPI', {
//     handler: backend.echoFunction.resources.lambda,
//     endpointTypes: [EndpointType.REGIONAL],
//     defaultMethodOptions: {
//         authorizationType: AuthorizationType.COGNITO,
//         authorizer: cognitoAuthorizer,
//         // to use access token instead of id token for authorization
//         authorizationScopes: ["email", "openid"]
//     },
// })
// cognitoAuthorizer._attachToApi(restApi)
