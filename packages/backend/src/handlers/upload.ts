import { APIGatewayProxyHandler } from 'aws-lambda'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from 'uuid'
import { parse } from 'lambda-multipart-parser'
import { s3Client } from '../utils/s3'
import { config } from '../config'

const dynamoClient = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { files } = await parse(event)
    const file = files[0]

    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file uploaded' }),
      }
    }

    const videoId = uuidv4()
    const key = `${videoId}/${file.filename}`

    await s3Client.send(new PutObjectCommand({
      Bucket: config.s3.bucketName,
      Key: key,
      Body: file.content,
      ContentType: file.contentType,
    }))

    await docClient.send(new PutCommand({
      TableName: config.dynamodb.tableName,
      Item: {
        id: videoId,
        status: 'uploaded',
        originalKey: key,
        createdAt: new Date().toISOString(),
      },
    }))

    return {
      statusCode: 200,
      body: JSON.stringify({ videoId, message: 'Video upload successful, processing started' }),
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Upload failed' }),
    }
  }
}

