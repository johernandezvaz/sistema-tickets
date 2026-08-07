'use client';

import { useState, useRef } from 'react';
import { buscarTicket } from '@/app/actions/seguimiento';
import type { TicketDetalle } from '@/lib/types';
import TicketResult from './TicketResult';

type SearchState = 'idle' | 'loading' | 'found' | 'not_found';

export default function SeguimientoForm() {
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [ticket, setTicket] = useState<TicketDetalle | null>(null);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const folio = inputVal.trim().toUpperCase();
    if (!folio) {
      inputRef.current?.focus();
      return;
    }

    setSearchState('loading');
    setTicket(null);

    try {
      const result = await buscarTicket(folio);
      if (result.found) {
        setTicket(result.ticket);
        setSearchState('found');
      } else {
        setSearchState('not_found');
      }
    } catch {
      setSearchState('not_found');
    }
  }

  function handleNewSearch() {
    setSearchState('idle');
    setTicket(null);
    setInputVal('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="flex flex-col gap-6">

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="folio"
            className="mb-1.5 block text-sm font-medium"
            style={{ color: 'var(--color-text-base)' }}
          >
            Folio de seguimiento
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="folio"
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value.toUpperCase())}
              placeholder="Ej. A3BZ7KQM2X"
              maxLength={10}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 rounded-lg border px-4 py-2.5 text-base
                         tracking-widest uppercase outline-none transition-all"
              style={{
                borderColor: searchState === 'not_found'
                  ? 'var(--color-danger)'
                  : 'var(--color-border)',
                backgroundColor: '#fff',
                color: 'var(--color-navy)',
                fontFamily: 'monospace',
                boxShadow: searchState === 'not_found'
                  ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 15%, transparent)'
                  : undefined,
              }}
              aria-invalid={searchState === 'not_found'}
              aria-describedby={searchState === 'not_found' ? 'folio-error' : undefined}
            />
            <button
              type="submit"
              disabled={searchState === 'loading'}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5
                         text-sm font-semibold text-white transition-opacity
                         disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {searchState === 'loading' ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Buscando…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                    fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                  </svg>
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        {searchState === 'idle' && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            El folio tiene 10 caracteres (letras y números) y te fue entregado al crear tu ticket.
          </p>
        )}
      </form>

      {searchState === 'not_found' && (
        <div
          id="folio-error"
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 7%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
          }}
          role="alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: 'var(--color-danger)' }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>
              Ticket no encontrado
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-base)' }}>
              No encontramos ningún ticket con ese folio. Verifica que lo hayas escrito
              correctamente y que sea el folio exacto que recibiste.
            </p>
          </div>
        </div>
      )}

      {searchState === 'found' && ticket && (
        <>
          <hr style={{ borderColor: 'var(--color-border)' }} />
          <TicketResult ticket={ticket} />
          <div className="pt-2">
            <button
              onClick={handleNewSearch}
              type="button"
              className="text-sm transition-opacity hover:opacity-75"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ← Buscar otro folio
            </button>
          </div>
        </>
      )}
    </div>
  );
}
