import express from "express"
import dotenv from "dotenv"
import { ChatGroq } from "@langchain/groq"
import z from "zod";

dotenv.config()

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

const model = new ChatGroq({
    model:"openai/gpt-oss-120b"
})


app.listen(port,()=>{
    console.log("server started at", port)
})