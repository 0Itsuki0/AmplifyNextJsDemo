import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
    name: 'itsukiS3Storage',
    // access rules: https://docs.amplify.aws/nextjs/build-a-backend/storage/authorization/
    // By default, no one / resources has access to the bucket
    access: (allow) => ({
        'todos/*': [
            // owner-based access
            allow.entity('identity').to(['read', 'write', 'delete'])
        ],
    }),
    // to configure lambda triggers on S3 Events
    // https://docs.amplify.aws/nextjs/build-a-backend/storage/lambda-triggers/
    // triggers: {
    //     onUpload: defineFunction({
    //         entry: './on-upload-handler.ts'
    //     }),
    //     onDelete: defineFunction({
    //         entry: './on-delete-handler.ts'
    //     })
    // }
})