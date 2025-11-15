"use client"

import type { Schema } from '../../amplify/data/resource'
import outputs from "../../amplify_outputs.json"

import '@aws-amplify/ui-react/styles.css'

import { Amplify } from 'aws-amplify'
import { Authenticator, UseAuthenticator } from '@aws-amplify/ui-react'
import { AuthUser } from '@aws-amplify/auth'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import { uploadData, getUrl, downloadData, remove } from "aws-amplify/storage"


Amplify.configure(outputs)

export default function Home() {
    return (
        <div className="w-screen h-screen bg-black flex items-center">
            <div className="flex flex-col gap-0 w-[80vw] h-[80vh] max-w-3xl min-w-md items-center justify-center m-auto bg-gray-900 rounded-2xl relative">
                <Authenticator className='bg-black'>
                    {({ signOut, user }) => (
                        // authenticated contents
                        <AuthorizedContents user={user} signOut={signOut} />
                    )}
                </Authenticator>
            </div>
        </div>
    )
}


const client = generateClient<Schema>()
type Todo = Schema["Todo"]["type"]

function AuthorizedContents({ user, signOut }: {
    user?: AuthUser
    signOut?: UseAuthenticator["signOut"]
}) {
    const [todos, setTodos] = useState<Todo[]>([])
    const [error, setError] = useState<string | null>(null)

    /*********************/
    /**** Functions ******/
    /*********************/
    // to invoke custom function (echoFunction) from frontend
    const echo = async (input: string) => {
        const { data, errors } = await client.queries.echo({
            input: input,
        })
        if (data && typeof (data) === "string") {
            const obj = JSON.parse(data)
            if ("output" in obj) {
                alert(obj.output)
            } else {
                alert(data)
            }
        }
        if (errors) {
            setError(errors.map((e) => e.message).join("\n"))
        }
    }

    /*********************/
    /**** Data ******/
    /*********************/
    // add data model
    const createTodo = async () => {
        const content = window.prompt("Todo content?")
        if (!content || content.trim() === "") {
            return
        }
        const { errors } = await client.models.Todo.create({
            content: content,
            isDone: false
        })
        if (errors) {
            setError(errors.map((e) => e.message).join("\n"))
        }
        // since we have subscribed to updates
        // we don't need to fetch those after or add the new one with setTodos here
    }

    // fetch data model
    // to get a specific item, we can use the following
    // const { data: todo, errors } = await client.models.Todo.get({
    //   id: '...',
    // })
    const fetchTodos = async () => {
        const { data: items, errors, nextToken } = await client.models.Todo.list({
            // filter data
            // filter: {
            //     isDone: { eq: false }
            // },
            // limit data
            // limit: 10
            // paging
            // nextToken: null
        })

        setTodos(items)

        if (errors) {
            setError(errors.map((e) => e.message).join("\n"))
        }
    }

    // update
    const updateTodo = async (current: Todo, isDone: boolean) => {
        current.isDone = isDone
        const { data: updatedTodo, errors } = await client.models.Todo.update(current)
        if (errors) {
            setError(errors.map((e) => e.message).join("\n"))
        }
        // since we have subscribed to updates
        // we don't need to fetch those after or add the new one with setTodos here
    }

    // delete data model
    const deleteTodo = async (id: string) => {
        const { errors } = await client.models.Todo.delete({ id: id })
        if (errors) {
            setError(errors.map((e) => e.message).join("\n"))
        }
        // since we have subscribed to updates
        // we don't need to fetch those after or delete it from todos with setTodos here
    }

    /*******************/
    /**** Storage ******/
    /*******************/
    const storagePath = () => {
        return `todos/${user?.userId}`
    }

    const uploadTodosToStorage = async () => {
        try {
            uploadData({
                data: JSON.stringify(todos),
                path: storagePath()
            })
            alert("Upload Finished")
        } catch (error) {
            setError(`${error}`)
        }
    }

    const deleteTodosFromStorage = async () => {
        try {
            await remove({
                path: storagePath(),
            })
            alert("Delete Finished")
        } catch (error) {
            if (error instanceof Error && error.name === "NoSuchKey") {
                setError("Nothing needs to be deleted.")
            } else {
                setError(`${error}`)
            }
        }
    }


    // download as data
    const downloadTodoFromStorgae = async () => {
        try {
            const downloadResult = await downloadData({
                path: storagePath(),
                options: {
                    // monitor download progress
                    onProgress: (progress) => {
                        if (progress.totalBytes) {
                            console.log(`Download progress: ${(progress.transferredBytes / progress.totalBytes) * 100}%`)
                        }
                    }
                }
            }).result
            const text = await downloadResult.body.text()
            alert(text)
        } catch (error) {
            if (error instanceof Error && error.name === "NoSuchKey") {
                setError("Nothing uploaded yet!")
            } else {
                setError(`${error}`)
            }
        }
    }

    // s3 presigned URL
    const getTodosStorageURL = async () => {
        try {
            const linkToStorageFile = await getUrl({
                path: storagePath(),
                options: {
                    // specify a target bucket using name assigned in Amplify Backend
                    // bucket: 'assignedNameInAmplifyBackend',
                    // ensure object exists before getting url
                    validateObjectExistence: true,
                    // url expiration time in seconds.
                    expiresIn: 300,
                    // whether to use accelerate endpoint
                    useAccelerateEndpoint: false,
                    // The account ID that owns the requested bucket.
                    expectedBucketOwner: user?.userId,
                }
            })
            alert(linkToStorageFile.url)
        } catch (error) {
            if (error instanceof Error && error.name === "NoSuchKey") {
                setError("Nothing uploaded yet!")
            } else {
                setError(`${error}`)
            }
        }
    }


    // subscribe to real time updates on data models
    // since we have subscribed to observeQuery, we don't need to manually fetch those manually anymore on start with fetchTodos()
    useEffect(() => {
        // subscribe to list
        const listSub = client.models.Todo.observeQuery({
            // additional settings:
            // filter: {},
            // selectionSet: [],
            // authMode: "apiKey",
            // authToken: ""
        }).subscribe({
            next: ({ items }) => {
                setTodos(items)
            },
            error: (error) => {
                setError(`${error}`)
            }
        })
        // some other subscriptions availalble
        // Subscribe to creation: client.models.Todo.onCreate().subscribe
        // Subscribe to update: client.models.Todo.onUpdate().subscribe
        // Subscribe to deletion: client.models.Todo.onDelete().subscribe
        //
        // observeQuery will also be triggered on model creation, update, delete so we don't need those here.

        // stop receiving subscription events
        return () => {
            listSub.unsubscribe()
        }
    }, [])



    useEffect(() => {
        echo("Hello")
    }, [user])


    return (
        <div className='flex flex-col w-full h-full py-6 px-8 gap-6 overflow-scroll'>
            <div className='flex flex-row gap-4 items-center justify-between'>
                <div className='flex flex-row gap-4 items-center justify-start'>
                    <h1 className='text-2xl font-bold'>Todo List</h1>
                    <button onClick={createTodo} className='border rounded-md w-fit py-1 px-2 '>Add New</button>
                    <button onClick={fetchTodos} className='border rounded-md w-fit py-1 px-2 '>Refresh</button>
                </div>
                <button onClick={signOut} className='border rounded-md w-fit py-1 px-2 text-red-300'>Sign out</button>
            </div>
            <div className='flex flex-col w-full h-full gap-4'>
                {
                    (error === null) ? null :
                        <p className='text-red-300'>{error}</p>
                }
                {
                    (todos.length === 0) ?
                        <p className='text-gray-400'>No Todos</p> : null
                }
                {todos.map((todo, index) => (
                    <div key={todo.id} className='flex flex-col gap-1'>
                        <div className='flex flex-row gap-4 items-center'>
                            {index + 1}. {todo.content}
                            {
                                todo.isDone ? null : <button onClick={() => updateTodo(todo, true)} className='border rounded-md w-fit py-0.5 px-1 text-blue-400 text-xs!'>Finish</button>
                            }
                            <button onClick={() => deleteTodo(todo.id)} className='border rounded-md w-fit py-0.5 px-1 text-red-300 text-xs!'>Delete</button>
                        </div>
                        <span className='ml-5 text-xs text-gray-400'>Status: {todo.isDone ? "Done" : "Pending"}</span>
                        <span className='ml-5 text-xs text-gray-400'>Updated At: {new Date(todo.updatedAt).toLocaleString()}. Created At: {new Date(todo.createdAt).toLocaleString()}</span>
                    </div>
                ))}

                <div className='border-t-[0.5px] flex flex-row items-center justify-start gap-4 pt-4'>
                    <p className='font-semibold'>Storage Persistance</p>
                    <button onClick={uploadTodosToStorage} className='border rounded-md w-fit py-0.5 px-1'>Upload</button>
                    <button onClick={downloadTodoFromStorgae} className='border rounded-md w-fit py-0.5 px-1'>Donwload</button>
                    <button onClick={getTodosStorageURL} className='border rounded-md w-fit py-0.5 px-1'>URL</button>
                    <button onClick={deleteTodosFromStorage} className='border rounded-md w-fit py-0.5 px-1 text-red-300'>Delete</button>

                </div>
            </div>
        </div>
    )
}