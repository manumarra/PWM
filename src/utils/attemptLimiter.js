// Limita i tentativi errati per chiave (qui: l'id dell'ordine).
// I contatori stanno in memoria: bastano per un singolo processo Node, e si azzerano al riavvio.

export function createAttemptLimiter({ maxAttempts, lockMs, maxEntries = 5000 }) {
  const entries = new Map(); // chiave -> { attempts, lockedUntil }

  const sweep = (now) => {
    for (const [key, entry] of entries) {
      if (entry.lockedUntil && entry.lockedUntil <= now) entries.delete(key);
    }
  };

  return {
    /**
     * Prenota un tentativo. Va chiamata PRIMA di confrontare il codice e senza attese fra
     * la chiamata e il confronto: così richieste in parallelo non possono superare il limite.
     * Restituisce { allowed, attemptsLeft, retryAfterMs }.
     */
    hit(key, now = Date.now()) {
      let entry = entries.get(key);

      if (entry?.lockedUntil && entry.lockedUntil <= now) {
        entries.delete(key); // blocco scaduto: si riparte da zero
        entry = undefined;
      }
      if (entry?.lockedUntil) {
        return { allowed: false, attemptsLeft: 0, retryAfterMs: entry.lockedUntil - now };
      }

      entry ??= { attempts: 0 };
      entry.attempts += 1;
      if (entry.attempts >= maxAttempts) entry.lockedUntil = now + lockMs; // il prossimo tentativo sarà bloccato
      entries.set(key, entry);

      if (entries.size > maxEntries) sweep(now);
      return { allowed: true, attemptsLeft: maxAttempts - entry.attempts, retryAfterMs: 0 };
    },

    // Tentativo riuscito: si azzera il contatore
    reset(key) {
      entries.delete(key);
    }
  };
}
