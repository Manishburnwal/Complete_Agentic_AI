import express from "express"
import dotenv from "dotenv"
import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq"
import { TavilySearch } from "@langchain/tavily";
import {tool} from "langchain"
import {ToolNode} from "@langchain/langgraph/prebuilt"
import z from "zod";
import { MessagesAnnotation, StateGraph, MemorySaver } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";

dotenv.config()

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

const client = new MongoClient("mongodb+srv://manishkumar1abc2_db_user:I8BVrudVNyjZY5rH@cluster0.w6x3ni5.mongodb.net/")

const checkpointer = new MongoDBSaver({client})

   

// ai agent = llm + tools

// built in tool -> using Tavily Search
// const tool1 = new TavilySearch({
//   maxResults: 5,
//   topic: "general"
// });

// custom tool

const tool1 = tool(
    ({email,content})=>{
        return `email sent successfully to ${email} with content ${content}`
    },
    {
        name:"email_send_tool",
        description:"use this tool to send email",
        schema:z.object({
            email:z.string().describe("sender email"),
            content:z.string().describe("mail content for sending")
        })
    }
)


const tool2 = tool(
    ({a,b})=>{
        const result = `addition of ${a} and ${b} is 7`;
        return result;
    },{
        name:"addition_tool",
        description:"use this tool for addition for two numbers",
        schema:z.object({
            a:z.number(),
            b:z.number()
        })
    }
)

// using langchain

// const model = new ChatGoogle("gemini-3.5-flash")

// app.post("/chat",async (req,res)=>{
//     const {prompt} = req.body;
//     const agent = createAgent({
//         model,
//         tools:[tool1,tool2]
//     })
//     const result = await agent.invoke({
//         messages:[
//             {
//                 role:"user",
//                 content: prompt
//             }
//         ]
//     })
//     console.log(result.messages)
//     return res.json(result.messages[result.messages.length-1].content)
// })


// Using langgraph
const tools = [tool1,tool2]

const model = new ChatGroq("openai/gpt-oss-120b").bindTools(tools)

const toolNode = new ToolNode(tools)

const agent = async(state)=>{
    const result = await model.invoke(state.messages)
    return {
        messages:[result]
    }
}

const shouldContinue = async (state)=>{
    console.log(state)
    if(state.messages[state.messages.length-1]?.tool_calls?.length>0){
        return "tool_node"
    }
    else{
        return "__end__"
    }
}


// state=[
//     HumanMessage:"",
//     AIMessage:"",
//     ToolMessage:"",
//     AIMessage:""
// ]

const graph = new StateGraph(MessagesAnnotation)
.addNode("agent",agent)
.addNode("tool_node",toolNode)
.addEdge("__start__","agent")
.addConditionalEdges("agent",shouldContinue)
.addEdge("tool_node","agent")
.compile({checkpointer})



app.post("/chat", async (req,res)=>{
    const {prompt} = req.body  
    const result = await graph.invoke({
        messages:[
            {
                role:"user",
                content:prompt
            }
        ]
    },{
        configurable:{thread_id:"user-123"}
    }) 
    console.log(result.messages)
    return res.json(result.messages[result.messages.length-1]?.content)
})

app.listen(port,()=>{
    console.log("server started at", port)
})