import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const server = new McpServer({
    title:"calculator",
    version:"1.0.0"
})

const transport = new StdioServerTransport()
server.connect(transport)