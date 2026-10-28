import express from "express"
import dotenv from "dotenv"
import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq"
import { TavilySearch } from "@langchain/tavily";
import {tool} from "langchain"
import {ToolNode} from "@langchain/langgraph/prebuilt"
import z from "zod";
import { MessagesAnnotation, StateGraph, MemorySaver, StateSchema, interrupt } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";

dotenv.config()

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

const client = new MongoClient("mongodb+srv://manishkumar1abc2_db_user:I8BVrudVNyjZY5rH@cluster0.w6x3ni5.mongodb.net/") 

const checkpointer = new MongoDBSaver({client})


const customState = new StateSchema({
    prompt:z.string(),
    approvalRequired:z.boolean(),
    aiResponse:z.string(),
    approved:z.boolean(),
    result:z.string()
})

const model = new ChatGroq({
    model:"openai/gpt-oss-120b"
})

const agent = async (state)=>{
    const result = await model.invoke([
        {
            role:"system",
            content:`
            You are a helpful assistant.
            
            If the user is getting or askign a normal question, respond normally and set approvalRequired:false.

            If the request requires a sensitive external action, such as sending an email or deleting a file, set approvalRequired:true 

            Return JSON with:
            {
                "response": "your response",
                "approvalRequired": true or false
            }
            `
        },
        {
            role:"user",
            content:state.prompt
        }
    ])

    const parsed = JSON.parse(result.content)

    return {
        aiResponse: parsed.response,
        approvalRequired: parsed.approvalRequired,
    }
}
   
const approvalNode = async (state)=>{
    const answer = interrupt({
        message:"Do you approve this action",
        prompt:state.prompt,
        aiResponse:state.aiResponse
    })
    return {
        approved:String(answer).trim().toLowerCase()==="yes"
    }
}

const actionNode = async (state)=>{
    if(state.approved){
        return {
            result:`action approved ${state.aiResponse}`
        }
    }
    return {
        result:"action rejected by human."
    }
}

const shouldContinue = async (state)=>{
    if(state.approvalRequired){
        return "approval"
    }
    else{
        return "__end__"
    }   
}


const graph = new StateGraph(customState)
.addNode("agent",agent)
.addNode("approval",approvalNode)
.addNode("action",actionNode)
.addEdge("__start__","agent")
.addConditionalEdges("agent",shouldContinue)
.addEdge("approval","action")
.addEdge("action","__end__")
.compile({checkpointer})







app.listen(port,()=>{
    console.log("server started at", port)
})