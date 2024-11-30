export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || '',
  },
  dynamodb: {
    tableName: process.env.DYNAMODB_TABLE_NAME || '',
  },
}

