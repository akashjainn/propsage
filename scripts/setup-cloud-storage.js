#!/usr/bin/env node
/**
 * Cloud Storage Setup Script for PropSage
 * Helps set up AWS S3 or Cloudflare R2 for video storage
 * 
 * Usage: node scripts/setup-cloud-storage.js [--provider aws|r2] [--test]
 */

const { config } = require('dotenv');
const { S3Client, CreateBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Load environment
config();

const providers = {
  aws: {
    name: 'Amazon S3',
    requiredVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    optionalVars: ['VIDEO_BUCKET_NAME'],
    endpoint: undefined
  },
  r2: {
    name: 'Cloudflare R2',
    requiredVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'R2_ENDPOINT'],
    optionalVars: ['VIDEO_BUCKET_NAME', 'R2_PUBLIC_DOMAIN'],
    endpoint: process.env.R2_ENDPOINT
  }
};

async function detectProvider() {
  if (process.env.R2_ENDPOINT) {
    return 'r2';
  } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return 'aws';
  }
  return null;
}

async function checkConfiguration(provider) {
  console.log(`🔧 Checking ${providers[provider].name} configuration...\n`);
  
  const missing = [];
  const present = [];
  
  // Check required variables
  for (const varName of providers[provider].requiredVars) {
    if (process.env[varName]) {
      present.push(`✅ ${varName}: Set`);
    } else {
      missing.push(`❌ ${varName}: Missing`);
    }
  }
  
  // Check optional variables
  for (const varName of providers[provider].optionalVars) {
    if (process.env[varName]) {
      present.push(`✅ ${varName}: ${process.env[varName]}`);
    } else {
      present.push(`⚠️  ${varName}: Not set (using default)`);
    }
  }
  
  present.forEach(msg => console.log(msg));
  missing.forEach(msg => console.log(msg));
  
  if (missing.length > 0) {
    console.log(`\n❌ Configuration incomplete. Missing ${missing.length} required variables.`);
    console.log('\n📝 Add these to your .env file:');
    
    if (provider === 'aws') {
      console.log(`
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
VIDEO_BUCKET_NAME=propsage-clips
`);
    } else if (provider === 'r2') {
      console.log(`
# Cloudflare R2 Configuration
AWS_ACCESS_KEY_ID=your-r2-access-key-id
AWS_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
VIDEO_BUCKET_NAME=propsage-clips
R2_PUBLIC_DOMAIN=propsage-clips.your-account.r2.dev
`);
    }
    
    return false;
  }
  
  console.log('\n✅ Configuration looks good!');
  return true;
}

async function createS3Client(provider) {
  const config = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  };
  
  if (provider === 'r2') {
    config.endpoint = process.env.R2_ENDPOINT;
    config.forcePathStyle = true;
  }
  
  return new S3Client(config);
}

