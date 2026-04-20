'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

type Status = { connected: boolean; qr: string | null; message?: string }

export default function QrScanPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/qr')
      if (!res.ok) throw new Error()
      const data: Status = await res.json()
      setStatus(data)
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Conectar WhatsApp</h1>

      {status === null && (
        <p className="text-muted-foreground">Conectando ao serviço WhatsApp...</p>
      )}

      {status?.connected && (
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-green-100 px-4 py-2 text-green-700 font-medium">
            ✅ WhatsApp conectado
          </div>
          <p className="text-sm text-muted-foreground">
            O número está ativo e enviando mensagens.
          </p>
        </div>
      )}

      {status && !status.connected && status.qr && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Escaneie com o WhatsApp do número que vai enviar os relatórios:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={status.qr} alt="QR Code WhatsApp" className="h-64 w-64 rounded-lg border" />
          <p className="text-xs text-muted-foreground">
            Atualizando automaticamente a cada 5 segundos...
          </p>
        </div>
      )}

      {status && !status.connected && !status.qr && (
        <p className="text-muted-foreground">
          {status.message ?? 'Aguardando QR code...'}
        </p>
      )}

      <Button
        variant="outline"
        onClick={() => { setLoading(true); fetchStatus().finally(() => setLoading(false)) }}
        disabled={loading}
      >
        {loading ? 'Atualizando...' : 'Atualizar'}
      </Button>
    </div>
  )
}
