import { api } from "@/lib/axios"
import { AxiosError } from "axios"
import { toast } from "sonner"

export type Metric = {
    shortLinkId: number,
    clicks: number
}

export async function getMetrics() {
    try {
        const responseMetrics = await api.get<Metric[]>("/api/metrics")
    
        const metrics = responseMetrics.data

        return metrics
    } catch(err) {
        if(err instanceof AxiosError) {
            toast.error("There was a problem fetching metrics")
        }

        return [] as Metric[]
    }
}