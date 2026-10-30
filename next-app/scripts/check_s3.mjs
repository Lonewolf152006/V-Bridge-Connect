import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env') });
dotenv.config({ path: path.join(ROOT_DIR, '.env.local') });

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'v-bridgecertificate';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

console.log('=====================================================');
console.log('   V-Bridge Connect: AWS S3 Connection Diagnostic   ');
console.log('=====================================================');
console.log(`Region:           ${region}`);
console.log(`Bucket Name:      ${bucketName}`);
console.log(`Access Key ID:    ${accessKeyId ? accessKeyId.substring(0, 8) + '...' + accessKeyId.slice(-4) : 'MISSING'}`);
console.log(`Secret Access:    ${secretAccessKey ? 'CONFIGURED (' + secretAccessKey.length + ' chars)' : 'MISSING'}`);
console.log('-----------------------------------------------------');

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ ERROR: AWS credentials missing in .env / .env.local');
  process.exit(1);
}

const client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function runDiagnostics() {
  const testKey = `diagnostics/test-${Date.now()}.txt`;
  let putSuccess = false;

  // 1. Test PutObject
  console.log(`\n[1/4] Testing PutObject to s3://${bucketName}/${testKey}...`);
  try {
    const putRes = await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: Buffer.from('VBridgeConnect S3 Connection Health Check'),
        ContentType: 'text/plain',
      })
    );
    console.log(`  ✔ PASS: PutObject succeeded! ETag: ${putRes.ETag}`);
    putSuccess = true;
  } catch (err) {
    console.error(`  ✖ FAIL: PutObject failed!`);
    console.error(`    Error Code: ${err.name}`);
    console.error(`    Details:    ${err.message}`);
  }

  // 2. Test GetObject
  if (putSuccess) {
    console.log(`\n[2/4] Testing GetObject from s3://${bucketName}/${testKey}...`);
    try {
      const getRes = await client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
      const content = await getRes.Body.transformToString();
      console.log(`  ✔ PASS: GetObject succeeded! Content: "${content}"`);
    } catch (err) {
      console.error(`  ✖ FAIL: GetObject failed: ${err.name} - ${err.message}`);
    }

    // 3. Test DeleteObject
    console.log(`\n[3/4] Cleaning up diagnostic file (DeleteObject)...`);
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
      console.log(`  ✔ PASS: Test file cleaned up successfully.`);
    } catch (err) {
      console.error(`  ✖ FAIL: DeleteObject failed: ${err.name} - ${err.message}`);
    }
  } else {
    console.log(`\n[2/4] & [3/4] Skipped GetObject/DeleteObject because PutObject failed.`);
  }

  // 4. Test ListObjects
  console.log(`\n[4/4] Listing objects in s3://${bucketName}...`);
  try {
    const listRes = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 10,
      })
    );
    console.log(`  ✔ PASS: ListObjects succeeded! Found ${listRes.KeyCount || 0} objects.`);
    if (listRes.Contents && listRes.Contents.length > 0) {
      console.log('  Objects in bucket:');
      listRes.Contents.forEach((item) => {
        console.log(`    - ${item.Key} (${item.Size} bytes, updated ${item.LastModified?.toISOString()})`);
      });
    } else {
      console.log('  Bucket is currently EMPTY.');
    }
  } catch (err) {
    console.error(`  ✖ FAIL: ListObjects failed!`);
    console.error(`    Error Code: ${err.name}`);
    console.error(`    Details:    ${err.message}`);
  }

  console.log('\n=====================================================');
}

runDiagnostics();

