import { CancelForm } from "./cancel-form";

export default async function CancelPage({
  params,
}: {
  params: Promise<{ cancelToken: string }>;
}) {
  const { cancelToken } = await params;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <CancelForm token={cancelToken} />
    </main>
  );
}
