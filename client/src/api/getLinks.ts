import { AxiosError } from "axios";
import { api } from "../lib/axios";
import { toast } from "sonner";

export type Link = {
    id: number,
    code: string,
    original_url: string,
    created_at: string
}

export async function getLinks() {
    
    try {
        const response = await api.get<Link[]>('/api/links')

        const links = response.data
        
        return links
    }
    catch(err) {
        if(err instanceof AxiosError) {
            toast.error("There was a problem when fetching links")
        }
    }

    return [] as Link[]
}