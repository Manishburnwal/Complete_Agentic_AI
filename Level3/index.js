import express from "express"
import dotenv from "dotenv"
import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq"
import { TavilySearch } from "@langchain/tavily";
import {tool} from "langchain"
import {ToolNode} from "@langchain/langgraph/prebuilt"
import z from "zod";
import { MessagesAnnotation, StateGraph, MemorySaver, StateSchema } from "@langchain/langgraph";
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

}

const approvalNode = async (state)=>{

}

const actionNode = async (state)=>{
    
}





app.listen(port,()=>{
    console.log("server started at", port)
})