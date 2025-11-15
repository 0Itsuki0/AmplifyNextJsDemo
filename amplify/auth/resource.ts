import { defineAuth } from "@aws-amplify/backend"

export const auth = defineAuth({
    // stack (resource) name that will aid in generating resource names.
    name: undefined,
    loginWith: {
        email: true,
        // we cannot specify false here. Use undefine or leave the key out.
        phone: undefined,
        externalProviders: undefined
    },
    userAttributes: {
        email: {
            required: true
        }
    },
    accountRecovery: "EMAIL_ONLY",
    multifactor: {
        mode: "OFF"
    }
})