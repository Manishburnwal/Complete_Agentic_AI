import express from "express"
import dotenv from "dotenv"
import { ChatGroq } from "@langchain/groq"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { TaskType } from "@google/generative-ai"
import { QdrantVectorStore } from "@langchain/qdrant"
import fs from "fs"
import { PDFParse } from "pdf-parse"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

dotenv.config()

const app = express()

const port = process.env.PORT || 5000

app.use(express.json())

const model = new ChatGroq({
    model:"openai/gpt-oss-120b"
})
// vector embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001"
})
// vectorDB
const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings,{
    url:process.env.QDRANT_URL,
    collectionName:"nodejsDocumentation",
    apiKey:process.env.QDRANT_API_KEY
})

// uploading chunks to vectorDB
const upload = async()=>{
    const path = "./knowledge.pdf"
    const buffer = fs.readFileSync(path)

    const pdfResult = new PDFParse({data:buffer})
    const result = await pdfResult.getText()

    const text = result.text
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
    const docs = await splitter.createDocuments([text])
    
    await vectorStore.addDocuments(docs)
}

// prompt -> Vector Embedding -> Vector DB -> similarity search -> Relevant Data -> context + prompt -> LLM -> Response

app.post("/chat",async(req,res)=>{
    const {prompt} = req.body;
    const docs = await vectorStore.similaritySearch(prompt,5)
    const context = docs.map(doc=>doc.pageContent).join("\n");
    const result = await model.invoke([
        {
            role:"system",
            content:`you are a rag assistant and use this context ${context}`
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