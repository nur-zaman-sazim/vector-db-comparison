#!/bin/bash
awslocal s3 mb s3://project-dev-bucket

awslocal s3api put-bucket-cors --bucket project-dev-bucket --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
      "AllowedHeaders": ["*"]
    }
  ]
}'
