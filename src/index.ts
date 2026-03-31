#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { trackSchema, handleTrack } from "./tools/tracking.js";
import { calculateSchema, handleCalculate } from "./tools/calculate.js";
import { getOfficesSchema, handleGetOffices } from "./tools/offices.js";
import { zipLookupSchema, handleZipLookup } from "./tools/zip_lookup.js";
import { deliveryTimeSchema, handleDeliveryTime } from "./tools/delivery_time.js";
import { normalizeAddressSchema, handleNormalizeAddress } from "./tools/normalize_address.js";

const VERSION = "1.1.0";

function createServer(): McpServer {
  const server = new McpServer({ name: "pochta-russia-mcp", version: VERSION });

  server.tool("track", "Отслеживание почтового отправления Почты России по трек-номеру.", trackSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleTrack(params) }] }));

  server.tool("calculate", "Расчёт стоимости и сроков доставки Почтой России.", calculateSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleCalculate(params) }] }));

  server.tool("get_offices", "Поиск почтовых отделений по индексу или населённому пункту.", getOfficesSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleGetOffices(params) }] }));

  server.tool("zip_lookup", "Информация по почтовому индексу: регион, город, график работы.", zipLookupSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleZipLookup(params) }] }));

  server.tool("delivery_time", "Расчёт сроков доставки между двумя индексами.", deliveryTimeSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleDeliveryTime(params) }] }));

  server.tool("normalize_address", "Нормализация адреса через API Почты России.", normalizeAddressSchema.shape,
    async (params) => ({ content: [{ type: "text", text: await handleNormalizeAddress(params) }] }));

  return server;
}

export { createServer };

async function main() {
  const args = process.argv.slice(2);
  const httpMode = args.includes("--http");
  const portArg = args.find(a => a.startsWith("--port="));
  const port = portArg ? parseInt(portArg.split("=")[1], 10) : 3000;

  const server = createServer();

  if (httpMode) {
    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    const http = await import("node:http");

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
    await server.connect(transport);

    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      if (url.pathname === "/mcp") {
        await transport.handleRequest(req, res);
      } else if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", version: VERSION, tools: 6 }));
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    httpServer.listen(port, () => {
      console.error(`[pochta-russia-mcp] HTTP-сервер на порту ${port}. 6 инструментов.`);
      console.error(`[pochta-russia-mcp] MCP endpoint: http://localhost:${port}/mcp`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[pochta-russia-mcp] Сервер запущен (stdio). 6 инструментов. v${VERSION}`);
  }
}

main().catch((error) => { console.error("[pochta-russia-mcp] Ошибка:", error); process.exit(1); });
