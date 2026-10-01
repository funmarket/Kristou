import React, { useEffect, useMemo, useState } from "react";
import { applyTheme, DEFAULT_THEME, type Theme } from "@kristou/ui";
import { applyLocale, translations, type Locale } from "../i18n/index.js";
import "./KristouShell.css";

export interface KristouShellProps {
  children?: React.ReactNode;
  logoSrc?: string;
}

type OpenPanel = "account" | "notifications" | null;

const languageLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

function setDocumentTheme(theme: Theme): void {
  applyTheme(document.documentElement, theme);
}

function setDocumentLocale(locale: Locale): void {
  applyLocale(document.documentElement, locale);
}

export function KristouShell({ children, logoSrc = "/kristou-logo.png" }: KristouShellProps) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [locale, setLocale] = useState<Locale>("en");
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const t = useMemo(() => translations[locale], [locale]);

  useEffect(() => {
    setDocumentTheme(theme);
  }, [theme]);

  useEffect(() => {
    setDocumentLocale(locale);
  }, [locale]);

  return (
    <div className="k-shell">
      <header className="k-appbar">
        <a className="k-brand" href="/" aria-label={t.school}>
          <img className="k-brand-logo" src={logoSrc} alt="" aria-hidden="true" />
          <span className="k-brand-copy">
            <strong>{t.school}</strong>
            <small>{t.schoolType}</small>
          </span>
        </a>

        <div className="k-appbar-actions">
          <button
            className="k-icon-button"
            type="button"
            aria-label={t.notifications}
            aria-expanded={openPanel === "notifications"}
            onClick={() =>
              setOpenPanel((current) => (current === "notifications" ? null : "notifications"))
            }
          >
            <span aria-hidden="true">🔔</span>
          </button>

          <button
            className="k-account-button"
            type="button"
            aria-label={t.account}
            aria-expanded={openPanel === "account"}
            onClick={() => setOpenPanel((current) => (current === "account" ? null : "account"))}
          >
            <span className="k-avatar-placeholder" aria-hidden="true">
              K
            </span>
            <span className="k-account-label">{t.account}</span>
          </button>
        </div>
      </header>

      <main className="k-shell-main">
        {children ?? (
          <section className="k-foundation-empty">
            <p>{t.shellHint}</p>
          </section>
        )}
      </main>

      {openPanel !== null && (
        <>
          <button
            className="k-panel-backdrop"
            type="button"
            aria-label={t.close}
            onClick={() => setOpenPanel(null)}
          />
          {openPanel === "notifications" ? (
            <section
              className="k-panel k-notifications-panel k-scroll"
              role="dialog"
              aria-modal="true"
              aria-label={t.notifications}
            >
              <PanelHeader
                title={t.notifications}
                closeLabel={t.close}
                onClose={() => setOpenPanel(null)}
              />
              <p className="k-empty-state">{t.noNotifications}</p>
            </section>
          ) : (
            <section
              className="k-panel k-account-sheet k-scroll"
              role="dialog"
              aria-modal="true"
              aria-label={t.account}
            >
              <PanelHeader
                title={t.account}
                closeLabel={t.close}
                onClose={() => setOpenPanel(null)}
              />

              <div className="k-settings-group">
                <div>
                  <strong>{t.appearance}</strong>
                  <small>{t.appearanceHint}</small>
                </div>
                <div className="k-segmented-control" aria-label={t.appearance}>
                  <button
                    type="button"
                    className={theme === "light" ? "is-active" : ""}
                    onClick={() => setTheme("light")}
                  >
                    {t.light}
                  </button>
                  <button
                    type="button"
                    className={theme === "dark" ? "is-active" : ""}
                    onClick={() => setTheme("dark")}
                  >
                    {t.dark}
                  </button>
                </div>
              </div>

              <div className="k-settings-group">
                <strong>{t.language}</strong>
                <div className="k-language-grid" aria-label={t.language}>
                  {(["en", "fr", "ar"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={locale === item ? "is-active" : ""}
                      onClick={() => setLocale(item)}
                    >
                      {languageLabels[item]}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PanelHeader({
  title,
  closeLabel,
  onClose,
}: {
  title: string;
  closeLabel: string;
  onClose(): void;
}) {
  return (
    <header className="k-panel-header">
      <h2>{title}</h2>
      <button className="k-close-button" type="button" onClick={onClose} aria-label={closeLabel}>
        <span aria-hidden="true">×</span>
      </button>
    </header>
  );
}
