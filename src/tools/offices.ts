import { z } from "zod";
import { PochtaClient } from "../client.js";
import type { PochtaOffice } from "../types.js";

const client = new PochtaClient();

export const getOfficesSchema = z.object({
  postal_code: z.string().optional().describe("Почтовый индекс для поиска конкретного отделения"),
  settlement: z.string().optional().describe("Населённый пункт для поиска отделений"),
  region: z.string().optional().describe("Регион для фильтрации"),
  top: z.number().int().min(1).max(100).default(20).describe("Количество результатов"),
});

export async function handleGetOffices(params: z.infer<typeof getOfficesSchema>): Promise<string> {
  if (params.postal_code) {
    const result = (await client.get(`/postoffice/1.0/${params.postal_code}`)) as PochtaOffice;
    return JSON.stringify({
      индекс: result.postal_code,
      адрес: result.address ? [
        result.address.region,
        result.address.area,
        result.address.place,
        result.address.location,
      ].filter(Boolean).join(", ") : null,
      широта: result.latitude,
      долгота: result.longitude,
      график: result.work_time,
      телефоны: result.phones?.map(p => p.phone_number),
    }, null, 2);
  }

  const query: Record<string, string> = {};
  if (params.settlement) query.settlement = params.settlement;
  if (params.region) query.region = params.region;
  query.top = String(params.top);

  const result = (await client.get("/postoffice/1.0/nearby", query)) as PochtaOffice[];

  if (!Array.isArray(result) || result.length === 0) {
    return "Отделения не найдены по заданным параметрам.";
  }

  return JSON.stringify(result.map(o => ({
    индекс: o.postal_code,
    адрес: o.address ? [
      o.address.region,
      o.address.area,
      o.address.place,
      o.address.location,
    ].filter(Boolean).join(", ") : null,
    широта: o.latitude,
    долгота: o.longitude,
    график: o.work_time,
  })), null, 2);
}
