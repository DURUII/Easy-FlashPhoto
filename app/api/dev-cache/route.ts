import { NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), 'public', 'dev-cache.json')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await writeFile(CACHE_FILE, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  try {
    const content = await readFile(CACHE_FILE, 'utf-8')
    return NextResponse.json(JSON.parse(content))
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
}
