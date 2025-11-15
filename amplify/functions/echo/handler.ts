import type { Handler } from 'aws-lambda'
import { Schema } from '../../data/resource'


export const handler: Handler = async (event: Schema["echo"]["functionHandler"]) => {
    const { input } = event.arguments

    return {
        output: input
    }
}
