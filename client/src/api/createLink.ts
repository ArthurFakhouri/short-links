import { api } from "@/lib/axios";
import { AxiosError } from "axios";

export type ShortLink = {
    code: string
    url: string
}

export async function createLink(
    { code, url }: ShortLink
) {
    try {
        await api.post('/api/links', {
            code,
            url
        })
    } catch(err) {
        if(err instanceof AxiosError)
            throw new Error(err.message)
    }
}