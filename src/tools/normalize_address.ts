import { z } from "zod";
import { PochtaClient } from "../client.js";

export const normalizeAddressSchema = z.object({
  raw_address: z.string().describe("Адрес в свободной форме для нормализации"),
});

let _client: PochtaClient;
function client() { return _client ??= new PochtaClient(); }

export async function handleNormalizeAddress(params: z.infer<typeof normalizeAddressSchema>): Promise<string> {
  const result = (await client().post("/clean/address", [
    { id: "1", "original-address": params.raw_address },
  ])) as Array<Record<string, unknown>>;

  if (!Array.isArray(result) || result.length === 0) {
    return JSON.stringify({ ошибка: "Не удалось нормализовать адрес." });
  }

  const addr = result[0];
  return JSON.stringify({
    индекс: addr.index ?? null,
    регион: addr.region ?? null,
    район: addr.area ?? null,
    город: addr.place ?? null,
    улица: addr.street ?? null,
    дом: addr.house ?? null,
    корпус: addr.corpus ?? null,
    квартира: addr.room ?? null,
    качество: addr["quality-code"] ?? null,
    код_проверки: addr["validation-code"] ?? null,
    оригинал: addr["original-address"] ?? params.raw_address,
  }, null, 2);
}
