import { redirect } from "next/navigation";
import { getCurrentStudio } from "@/lib/studios";

export default async function SettingsPage() {
  const studio = await getCurrentStudio();
  if (!studio) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm">
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Studio name</dt>
            <dd className="font-medium">{studio.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Public page</dt>
            <dd className="font-medium">/s/{studio.slug}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Timezone</dt>
            <dd className="font-medium">{studio.timezone ?? "UTC"}</dd>
          </div>
        </dl>
      </div>
      <p className="text-sm text-neutral-400">
        Editing studio name, logo, and slug is coming in the next build.
      </p>
    </div>
  );
}
