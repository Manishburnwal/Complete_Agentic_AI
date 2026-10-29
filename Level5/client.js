import express from "express"
import dotenv from "dotenv"
dotenv.config()
import { ChatGroq } from "@langchain/groq"

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

app.post("/chat", async (req,res)=>{
    const {prompt} = req.body
    const ai = new ChatGroq({
        model:"openai/gpt-oss-120b"
    })

    const result = await ai.invoke([
        {
            role:"system",
            content:"you are jarvis and my assistant"
        },
        {
            role:"human",
            content:prompt
        }
    ])
    return res.json(result.content)
})



app.listen(port,()=>{
    console.log("server started at", port)
})