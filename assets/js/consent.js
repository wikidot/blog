document.addEventListener('DOMContentLoaded', function() {
  const cookieConsent = initCookieConsent();
  
  cookieConsent.run({
    current_lang: 'it',
    autoclear_cookies: true,
    page_scripts: true,

    // Инициализация Google Analytics после согласия
    onAccept: function (cookie) {
      if (cookie.categories.includes('analytics')) {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-2HFQLVGNKE');
      }
    },

    languages: {
      'it': {
        consent_modal: {
          title: 'Utilizziamo i cookie!',
          description: 'Questo sito utilizza cookies essenziali per il funzionamento e cookies di terze parti per analisi. Facendo clic su "Accetta tutto", accetti l\'utilizzo di TUTTI i cookies. <button type="button" data-cc="c-settings" class="cc-link">Personalizza preferenze</button>',
          primary_btn: {
            text: 'Accetta tutto',
            role: 'accept_all'
          },
          secondary_btn: {
            text: 'Accetta necessari',
            role: 'accept_necessary'
          }
        },
        settings_modal: {
          title: 'Preferenze cookie',
          save_settings_btn: 'Salva impostazioni',
          accept_all_btn: 'Accetta tutto',
          reject_all_btn: 'Rifiuta tutto',
          close_btn_label: 'Chiudi',
          cookie_table_headers: [
            {col1: 'Nome'},
            {col2: 'Dominio'},
            {col3: 'Scadenza'},
            {col4: 'Descrizione'}
          ],
          blocks: [
            {
              title: 'Utilizzo dei cookie',
              description: 'Utilizzo i cookie per migliorare la tua esperienza di navigazione, analizzare il traffico e personalizzare i contenuti.'
            }, {
              title: 'Cookie necessari',
              description: 'Questi cookie sono essenziali per il funzionamento del sito.',
              toggle: {
                value: 'necessary',
                enabled: true,
                readonly: true
              }
            }, {
              title: 'Cookie analitici (Google Analytics)',
              description: 'Utilizzati per analizzare le prestazioni del sito e il comportamento degli utenti.',
              toggle: {
                value: 'analytics',
                enabled: false,
                readonly: false
              },
              cookie_table: [
                {
                  col1: '_ga',
                  col2: window.location.hostname,
                  col3: '2 anni',
                  col4: 'ID unico per identificare gli utenti'
                },
                {
                  col1: '_gid',
                  col2: window.location.hostname,
                  col3: '24 ore',
                  col4: 'ID per identificare le sessioni'
                }
              ]
            }, {
              title: 'Contattaci',
              description: 'Per domande sulla nostra politica sui cookie, <a class="cc-link" href="/contatti">contattaci</a>.'
            }
          ]
        }
      }
    }
  });
});