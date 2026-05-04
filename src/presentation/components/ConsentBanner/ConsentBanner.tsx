import { h, render } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { ConsentBannerConfig } from '../../types/consent-types';
import { getConsentStyles } from './ConsentBanner.styles';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConsentBannerProps {
    config: ConsentBannerConfig;
    onAccept: () => void;
    onDeny: () => void;
    onPreferences?: () => void;
}

// ---------------------------------------------------------------------------
// Style injection (Patch #40)
// ---------------------------------------------------------------------------

// The <style> tag was being re-rendered inside the dialog on every config
// change, duplicating CSS in the document and breaking style identity for
// the browser. We inject once into <head> keyed by a deterministic id so
// repeat-mounts share the same stylesheet.
const STYLE_ELEMENT_ID = 'guiders-consent-banner-styles';
let lastStylesConfigSig: string | null = null;

function ensureStylesInjected(config: ConsentBannerConfig): void {
    const sig = JSON.stringify({
        c: config.colors ?? null,
        s: config.style ?? null,
    });
    let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (el && lastStylesConfigSig === sig) return;
    if (!el) {
        el = document.createElement('style');
        el.id = STYLE_ELEMENT_ID;
        document.head.appendChild(el);
    }
    el.textContent = getConsentStyles(config);
    lastStylesConfigSig = sig;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConsentBanner({ config, onAccept, onDeny, onPreferences }: ConsentBannerProps) {
    const style = config.style ?? 'bottom_bar';
    const text = config.text ?? '🍪 Usamos cookies para mejorar tu experiencia y proporcionar chat en vivo.';
    const acceptText = config.acceptText ?? 'Aceptar Todo';
    const denyText = config.denyText ?? 'Rechazar';
    const preferencesText = config.preferencesText ?? 'Preferencias';
    const showPreferences = config.showPreferences ?? true;

    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // Patch #40: inject styles once into <head> instead of inside the dialog body.
    useEffect(() => {
        ensureStylesInjected(config);
    }, [config]);

    // Patch #22: focus management, focus-trap and Escape-to-deny.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        // Remember the element that had focus before the dialog opened so we
        // can restore it on unmount (good a11y practice for modal dialogs).
        previouslyFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null;

        // Move focus to the first interactive element inside the dialog.
        const focusables = () =>
            Array.from(
                dialog.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            );
        const initial = focusables();
        if (initial.length > 0) initial[0].focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onDeny();
                return;
            }
            if (e.key !== 'Tab') return;
            // Re-query each time so we trap correctly even if the DOM changed.
            const items = focusables();
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey) {
                if (active === first || !dialog.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        dialog.addEventListener('keydown', onKeyDown);
        return () => {
            dialog.removeEventListener('keydown', onKeyDown);
            // Restore focus to the original element if it's still in the DOM.
            const prev = previouslyFocusedRef.current;
            if (prev && document.contains(prev) && typeof prev.focus === 'function') {
                prev.focus();
            }
        };
    }, [onDeny]);

    const buttons = (
        <div class="guiders-consent__buttons">
            <button class="guiders-consent__btn guiders-consent__btn--accept" onClick={onAccept}>
                {acceptText}
            </button>
            {showPreferences && onPreferences && (
                <button class="guiders-consent__btn guiders-consent__btn--preferences" onClick={onPreferences}>
                    {preferencesText}
                </button>
            )}
            <button class="guiders-consent__btn guiders-consent__btn--deny" onClick={onDeny}>
                {denyText}
            </button>
        </div>
    );

    return (
        <div
            ref={dialogRef}
            class={`guiders-consent guiders-consent--${style}`}
            role="dialog"
            aria-modal="true"
            aria-label="Consentimiento de cookies"
        >
            {style === 'bottom_bar' && (
                <div class="guiders-consent__inner">
                    <p class="guiders-consent__text">{text}</p>
                    {buttons}
                </div>
            )}

            {style === 'modal' && (
                <div class="guiders-consent__modal-box">
                    <h2 class="guiders-consent__title">🍪 Gestión de Cookies</h2>
                    <p class="guiders-consent__text">{text}</p>
                    {buttons}
                </div>
            )}

            {style === 'corner' && (
                <div>
                    <p class="guiders-consent__text">{text}</p>
                    {buttons}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

/**
 * Mounts the ConsentBanner in document.body (outside Shadow DOM).
 * Returns a cleanup function that unmounts and removes the element.
 */
export function mountConsentBanner(
    config: ConsentBannerConfig,
    callbacks: {
        onAccept: () => void;
        onDeny: () => void;
        onPreferences?: () => void;
    }
): () => void {
    // Patch #6: when an existing banner is present we must unmount Preact
    // before removing the DOM node, otherwise effects/refs leak.
    const existing = document.getElementById('guiders-consent-banner-preact');
    if (existing) {
        try { render(null, existing); } catch { /* ignore */ }
        existing.remove();
    }

    const mountPoint = document.createElement('div');
    mountPoint.id = 'guiders-consent-banner-preact';
    document.body.appendChild(mountPoint);

    render(
        h(ConsentBanner, {
            config,
            onAccept: callbacks.onAccept,
            onDeny: callbacks.onDeny,
            onPreferences: callbacks.onPreferences,
        }),
        mountPoint
    );

    return () => {
        render(null, mountPoint);
        mountPoint.remove();
    };
}
