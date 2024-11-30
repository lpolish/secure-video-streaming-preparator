import { APIGatewayProxyHandler } from 'aws-lambda'
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
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
        body: JSON.stringify({ error: 'Video not ready for publishing' }),
      }
    }

    const qualities = ['1080p', '720p', '480p']

    for (const quality of qualities) {
      await s3Client.send(new CopyObjectCommand({
        Bucket: config.s3.bucketName,
        CopySource: `${config.s3.bucketName}/${videoId}/processed/${quality}/playlist.m3u8`,
        Key: `published/${videoId}/${quality}/playlist.m3u8`,
      }))
    }

    await docClient.send(new UpdateCommand({
      TableName: config.dynamodb.tableName,
      Key: { id: videoId },
      UpdateExpression: 'SET #status = :status, publishedAt = :publishedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'published',
        ':publishedAt': new Date().toISOString(),
      },
    }))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Video published successfully' }),
    }
  } catch (error) {
    console.error('Publish error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to publish video' }),
    }
  }
}

