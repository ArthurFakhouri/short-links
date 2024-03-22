import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { z } from 'zod'
import { sql } from "./lib/postgres";
import postgres from "postgres";
import { redis } from "./lib/redis";
import cors from '@fastify/cors'

const app = fastify()

app.register(cors)

app.get("/:code", async (req: FastifyRequest, reply: FastifyReply) => {
    const paramSchema = z.object({
        code: z.string().min(3)
    })
    const { code } = paramSchema.parse(req.params)

    const result = await sql`
        SELECT 
                id,
                original_url
        FROM short_links
        WHERE   1 = 1
        AND     short_links.code = ${code}
    `

    if (result.length === 0) return reply.status(404).send({ message: "Link not found!" })

    const link = result[0]

    await redis.zIncrBy('metrics', 1, link.id.toString())

    return reply.redirect(301, link.original_url)
})

app.get('/api/links', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = await sql`
        SELECT * FROM short_links sl
        ORDER BY created_at DESC
    `

    return result
})

app.post('/api/links', async (req: FastifyRequest, reply: FastifyReply) => {

    const bodySchema = z.object({
        code: z.string().min(3),
        url: z.string().url()
    })

    const { code, url } = bodySchema.parse(req.body)

    try {
        const result = await sql`
        INSERT INTO short_links (
            code,
            original_url
        ) VALUES (
            ${code},
            ${url}
        ) RETURNING id
    `

        const link = result[0]

        return reply.status(201).send({ shortLinkId: link.id })
    } catch (err) {
        if (err instanceof postgres.PostgresError) {
            if (err.code === '23505') {
                return reply.status(400).send({ message: "Duplicated code!" })
            }
        }

        console.error(err)

        return reply.status(500).send({ message: "Internal error." })
    }
})

app.get('/api/metrics', async () => {
    const result = await redis.zRangeByScoreWithScores('metrics', 0, 50)

    const metrics = result
        .sort((a, b) => b.score - a.score)
        .map(item => {
            return {
                shortLinkId: Number(item.value),
                clicks: item.score
            }
        })

    return metrics
})

app.listen({ port: 3333 }).then(() => {
    console.log("🚀 Running at http://localhost:3333 🔥☕")
})