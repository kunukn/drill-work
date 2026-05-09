# Product Overview

## What it is

A web app for managing freight bookings across vessels, terminals, and customers. One dispatcher-facing dashboard plus CRUD screens for the bookings behind it.

## Business problem it solves

Freight dispatchers track the same operational state across multiple disconnected systems: booking spreadsheets, vessel schedules, customer email threads. Three concrete consequences:

1. **Pending bookings silently age past their departure.** No single view shows "what needs confirming in the next 48 hours."
2. **In-transit shipments overshoot their arrival window without follow-up.** Customers find out before the operator does.
3. **Status questions ("how many bookings are pending?", "what departs this week?") require manual aggregation** every time someone asks.

The cost shows up as missed departures, idle capacity, reactive customer service, and dispatcher time spent re-deriving the same information.

## How the app addresses it

The dashboard is the answer. It's a single-screen triage view that surfaces three things in priority order:

- **Status counts** — total bookings per status (pending / confirmed / in transit / delivered / cancelled), each clickable into the filtered list.
- **Needs attention** — pending bookings departing within 48 hours, plus in-transit bookings past their arrival time.
- **Upcoming departures** — pending and confirmed bookings in the next 7 days, sorted by departure.

A live "now boarding" ticker shows sailings currently loading — vessel, route, departure time, fill percentage.

The dashboard auto-refreshes every 30 seconds so the picture stays current without manual reload.

## Supporting features

- **Bookings list** with filters by status, customer, and vessel.
- **Booking detail / edit** with inline validation and optimistic UI on save and delete.
- **Booking creation** with required-field validation.
- **Reference data** — customers, vessels, terminals, sailings — read-only for now (managed via seed data).

## Domain model in one paragraph

A **booking** represents a customer's cargo on a specific vessel between an origin and destination. Each booking has a status (`pending → confirmed → in_transit → delivered`, or `cancelled`), a weight, a cargo type, and departure/arrival times. A **sailing** is a planned vessel trip between two terminals with remaining capacity; multiple bookings share a sailing when they match on vessel and departure time. **Customers**, **vessels**, and **terminals** are reference entities that bookings and sailings refer to.

## Who uses it

- **Dispatchers** — primary user; lives on the dashboard.
- **Schedulers / capacity planners** — use the upcoming-departures panel and the bookings list.
- **Customer service** — uses booking lookup and status filters to answer "where's my cargo?"

## What's intentionally not in scope (yet)

- Authentication and per-user permissions.
- Editing customers, vessels, terminals, or sailings from the UI.
- Linking a booking directly to a sailing (currently linked via vessel + departure time).
- Reporting, exports, or historical analytics beyond what the dashboard shows.
- Notifications (email, SMS, push) when a booking enters "needs attention".

## Success looks like

- Dispatchers open the app first thing in the morning instead of opening a spreadsheet.
- "Needs attention" trends toward empty by end-of-day.
- Time from booking-created to booking-confirmed shrinks because nothing slips through.
- Customer-service tickets asking "where's my cargo?" decrease as ops gets ahead of the question.
