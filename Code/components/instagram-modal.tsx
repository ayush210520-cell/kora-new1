"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react"
import Image from "next/image"

interface InstagramPost {
  id: string
  username: string
  userAvatar: string
  image: string
  video?: string
  caption: string
  likes: number
  comments: number
  date: string
  isVideo: boolean
}

interface InstagramModalProps {
  post: InstagramPost | null
  isOpen: boolean
  onClose: () => void
}

export default function InstagramModal({ post, isOpen, onClose }: InstagramModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  // Proxy function to handle Instagram CDN images
  const getProxiedImageUrl = (originalUrl: string) => {
    // If it's an Instagram CDN URL, use our proxy
    if (originalUrl.includes('scontent-') && originalUrl.includes('cdninstagram.com')) {
      const encodedUrl = encodeURIComponent(originalUrl)
      return `https://server.korakagazindia.com/api/proxy/instagram/${encodedUrl}`
    }
    // For other images, return as is
    return originalUrl
  }

  if (!post) return null

  const togglePlay = () => {
    const video = document.getElementById("modal-video") as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    const video = document.getElementById("modal-video") as HTMLVideoElement
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full h-[80vh] p-0 bg-black">
        <div className="w-full h-full bg-black flex items-center justify-center relative">
          {post.isVideo && post.video ? (
            <div className="relative w-full h-full">
              <video
                id="modal-video"
                src={post.video}
                className="w-full h-full object-contain"
                muted={isMuted}
                loop
                autoPlay
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={togglePlay}
                  className="bg-black/50 hover:bg-black/70 text-white border-none"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleMute}
                  className="bg-black/50 hover:bg-black/70 text-white border-none"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <Image 
              src={getProxiedImageUrl(post.image || "/placeholder.svg")} 
              alt="Instagram post" 
              fill 
              className="object-cover" 
              style={{ objectPosition: 'center top' }}
            />
          )}
        </div>

        {/* Close button */}
        <Button
          onClick={onClose}
          size="sm"
          variant="ghost"
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
        >
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
