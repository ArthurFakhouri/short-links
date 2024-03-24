import { useMutation, useQueries } from "@tanstack/react-query"
import { getLinks } from "../api/getLinks"
import { formatDistanceToNow, subHours } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { getMetrics } from "@/api/getMetrics"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { createLink } from "@/api/createLink"

const shortLinkSchema = z.object({
    code: z.string().min(3, "Informe pelo menos 3 caracteres!"),
    url: z.string().url("Informe um link válido!"),
})

type ShortLink = z.infer<typeof shortLinkSchema>

export function Home() {

    const [
        { data: links, isLoading: isLoadingLinks, refetch: refetchLinks },
        { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics }
    ] = useQueries({
        queries: [
            {
                queryKey: ['links'],
                queryFn: getLinks
            },
            {
                queryKey: ['metrics'],
                queryFn: getMetrics
            }
        ]
    })

    const { mutateAsync: asyncCreateLink } = useMutation({
        mutationFn: createLink,
        onSuccess: () => {
            refetchLinks()
        }
    })

    const { register, handleSubmit, formState: {errors}, reset } = useForm<ShortLink>({
        resolver: zodResolver(shortLinkSchema),
        defaultValues: {
            code: '',
            url: ''
        }
    })

    function handleCreateLink(data: ShortLink) {
        asyncCreateLink({
            code: data.code,
            url: data.url
        })

        reset()
    }

    const metricLinks = useMemo(( ) => {
        if(links && metrics) {
            return links.map(link => {
                const index = metrics.findIndex(metric => metric.shortLinkId === link.id) 
                if(index !== -1) {
                    return {
                        ...link,
                        ...metrics[index]
                    }
                } else {
                    return {
                        ...link,
                        shortLinkId: undefined,
                        clicks: 0
                    }
                }
            })
        }

        return []
    }, [links, metrics])

    function handleClickToUrl() {
        const timeout = setTimeout(() => {
            refetchMetrics()
        }, 2000);

        return () => clearTimeout(timeout)
    }
    
    return (
        <div className="h-screen flex justify-evenly items-center flex-wrap">
            <main>
                <form 
                    onSubmit={handleSubmit(handleCreateLink)}
                    className="flex flex-col gap-4 m-4 md:w-[400px] bg-zinc-800 p-5 rounded-lg"
                >
                    <h1 className="text-3xl font-bold">
                        Crie seu "short" link agora!
                    </h1>
                    <input 
                        autoFocus
                        className="border-0 border-b-2 bg-transparent border-purple-500 p-1 outline-0"
                        type="text" 
                        placeholder="Digite o código"
                        {...register('code')}
                       />
                    {errors.code && <span className="text-red-500 text-sm">{errors.code.message}</span>}
                    <input 
                        className="border-0 border-b-2 bg-transparent border-purple-500 p-1 outline-0" 
                        type="text" 
                        placeholder="Digite o link"
                        {...register('url')}
                    />
                    {errors.url && <span className="text-red-500 text-sm">{errors.url.message}</span>}
                    <button 
                        className="mt-2 bg-emerald-500 px-5 border-0 py-2 rounded-md w-fit self-center transition outline-0 hover:cursor-pointer hover:brightness-75"
                        type="submit"
                    >
                            Enviar
                    </button>
                </form>
            </main>
            <aside className="flex flex-col p-8 justify-center items-center gap-4 h-full">
                <h2 className="text-2xl font-bold">Links criados</h2>
                <ul className="bg-zinc-800 h-full md:w-[600px] flex flex-1 gap-2 flex-col rounded-lg p-4">
                    {(isLoadingLinks || isLoadingMetrics) && Array.from({length: 10}).map((_, index) => {
                        return (
                            <li key={index} className="flex justify-between flex-wrap gap-4">
                                <div className="flex flex-col justify-start items-start gap-3">
                                    <Skeleton className={`h-6 w-[400px] bg-zinc-600`} />
                                    <Skeleton className="h-6 w-[90px] bg-zinc-600" />
                                </div>
                                <div className="w-[100px] text-right">
                                    <Skeleton className="h-10 w-[100px] bg-zinc-600" />
                                </div>
                            </li>
                        )
                    })} 
                    {metricLinks && metricLinks.map((link) => {
                    return (
                        <li key={link.id} className="flex justify-between flex-wrap gap-2">
                            <div className="flex flex-col justify-start items-start gap-2">
                                <a
                                 href={`http://localhost:3333/${link.code}`} 
                                 onClick={handleClickToUrl}
                                 className="hover:underline hover:text-purple-500 transition font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                 >
                                    {link.code}
                                </a>
                                <span className="text-zinc-200 text-md">Acessos: {link.clicks}</span>
                            </div>
                            <div className="w-[100px] text-right">
                                <span className="text-zinc-400 text-sm">{formatDistanceToNow(subHours(link.created_at, 3), {locale: ptBR, addSuffix: true})}</span>
                            </div>
                        </li>
                    )
                    })}
                </ul>
            </aside>
    </div>
    )
}