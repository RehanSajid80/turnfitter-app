"use client";

import { useActionState } from "react";
import { updateBranding, type BrandingState } from "./actions";

const initial: BrandingState = {};

export type Branding = {
  name: string;
  brand_logo: string | null;
  hero_headline: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  accent_color: string | null;
};

export function BrandingForm({
  gym,
  bookingUrl,
}: {
  gym: Branding;
  bookingUrl: string;
}) {
  const [state, action, pending] = useActionState(updateBranding, initial);

  return (
    <form action={action} className="space-y-6">
      <section className="tf-card p-6">
        <h2 className="font-display text-sm font-bold">Studio identity</h2>
        <div className="mt-4 space-y-4">
          <Field name="name" label="Studio name" defaultValue={gym.name} required />
          <Field
            name="brand_logo"
            label="Logo URL"
            placeholder="https://…/logo.png"
            hint="Paste a link to your logo image (square works best)."
            defaultValue={gym.brand_logo ?? ""}
          />
          <Field
            name="accent_color"
            label="Accent colour"
            type="color"
            defaultValue={gym.accent_color ?? "#6d28d9"}
            hint="Used for your booking buttons."
          />
        </div>
      </section>

      <section className="tf-card p-6">
        <h2 className="font-display text-sm font-bold">Public page hero</h2>
        <div className="mt-4 space-y-4">
          <Field
            name="hero_headline"
            label="Headline"
            placeholder="Boston's Premier Personal Training"
            defaultValue={gym.hero_headline ?? ""}
          />
          <Field
            name="hero_subtitle"
            label="Subtitle"
            placeholder="Unleash your potential. Your transformation starts here."
            defaultValue={gym.hero_subtitle ?? ""}
          />
          <Field
            name="hero_image_url"
            label="Hero background image URL"
            placeholder="https://…/gym-photo.jpg"
            hint="A wide photo of your studio works great. Leave blank for a clean gradient."
            defaultValue={gym.hero_image_url ?? ""}
          />
        </div>
      </section>

      <section className="tf-card p-6">
        <h2 className="font-display text-sm font-bold">Call-to-action button</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            name="cta_label"
            label="Button text"
            placeholder="See pricing"
            defaultValue={gym.cta_label ?? ""}
          />
          <Field
            name="cta_url"
            label="Button link"
            placeholder="https://your-site.com/pricing"
            defaultValue={gym.cta_url ?? ""}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="tf-btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <a href={bookingUrl} target="_blank" rel="noreferrer" className="tf-btn-ghost">
          Preview my page ↗
        </a>
        {state.ok && (
          <span className="text-sm font-medium text-reward-deep">Saved ✓</span>
        )}
        {state.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={type === "color" ? "mt-1 h-10 w-20 rounded-lg border border-line" : "tf-input"}
        {...rest}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
