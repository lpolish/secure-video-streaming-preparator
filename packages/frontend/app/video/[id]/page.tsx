'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VideoPage() {
  const { id } = useParams()
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideoInfo = async () => {
      try {
        const response = await fetch(`/api/video/${id}`)
        const data = await response.json()
        setVideoInfo(data)
      } catch (error) {
        console.error('Error fetching video info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVideoInfo()
    const interval = setInterval(fetchVideoInfo, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [id])

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/video/${id}/download`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `video_${id}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/video/${id}/publish`, { method: 'POST' })
      const data = await response.json()
      setVideoInfo(data)
    } catch (error) {
      console.error('Publish error:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Video Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Status: {videoInfo.status}</p>
            {videoInfo.status === 'ready' && (
              <div className="space-x-4">
                <Button onClick={handleDownload}>Download</Button>
                <Button onClick={handlePublish}>Publish</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

