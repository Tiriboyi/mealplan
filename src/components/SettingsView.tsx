"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { RETAILERS, type PromoStatus } from "@/lib/retailers";
import type { Settings } from "@/lib/settings";
import { usePlan } from "./PlanProvider";

export default function SettingsView() {
  const { settings, applySettings } = usePlan();

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Saved in this browser</p>
          <h1>Settings</h1>
        </div>
      </div>
      {settings ? (
        <SettingsForm settings={settings} onSave={applySettings} />
      ) : (
        <div className="skeletons" role="status" aria-label="Loading settings">
          <div className="skeleton tall" />
          <div className="skeleton tall" />
        </div>
      )}
    </>
  );
}

function SettingsForm({ settings, onSave }: { settings: Settings; onSave: (next: Settings) => void }) {
  const [draft, setDraft] = useState(settings);
  const [exclude, setExclude] = useState(settings.prefs.exclude.join(", "));
  const [saved, setSaved] = useState(false);

  const next: Settings = {
    ...draft,
    apiKey: draft.apiKey.trim(),
    prefs: { ...draft.prefs, exclude: exclude.split(",").map((w) => w.trim()).filter(Boolean) },
  };
  const dirty = JSON.stringify(next) !== JSON.stringify(settings);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [saved]);

  const setPrefs = (prefs: Partial<Settings["prefs"]>) => setDraft({ ...draft, prefs: { ...draft.prefs, ...prefs } });

  function toggleRetailer(key: string) {
    const on = draft.retailers.includes(key);
    setDraft({ ...draft, retailers: on ? draft.retailers.filter((r) => r !== key) : [...draft.retailers, key] });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave(next);
    setSaved(true);
  }

  return (
    <form className="settings" onSubmit={submit}>
      <fieldset className="card">
        <legend>Household</legend>
        <Stepper label="People at the table" value={draft.prefs.people} min={1} max={10} onChange={(people) => setPrefs({ people })} />
        <Stepper label="Dinners to plan" value={draft.prefs.days} min={1} max={7} onChange={(days) => setPrefs({ days })} />
      </fieldset>

      <fieldset className="card">
        <legend>Supermarkets</legend>
        <p className="meta">Offers are only taken from the shops you pick.</p>
        <div className="pills">
          {Object.entries(RETAILERS).map(([key, name]) => (
            <label key={key} className="pill">
              <input type="checkbox" checked={draft.retailers.includes(key)} onChange={() => toggleRetailer(key)} />
              <Check aria-hidden="true" />
              {name}
            </label>
          ))}
        </div>
        {draft.retailers.length === 0 && (
          <p className="field-error" role="alert">
            Pick at least one supermarket.
          </p>
        )}
      </fieldset>

      <fieldset className="card">
        <legend>Promotions</legend>
        <div className="segmented">
          {(
            [
              ["active", "Running now"],
              ["upcoming", "Starting soon"],
            ] satisfies [PromoStatus, string][]
          ).map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="status"
                checked={draft.status === value}
                onChange={() => setDraft({ ...draft, status: value })}
              />
              {label}
            </label>
          ))}
        </div>
        <p className="meta">Plan with next week's offers when you shop ahead.</p>
      </fieldset>

      <fieldset className="card">
        <legend>Never suggest</legend>
        <label className="switch">
          <span>Pork</span>
          <input type="checkbox" role="switch" checked={draft.prefs.noPork} onChange={(e) => setPrefs({ noPork: e.target.checked })} />
        </label>
        <label className="switch">
          <span>Shellfish and other seafood</span>
          <input
            type="checkbox"
            role="switch"
            checked={draft.prefs.noShellfish}
            onChange={(e) => setPrefs({ noShellfish: e.target.checked })}
          />
        </label>
        <label className="field">
          Other words to avoid in product names
          <input
            type="text"
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
            placeholder="lams, zalm"
            aria-describedby="exclude-help"
          />
        </label>
        <p className="meta" id="exclude-help">
          Dutch words, separated by commas. These rules read product names, so they are cautious but not an allergy
          guarantee.
        </p>
      </fieldset>

      <fieldset className="card">
        <legend>PrijsProfeet API key</legend>
        <label className="field">
          Your key (optional)
          <input
            type="password"
            autoComplete="off"
            value={draft.apiKey}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            aria-describedby="key-help"
          />
        </label>
        <p className="meta" id="key-help">
          Stored only in this browser and passed through this app's server to PrijsProfeet, which never saves it. The
          app works without one, on lower rate limits. Get a free key at{" "}
          <a href="https://www.prijsprofeet.nl/api" target="_blank" rel="noreferrer">
            prijsprofeet.nl/api
          </a>
          .
        </p>
      </fieldset>

      {/* Only in the way when there is something to save, or a save to confirm. */}
      {(dirty || saved) && (
        <div className="save-bar">
          <span className="meta" role="status">
            {dirty ? "You have unsaved changes." : "Saved. Your week is up to date."}
          </span>
          {dirty && (
            <>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setDraft(settings);
                  setExclude(settings.prefs.exclude.join(", "));
                }}
              >
                Reset
              </button>
              <button type="submit" className="button primary" disabled={draft.retailers.length === 0}>
                Save changes
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

function Stepper(props: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const { label, value, min, max, onChange } = props;
  return (
    <div className="stepper">
      <span>{label}</span>
      <div role="group" aria-label={label}>
        <button type="button" className="icon-button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="One fewer">
          <Minus aria-hidden="true" />
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" className="icon-button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="One more">
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
