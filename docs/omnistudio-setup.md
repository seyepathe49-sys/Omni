# OmniStudio: configurazione AI

OmniStudio usa un endpoint server-side in `src/routes/api.studio.generate.ts`. Le chiavi provider non vengono inviate al browser.

## Segreti richiesti

Configura **uno o più** segreti nell'ambiente server/hosting del progetto:

- `OPENAI_API_KEY` per OpenAI
- `ANTHROPIC_API_KEY` per Anthropic Claude
- `GEMINI_API_KEY` per Google Gemini

Non inserire mai queste chiavi in componenti React, variabili `VITE_*`, HTML, repository pubblico o screenshot. Se una chiave è stata pubblicata, revocala e creane una nuova.

Per lo sviluppo locale, crea un file `.env` ignorato da Git copiando `.env.example`, quindi inserisci i valori sul tuo computer. Per Lovable o il deployment, usa la sezione Secrets/Environment Variables della piattaforma e riavvia o ridistribuisci l'app.

## Modelli

Nell'interfaccia seleziona il provider e inserisci l'ID esatto del modello abilitato nel tuo account API. L'abbonamento ChatGPT, Claude o Gemini non sostituisce necessariamente una chiave API e la fatturazione API è separata.

## Funzioni implementate

- Generazione e modifica di un documento HTML completo tramite il provider scelto.
- Anteprima in iframe con sandbox `allow-scripts` e senza `allow-same-origin`.
- Console che riceve `console.log/info/warn/error`, errori JavaScript e promise rejection dalla preview.
- Salvataggio automatico della bozza su questo dispositivo e ripristino al ritorno.
- Esportazione del progetto come file HTML.
- Validazione input, controllo dell'origine e limite temporaneo per IP nell'endpoint.

## Prima di renderlo pubblico

Il rate limit in memoria è una protezione di base e non è condiviso tra istanze/serverless. Prima di esporre il servizio a utenti reali, aggiungi autenticazione, quote per utente, rate limiting persistente (ad esempio Redis o una funzione equivalente della piattaforma), limiti di spesa e telemetria. L'HTML generato è codice non attendibile: mantienilo nella sandbox e non aggiungere `allow-same-origin`, accesso a cookie, token o API privilegiate. L'anteprima HTML non equivale a un ambiente di build per app native o a un backend completo.
