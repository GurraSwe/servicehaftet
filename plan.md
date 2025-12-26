I want to move the app forward as a PWA (Progressive Web App).
The goal is that users can install it on their phone and receive in-app push notifications (no email).

Initial scope:

Set up the app as a basic PWA (manifest + service worker)

Make it installable on mobile

Prepare push notifications for service reminders

Android / Chrome support is enough for the first version

No native apps and no email notifications for now — just a simple, stable PWA.



 app name "ServiceHäftet" i added app icon icon.jpeg in icon folder

 Before finalizing the PWA, I would like to add GDPR-related content and make sure everything is compliant and ready for launch.

Please add the following to the app:

1. Privacy Policy (in Swedish)

Add a “Integritetspolicy” page with this content:

Integritetspolicy

Vi värnar om din integritet. Denna app samlar endast in den information som krävs för att tjänsten ska fungera.

Vilken information lagras?

Inloggningsuppgifter via Supabase (e-post och användar-ID)

Fordonsinformation som användaren själv lägger in (bil, miltal, servicehistorik)

Servicepåminnelser kopplade till fordon

Hur används informationen?

För att visa och hantera servicehistorik

För att skicka påminnelser när det är dags för service

För att ge användaren tillgång till sitt konto

Delning av data

Ingen data delas med tredje part

Ingen data säljs vidare

Ingen e-postmarknadsföring

Lagring och säkerhet

All data lagras säkert via Supabase

Varje användare har endast tillgång till sin egen data

Dina rättigheter
Användaren har rätt att begära utdrag eller radering av sin data.

2. Terms & Conditions (in Swedish)

Add an “Användarvillkor” page with this content:

Användarvillkor

Genom att använda appen godkänner användaren följande:

Appen tillhandahålls i befintligt skick

Användaren ansvarar själv för all information som matas in

Appen är ett hjälpmedel och ersätter inte professionell rådgivning

Funktioner kan ändras eller uppdateras över tid

3. Short GDPR text inside the app

Add a short section (for example in Settings or footer):

GDPR & Dataskydd

Vi följer GDPR.
Endast nödvändig data lagras för att appen ska fungera.
Ingen data delas med tredje part.

Länk till: Integritetspolicy

4. Placement

Please add links to:

Integritetspolicy

Användarvillkor

GDPR & Dataskydd

Either in:

Settings page, or

Footer area

5. PWA Scope Reminder

Just to confirm:

This is a web-based PWA only

No email notifications

Notifications only via in-app / push (service reminders)