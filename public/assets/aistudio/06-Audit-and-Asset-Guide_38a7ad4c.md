# Andaaz website research and build guide

Prepared for Hadi at Zayvo AI Studio on 25 November 2026. This kit supports a new AI Studio preview for Andaaz Restaurant on Fort Road in Lahore. The direction is a stronger visual presentation and a guided reservation handoff using the restaurant's existing identity and official contact channels.

## Identity and scope

The supplied Google share link redirected to an Andaaz Restaurant entity. Its Google panel required verification, so its address, reviews and rating were not read. The research uses the matching official Lahore website, which identifies Fort Road opposite Badshahi Masjid. No Google review score is included.

The sitemap contains 13 URLs. Eleven cover the restaurant and its occasions; two concern CityLife Suites accommodation. All eleven restaurant pages were fetched. Accommodation photos and room details were excluded from the restaurant asset collection.

## What the existing site already does

The restaurant already has a multipage site, a dinner request form, a full menu PDF, official WhatsApp links and dedicated pages for different occasions. The published telephone and WhatsApp destination agree: +92 300 0263229. The proposed improvement should therefore focus on presentation, navigation, guidance and consistent handoffs. No claim about lost bookings, conversion rates or missing backend automation has been measured.

## Specific observations and proposed changes

| Observed on the public site | Proposed preview behaviour |
| --- | --- |
| Several event forms use the label “SEND MY STAY ENQUIRY”. | Use an event-specific request action and the correct WhatsApp summary. |
| The main navigation exposes few of the occasion pages listed in the sitemap. | Add an Experiences overview with six linked detail pages. |
| Several event images have a generic breakfast-related alt attribute regardless of the page. | Describe the actual image rather than copying the old alt text. |
| Some event time options contain the letter O in place of a zero. | Use validated numeric time values and readable labels. |
| General dinner and event forms have different time choices. | Keep ordinary dinner and special-event requests separate. |
| The menu includes a short HTML selection and a scanned three-page PDF. | Offer searchable verified highlights alongside the full original PDF. |
| Desktop and portrait crops repeat the same scenes. | Use responsive crops and remove duplicate scenes from the gallery. |

These are observations from public HTML, the homepage's rendered appearance and the original files. No live forms were submitted, no restaurant messages were sent and backend delivery was not tested. The performance and accessibility targets in the prompt are proposed requirements, not measured scores for the existing site.

## Original visual identity

| Role | Observed value |
| --- | --- |
| Main background | #FAF8F3 |
| Primary heading colour | #172332 |
| Navigation colour | #1F2B38 |
| Secondary text | #4F5D6A |
| Action colour | #7E4D54 |
| Softer accent | #AA7C7E |
| Heading and navigation font | Cormorant Garamond |
| Body and action font | Inter |
| Footer address font | Instrument Sans |

These values were read from computed homepage styles; no official brand manual was supplied. The animation, typography scale and layout recommendations are new design choices. The original logo is an opaque 1399 × 1604 JPEG. Retain its proportions and place it on an ivory surface. Do not describe it as a transparent PNG or a vector file.

## Reservation design

The preview collects preferences, displays an editable summary and opens a prefilled WhatsApp request to the official number. The guest sends the message, and the restaurant decides availability. The assistant must not confirm a table, invent an acceptance response or claim the restaurant received a request merely because WhatsApp opened.

The official dinner form offers arrival choices from 5 PM through 10 PM in hourly steps. These are request choices, not a weekly opening schedule. Brunch and occasion pages support different planning requests. The corporate page advertises capacity up to 200 across its spaces; an individual event still requires confirmation.

## Assets and limitations

The asset manifest identifies every file, its exact source URL, source pages, dimensions and download result. All image bytes are saved as served; no AI photos or logo edits were made. Portrait and landscape files can be different crops of the same scene. Names and source alt text describe provenance, but the preview should use visually checked captions.

The full original menu is supplied as a PDF, including its printed prices. It is scanned rather than searchable text. The menu-highlights JSON is a selected list from the HTML page, not a complete transcription. Specific dish photographs, transparent/vector logo artwork, a full social-media photo archive, and source font files were not obtained. Do not fill those gaps with invented content. The social accounts are linked by the official website; their complete feeds were not exported.

No verified weekly timetable, deposit terms, cancellation policy, restaurant email, live inventory or price-validity date was obtained. The preview should direct those questions to the team. CityLife accommodation accessibility or parking information must not be assumed to apply to dining guests.

## Using the kit

1. Extract the ZIP and start a web app in Google AI Studio Build mode.
2. Paste the contents of 01-AI-Studio-Master-Prompt.txt. Add the data files and original assets through the supported file or project workflow. Do not assume AI Studio accepts the whole ZIP as a project import. The master prompt also contains original image URLs if local files are not yet in the project.
3. Use 02-Gemini-System-Prompt.txt for the assistant. Keep the API key in the server-side secret environment. Model availability should be checked in the current project rather than hardcoded from an old example.
4. Let the app finish, then use 07-Polish-and-QA-Prompt.txt to review the running preview. Do not send test enquiries to the restaurant.
5. Review mobile layout, every page, original media, the PDF, assistant fallback and WhatsApp recipient before sharing the preview with the owner.

## Sources

- [Official homepage](https://andaazrestaurant.com/)
- [Official reservations](https://andaazrestaurant.com/reservation-page)
- [Menu and original PDF link](https://andaazrestaurant.com/andaaz-menu)
- [The house](https://andaazrestaurant.com/restaurant-in-walled-city-lahore)
- [Hosted evenings](https://andaazrestaurant.com/hosted-evenings)
- [Private brunch](https://andaazrestaurant.com/breakfast-brunch)
- [Corporate hosting](https://andaazrestaurant.com/corporate-hosting)
- [Dinner with music](https://andaazrestaurant.com/dinner-with-music)
- [Celebrations](https://andaazrestaurant.com/shining-moments)
- [Wedding gatherings](https://andaazrestaurant.com/wedding-gatherings)
- [Anniversary dinners](https://andaazrestaurant.com/anniversary-dinner-lahore)
- [Google AI Studio Build documentation](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)
