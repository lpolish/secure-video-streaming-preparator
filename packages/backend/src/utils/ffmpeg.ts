import { spawn } from 'child_process'
import { Readable } from 'stream'

export async function processVideo(inputStream: Readable): Promise<Record<string, Readable>> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-filter_complex',
      '[0:v]split=3[v1][v2][v3]; [v1]scale=w=1920:h=1080[v1out]; [v2]scale=w=1280:h=720[v2out]; [v3]scale=w=854:h=480[v3out]',
      '-map', '[v1out]', '-c:v:0', 'libx264', '-b:v:0', '5000k', '-maxrate:v:0', '5350k', '-bufsize:v:0', '7500k',
      '-map', '[v2out]', '-c:v:1', 'libx264', '-b:v:1', '2800k', '-maxrate:v:1', '2996k', '-bufsize:v:1', '4200k',
      '-map', '[v3out]', '-c:v:2', 'libx264', '-b:v:2', '1400k', '-maxrate:v:2', '1498k', '-bufsize:v:2', '2100k',
      '-map', 'a:0', '-c:a', 'aac', '-b:a:0', '192k', '-ac', '2',
      '-map', 'a:0', '-c:a', 'aac', '-b:a:1', '128k', '-ac', '2',
      '-map', 'a:0', '-c:a', 'aac', '-b:a:2', '96k', '-ac', '2',
      '-f', 'hls',
      '-hls_time', '10',
      '-hls_playlist_type', 'vod',
      '-hls_flags', 'independent_segments',
      '-hls_segment_type', 'mpegts',
      '-hls_segment_filename', 'stream_%v/data%03d.ts',
      '-master_pl_name', 'master.m3u8',
      '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
      '-f', 'hls',
      'stream_%v/playlist.m3u8'
    ])

    inputStream.pipe(ffmpeg.stdin)

    const outputs: Record<string, Readable> = {
      '1080p': ffmpeg.stdout,
      '720p': new Readable(),
      '480p': new Readable(),
    }

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`)
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputs)
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`))
      }
    })
  })
}

