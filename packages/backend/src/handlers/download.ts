import { APIGatewayProxyHandler } from 'aws-lambda'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"
import archiver from 'archiver'
import { Readable } from 'stream'
import { s3Client } from '../utils/s3'
import { config } from '../config'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandler = async (event) => {
  const videoId = event.pathParameters?.id

  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Video ID is required' }),
    }
  }

  try {
    const { Item: videoInfo } = await docClient.send(new GetCommand({
      TableName: config.dynamodb.tableName,
      Key: { id: videoId },
    }))

    if (!videoInfo || videoInfo.status !== 'processed') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Video not ready for download' }),
      }
    }

    const archive = archiver('zip', { zlib: { level: 9 } })
    const qualities = ['1080p', '720p', '480p']

    for (const quality of qualities) {
      const { Body } = await s3Client.send(new GetObjectCommand({
        Bucket: config.s3.bucketName,
        Key: `${videoId}/processed/${quality}/playlist.m3u8`,
      }))

      if (!(Body instanceof Readable)) {
        throw new Error('Invalid S3 object body')
      }

      archive.append(Body, { name: `${quality}/playlist.m3u8` })
    }

    archive.finalize()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="video_${videoId}.zip"`,
      },
      body: await streamToBuffer(archive),
      isBase64Encoded: true,
    }
  } catch (error) {
    console.error('Download error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to download video' }),
    }
  }
}

async function streamToBuffer(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
  })
}

