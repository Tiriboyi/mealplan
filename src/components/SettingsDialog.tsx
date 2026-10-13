"use client";

import { useEffect, useRef, useState } from "react";
import { RETAILERS, type PromoStatus } from "@/lib/retailers";
import type { Settings } from "@/lib/settings";

type Props = { settings: Settings; onSave: (next: Settings) => void; onClose: () => void };

export default function SettingsDialog({ settings, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(settings);
  const [exclude, setExclude] = useState(settings.prefs.exclude.join(", "));

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const setPrefs = (prefs: Partial<Settings["prefs"]>) => setDraft({ ...draft, prefs: { ...draft.prefs, ...prefs } });

  function toggleRetailer(key: string) {
    const on = draft.retailers.includes(key);
    setDraft({ ...draft, retailers: on ? draft.retailers.filter((r) => r !== key) : [...draft.retailers, key] });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...draft,
      apiKey: draft.apiKey.trim(),
      prefs: { ...draft.prefs, exclude: exclude.split(",").map((w) => w.trim()).filter(Boolean) },
    });
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="settings-title">
      <form onSubmit={submit}>
        <h2 id="settings-title">Settings</h2>

        <fieldset>
          <legend>Supermarkets</legend>
          <div className="checks">
            {Object.entries(RETAILERS).map(([key, name]) => (
              <label key={key}>
                <input type="checkbox" checked={draft.retailers.includes(key)} onChange={() => toggleRetailer(key)} />
                {name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Household</legend>
          <div className="row">
            <label>
              People
              <input
                type="number"
                min={1}
                max={10}
                value={draft.prefs.people}
                onChange={(e) => setPrefs({ people: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
              />
            </label>
            <label>
              Dinners
              <input
                type="number"
                min={1}
                max={7}
                value={draft.prefs.days}
                onChange={(e) => setPrefs({ days: Math.min(7, Math.max(1, Number(e.target.value) || 1)) })}
              />
            </label>
            <label>
              Promotions
              <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as PromoStatus })}>
                <option value="active">Running now</option>
                <option value="upcoming">Starting soon</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Never suggest</legend>
          <div className="checks">
            <label>
              <input type="checkbox" checked={draft.prefs.noPork} onChange={(e) => setPrefs({ noPork: e.target.checked })} />
              Pork
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.prefs.noShellfish}
                onChange={(e) => setPrefs({ noShellfish: e.target.checked })}
              />
              Shellfish and other seafood
            </label>
          </div>
          <label>
            Other words to avoid in product names
            <input type="text" value={exclude} onChange={(e) => setExclude(e.target.value)} placeholder="lams, zalm" />
          </label>
        </fieldset>

        <fieldset>
          <legend>PrijsProfeet API key</legend>
          <label>
            Your key (optional)
            <input
              type="password"
              autoComplete="off"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            />
          </label>
          <p className="muted small">
            Stored only in this browser and passed through this app's server to PrijsProfeet, which never saves it. The
            app works without one, on lower rate limits.
            Get a free key at{" "}
            <a href="https://www.prijsprofeet.nl/api" target="_blank" rel="noreferrer">
              prijsprofeet.nl/api
            </a>
            .
          </p>
        </fieldset>

        <div className="actions end">
          <button type="button" className="quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={draft.retailers.length === 0}>
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
}
