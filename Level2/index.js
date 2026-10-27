import express from "express"
import dotenv from "dotenv"
import { ChatGoogle } from "@langchain/google";
import { ChatGroq } from "@langchain/groq"
import { TavilySearch } from "@langchain/tavily";
import {createAgent, tool} from "langchain"
import z from "zod";

dotenv.config()

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

// ai agent = llm + tools

// built in tool -> using Tavily Search
const tool1 = new TavilySearch({
  maxResults: 5,
  topic: "general"
});

// custom tool
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



const model = new ChatGoogle("gemini-3.5-flash")

app.post("/chat",async (req,res)=>{
    const {prompt} = req.body;
    const agent = createAgent({
        model,
        tools:[tool1,tool2]
    })
    const result = await agent.invoke({
        messages:[
            {
                role:"user",
                content: prompt
            }
        ]
    })
    console.log(result.messages)
    return res.json(result.messages[result.messages.length-1].content)
})

app.listen(port,()=>{
    console.log("server started at", port)
})