async function testConnection(provider) {
  console.log(`🔌 Testing connection to ${providers[provider].name}...\n`);
  
  try {
    const s3Client = await createS3Client(provider);
    const bucketName = process.env.VIDEO_BUCKET_NAME || 'propsage-clips';
    
    // Try to check if bucket exists
    const headCommand = new HeadBucketCommand({ Bucket: bucketName });
    
    try {
      await s3Client.send(headCommand);
      console.log(`✅ Successfully connected to ${providers[provider].name}`);
      console.log(`✅ Bucket '${bucketName}' exists and is accessible`);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(`✅ Connection successful, but bucket '${bucketName}' doesn't exist`);
        console.log(`💡 Run with --create-bucket to create it`);
        return true;
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error(`❌ Connection failed:`, error.message);
    
    if (provider === 'r2') {
      console.log('\n💡 For Cloudflare R2:');
      console.log('   1. Go to Cloudflare Dashboard → R2 Object Storage');
      console.log('   2. Create R2 API Token with "Object Read & Write" permissions');
      console.log('   3. Note your Account ID for the endpoint URL');
      console.log('   4. Use the API Token as AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    } else {
      console.log('\n💡 For AWS S3:');
      console.log('   1. Go to AWS IAM → Create User');
      console.log('   2. Attach policy: AmazonS3FullAccess (or custom S3 policy)');
      console.log('   3. Create Access Key for programmatic access');
      console.log('   4. Use Access Key ID and Secret Access Key in .env');
    }
    
    return false;
  }
}

async function createBucket(provider) {
  console.log(`🪣 Creating bucket for ${providers[provider].name}...\n`);
  
  try {
    const s3Client = await createS3Client(provider);
    const bucketName = process.env.VIDEO_BUCKET_NAME || 'propsage-clips';
    
    // Create bucket
    const createCommand = new CreateBucketCommand({
      Bucket: bucketName,
      ...(provider === 'aws' && process.env.AWS_REGION !== 'us-east-1' && {
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION
        }
      })
    });
    
    await s3Client.send(createCommand);
    console.log(`✅ Created bucket: ${bucketName}`);
    
    // Set up CORS for TwelveLabs access
    const corsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    });
    
    await s3Client.send(corsCommand);
    console.log(`✅ Configured CORS for public access`);
    
    // Set up bucket policy for public read access (needed for TwelveLabs)
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };
    
    const policyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    });
    
    await s3Client.send(policyCommand);
    console.log(`✅ Configured public read access policy`);
    
    if (provider === 'r2') {
      console.log(`\n💡 Next steps for Cloudflare R2:`);
      console.log(`   1. Go to R2 → Manage → Settings → Public Access`);
      console.log(`   2. Enable public access and note the public domain`);
      console.log(`   3. Add R2_PUBLIC_DOMAIN to your .env file:`);
      console.log(`      R2_PUBLIC_DOMAIN=${bucketName}.your-account.r2.dev`);
    } else {
      console.log(`\n✅ AWS S3 bucket ready for use!`);
      console.log(`   Public URL format: https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`);
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to create bucket:`, error.message);
    return false;
  }
}

async function testUpload(provider) {
  console.log(`📤 Testing file upload to ${providers[provider].name}...\n`);
  
  try {
    // Import the video storage service
    const { videoStorage } = require('../dist/services/video-storage.js');
    
    // Create a small test file
    const testContent = 'This is a test file for PropSage cloud storage setup.';
    const testFilePath = path.join(process.cwd(), 'test-upload.txt');
    
    fs.writeFileSync(testFilePath, testContent);
    
    const testMetadata = {
      gameId: 'test-game-setup',
      team1: 'TEST',
      team2: 'SETUP',
      date: '2025-10-06',
      originalFilename: 'test-upload.txt'
    };
    
    console.log('📁 Creating test file...');
    const result = await videoStorage.uploadVideo(testFilePath, testMetadata);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    console.log(`✅ Test upload successful!`);
    console.log(`   URL: ${result.s3Url}`);
    console.log(`   Key: ${result.key}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Test upload failed:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const providerArg = args.find(arg => arg.startsWith('--provider='))?.split('=')[1];
  const shouldTest = args.includes('--test');
  const shouldCreateBucket = args.includes('--create-bucket');
  
  console.log('☁️  PropSage Cloud Storage Setup\n');
  
  // Detect or use specified provider
  let provider = providerArg || await detectProvider();
  
  if (!provider) {
    console.log('🤔 No cloud storage provider detected in environment.');
    console.log('\nAvailable providers:');
    console.log('   aws : Amazon S3');
    console.log('   r2  : Cloudflare R2 (recommended for lower costs)');
    console.log('\nSpecify with: --provider=aws or --provider=r2');
    process.exit(1);
  }
  
  if (!providers[provider]) {
    console.log(`❌ Unknown provider: ${provider}`);
    console.log('Available: aws, r2');
    process.exit(1);
  }
  
  console.log(`🎯 Using provider: ${providers[provider].name}\n`);
  
  // Check configuration
  const configOk = await checkConfiguration(provider);
  if (!configOk) {
    process.exit(1);
  }
  
  // Test connection
  const connectionOk = await testConnection(provider);
  if (!connectionOk) {
    process.exit(1);
  }
  
  // Create bucket if requested
  if (shouldCreateBucket) {
    const bucketOk = await createBucket(provider);
    if (!bucketOk) {
      process.exit(1);
    }
  }
  
  // Test upload if requested
  if (shouldTest) {
    const uploadOk = await testUpload(provider);
    if (!uploadOk) {
      process.exit(1);
    }
  }
  
  console.log('\n🎉 Cloud storage setup complete!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Upload videos: pnpm tl:index --upload-only');
  console.log('   2. Index with TwelveLabs: pnpm tl:index --index-only');
  console.log('   3. Test search: pnpm tl:search="touchdown"');
  
  console.log('\n💡 Available commands:');
  console.log('   --provider=aws|r2     : Specify cloud provider');
  console.log('   --test                : Test file upload');
  console.log('   --create-bucket       : Create storage bucket');
}

if (require.main === module) {
  main().catch(console.error);
}