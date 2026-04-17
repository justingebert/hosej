export type StorageCall = { s3Key: string; expiresIn: number };

const calls: StorageCall[] = [];

export async function generateSignedUrl(s3Key: string, expiresIn: number = 180) {
    const key = s3Key.replace(/^\/+/, "");
    calls.push({ s3Key: key, expiresIn });
    return { key, url: `https://fake-s3.example.com/${key}` };
}

export function getStorageCalls(): ReadonlyArray<StorageCall> {
    return calls;
}

export function resetStorageFake() {
    calls.length = 0;
}
