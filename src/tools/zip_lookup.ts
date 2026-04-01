import { z } from "zod";
import { PochtaClient } from "../client.js";

export const zipLookupSchema = z.object({
  postal_code: z.string().regex(/^\d{6}$/).describe("Почтовый индекс (6 цифр)"),
});

let _client: PochtaClient;
function client() { return _client ??= new PochtaClient(); }

export async function handleZipLookup(params: z.infer<typeof zipLookupSchema>): Promise<string> {
  const result = (await client().get(`/postoffice/1.0/${params.postal_code}`)) as Record<string, unknown>;

  return JSON.stringify({
    индекс: result.postal_code ?? params.postal_code,
    регион: (result.address as any)?.region ?? null,
    район: (result.address as any)?.area ?? null,
    населённый_пункт: (result.address as any)?.place ?? null,
    адрес: (result.address as any)?.location ?? null,
    тип_отделения: result.type_code ?? null,
    график: result.work_time ?? null,
  }, null, 2);
}
