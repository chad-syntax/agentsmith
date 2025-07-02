import packageJson from '../../../../package.json';

export default function VersionPage() {
  const version = packageJson.version;
  const gitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

  return (
    <div className="container mx-auto p-8">
      <div className="space-y-2">
        <p>
          <strong>Version:</strong> {version}
        </p>
        <p>
          <strong>Git SHA:</strong> {gitSha || 'Not available'}
        </p>
      </div>
    </div>
  );
}
