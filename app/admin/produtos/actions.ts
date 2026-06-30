"use server"

import { updateTag } from "next/cache"

export async function revalidateCatalog() {
  updateTag("catalog")
}
