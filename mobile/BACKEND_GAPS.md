# Backend gaps

No backend changes were required. The existing Node/MySQL backend exposes the complete customer API required by this mobile client, including customer-only booking ownership checks and backend-issued participant QR URLs.

Assumptions documented in the client:

- Content, provider, and offering endpoints are public as currently implemented.
- `story_time`, `event_date`, and time-only values are interpreted according to their MySQL semantic type rather than blindly converted as UTC instants.
- Customer bookings are authorized by the existing `/bookings/:id` ownership checks.
- Production deployments provide HTTPS URLs through the configuration files.
