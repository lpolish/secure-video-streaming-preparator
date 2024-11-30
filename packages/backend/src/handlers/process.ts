import { S3Event, S3Handler } from 'aws-lambda'
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { Readable } from 'stream'
import { processVideo } from '../utils/ffmpeg'
import { s3Client } from '../utils/s3'
import { config } from '../config'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
    const videoId = key.split('/')[0]

    try {
      const { Body } = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }))

      if (!(Body instanceof Readable)) {
        throw new Error('Invalid S3 object body')
      }

      const outputStreams = await processVideo(Body)

      for (const [quality, stream] of Object.entries(outputStreams)) {
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: `${videoId}/processed/${quality}/playlist.m3u8`,
          Body: stream,
          ContentType: 'application/vnd.apple.mpegurl',
        }))
      }

      await docClient.send(new UpdateCommand({
        TableName: config.dynamodb.tableName,
        Key: { id: videoId },
        UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'processed',
          ':processedAt': new Date().toISOString(),
        },
      }))
    } catch (error) {
      console.error('Processing error:', error)
      await docClient.send(new UpdateCommand({
        TableName: config.dynamodb.tableName,
        Key: { id: videoId },
        UpdateExpression: 'SET #status = :status, error = :error',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'error',
          ':error': (error as Error).message,
        },
      }))
    }
  }
}

