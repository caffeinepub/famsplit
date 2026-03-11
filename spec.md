# Spendly - Manage Money Smartly

## Current State
A family expense splitting app (formerly FamSplit) with 7 tabs: Dashboard, Expenses, Members, Budget, Analytics, Wallet, Settle Up. The Dashboard has 4 summary cards: Month Spent (clickable with a sheet), Wallet (static), Members (static), Max Owed (static). Color theme is red/orange (hue ~27). App header says "FamSplit".

## Requested Changes (Diff)

### Add
- Clickable Members card on Dashboard: opens a bottom sheet showing all members with their name, avatar, balance (positive/negative), and total paid
- Clickable Wallet card on Dashboard: opens a bottom sheet showing wallet balance, total in/out, and last 5-10 transactions
- Clickable Max Owed card on Dashboard: opens a bottom sheet showing who owes what — list each member with a negative balance sorted by how much they owe
- AI Assistant "Sana": floating action button (bottom-right, above nav bar) that opens a chat-style panel. Sana is a pre-scripted smart assistant that responds to keywords like "balance", "who owes", "wallet", "budget", "expenses", "tip", "help" with contextual data from the app state. No LLM integration — just rule-based responses using live data. Sana greets the user and suggests questions.

### Modify
- Rename all visible "FamSplit" text to "Spendly" and tagline to "Manage Money Smartly"
- Change primary color from red/orange (hue 27) to a pleasant blue (hue ~220) in index.css OKLCH tokens
- Change ring, destructive (keep red for errors), primary, chart-1 accordingly
- Members and Wallet dashboard cards should become clickable with cursor-pointer and hover effect, matching Month Spent card style
- Max Owed card should also become clickable

### Remove
- Nothing removed

## Implementation Plan
1. Update index.css: change --primary from hue 27 to blue ~220, update --ring and --chart-1 accordingly. Keep --destructive as red for errors.
2. Update Dashboard.tsx: rename FamSplit -> Spendly, add tagline, make Members/Wallet/Max Owed cards clickable, add 3 new Sheet components for each card
3. Create SanaAssistant.tsx: floating chat panel with Sana AI assistant using rule-based contextual responses from AppContext
4. Add SanaAssistant to App.tsx
