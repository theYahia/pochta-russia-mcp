#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { trackSchema, handleTrack } from "./tools/tracking.js";
import { calculateSchema, handleCalculate } from "./tools/calculate.js";
import { getOfficesSchema, handleGetOffices } from "./tools/offices.js";

const server = new McpServer({ name: "pochta-russia-mcp", version: "1.0.1" });

server.tool("track", "Отслеживание почтового отправления Почты России по трек-номеру.", trackSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleTrack(params) }] }));

server.tool("calculate", "Расчёт стоимости и сроков доставки Почтой России.", calculateSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCalculate(params) }] }));

server.tool("get_offices", "Поиск почтовых отделений по индексу или населённому пункту.", getOfficesSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetOffices(params) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[pochta-russia-mcp] Сервер запущен. 3 инструмента.");
}

main().catch((error) => { console.error("[pochta-russia-mcp] Ошибка:", error); process.exit(1); });
