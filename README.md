# Voyage Estimator

This repository contains a commercial voyage estimator for merchant ship chartering, written in TypeScript with React and Express. It screens candidate vessels for a cargo, routes the voyage, and computes the time charter equivalent, the net profit and their sensitivity, including bunkers, canal tolls, war risk, EU ETS and FuelEU costs.

## Project Overview

The estimator takes a charter party, screens candidate vessels from a live feed and routes the voyage along a maritime network. From the route and the vessel profile it derives the fuel consumption, the bunker, port and canal costs, the war risk premium, and the EU ETS and FuelEU Maritime liabilities. Results are presented as a ledger, a waterfall chart and a sensitivity analysis, and can be exported as a PDF report.

Calculations run in the browser. A small server holds the API credentials and forwards requests to [Datalastic](https://datalastic.com) for vessel data and to [OilPriceAPI](https://www.oilpriceapi.com) for bunker prices, EU allowance prices and the euro rate. Both require an API key, and `.env.example` lists the variables that the server reads. The server forwards only the endpoints and parameters the estimator uses, and paces the requests to each provider within its rate limit.

## Repository Structure

- `server.ts`: Credentialed, rate-limited pass-through to the data providers, which also serves the application.
- `tailwind.config.ts`: Reads the colour palette into Tailwind.
- `src/App.tsx`: Application layout, with one sheet per stage of the estimate.
- `src/estimator/`: Shared state of the estimate: the broker's entries, and the store that loads and calculates from them.
- `src/features/charterparty/`: Charter party terms and commissions.
- `src/features/cargo/`: Dry and wet bulk cargo data.
- `src/features/screening/`: Vessel search and screening.
- `src/features/vessel/`: Vessel types, candidates and profiles.
- `src/features/ports/`: Port data and port costs.
- `src/features/routing/`: Sea routing, voyage duration, canal tolls, war risk and the route map.
- `src/features/bunkers/`: Fuel grades, the price feed, bunker prices, consumption and bunker costs.
- `src/features/environmental/`: Emission rates, EU scope, EU ETS and FuelEU Maritime.
- `src/features/financials/`: Voyage estimate, ledger, waterfall chart, sensitivity analysis and PDF report.
- `src/shared/`: Formatting, field definitions, figure readers, geometry, HTTP helpers, async resources, the colour palette and interface primitives.
- `.env.example`: Template of the server configuration.
