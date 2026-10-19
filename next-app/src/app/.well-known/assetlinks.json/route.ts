import { NextResponse } from 'next/server';

export async function GET() {
  const packageName = process.env.TWA_PACKAGE_NAME || 'in.edu.vit.vbridgeconnect';
  const sha256Fingerprint =
    process.env.TWA_SHA256_FINGERPRINT ||
    '14:6D:E9:17:86:14:0E:01:A0:63:F5:BD:98:97:54:19:BE:85:2E:39:19:D4:FF:6F:4D:5E:2B:60:A3:8C:36:20';

  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: [sha256Fingerprint],
      },
    },
  ];

  return new NextResponse(JSON.stringify(assetLinks, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, must-revalidate',
    },
  });
}
