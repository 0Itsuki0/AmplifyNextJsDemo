import { defineFunction } from '@aws-amplify/backend'

export const echoFunction = defineFunction({
    // optionally specify a name for the Function (defaults to directory name)
    name: 'echo',
    // optionally specify a path to your handler (defaults to "./handler.ts")
    entry: './handler.ts',
    timeoutSeconds: 60 * 5,
    memoryMB: 512,
    architecture: "arm64",
    ephemeralStorageSizeMB: 512,
    environment: {},
    runtime: 22,
    // event bridge triggers
    // schedule: ["0 9 ? * 2 *", "every week"],
})
