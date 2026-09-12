# ProfitPilot: Smart Business Finance

Build a production-quality full-stack web application called "ProfitPilot".

ProfitPilot is an AI-powered financial and inventory management platform for small businesses.

IMPORTANT:

- Build a REAL WORKING APPLICATION, not a static prototype.

- Use a persistent database and authentication.

- All forms, calculations, CRUD operations, filters and navigation must actually work.

- Make the application responsive on mobile, tablet and desktop.

- Do not fill the application with fake hardcoded business data after the user starts using it.

CORE NAVIGATION:

1. Dashboard

2. Inventory

3. Grocery List

4. Sellers / Suppliers

5. Cash Flow Radar

6. Smart Stock

7. AI Decisions

8. What-If Simulator

9. Settings

AUTHENTICATION:

- Add user registration, login and logout.

- Each user must have their own business/account data.

- Users must not be able to see another user's products, suppliers, transactions or financial information.

- Use Supabase Auth and Supabase database if available.

DATABASE:

Create proper persistent database tables and relationships for:

- users/auth profiles

- businesses

- products

- suppliers

- grocery lists/items

- inventory

- transactions

- business settings

INVENTORY:

Allow users to:

- Add products

- Edit products

- Delete products

- Search products

- Filter by category and stock status

- Track quantity

- Set minimum stock level

- Track cost price

- Track selling price

- Assign a supplier

- Show product availability

- Show low-stock, healthy-stock and overstock status

GROCERY LIST:

Create a dedicated grocery/product purchasing list.

Each item should support:

- Product name

- Quantity needed

- Current inventory quantity

- Availability

- Preferred seller/supplier

- Purchase price

- Estimated total purchase cost

- Notes

- Purchased/not purchased status

Users must be able to add, edit, delete and mark items as purchased.

When appropriate, connect purchased items to inventory so stock can be updated.

SELLERS / SUPPLIERS:

Allow users to manage suppliers:

- Supplier name

- Contact information

- Products supplied

- Purchase price

- Availability

- Notes

- Add/edit/delete suppliers

- Connect suppliers to inventory products and grocery items

CASH FLOW RADAR:

Show:

- Current cash balance

- Incoming money

- Outgoing money

- Revenue

- Expenses

- Estimated profit

- Upcoming expenses

- Cash-flow risk indicator

- Transaction history

Allow users to add income and expense transactions.

All dashboard financial numbers must be calculated from the user's actual stored data.

SMART STOCK:

Analyze inventory and identify:

- Low-stock products

- Overstocked products

- Products that may need reordering

- Products with weak stock levels

Give simple recommendations such as:

- Reorder

- Reduce purchasing

- Monitor

- Healthy stock

AI DECISIONS:

Create an AI-powered business insights section.

Analyze the user's actual inventory, sales, expenses and cash-flow data and explain recommendations in simple language.

Examples:

- Which products may need restocking

- Which products are overstocked

- Potential cash-flow concerns

- Inventory purchasing suggestions

- Simple explanations for why a recommendation was made

Do not pretend that AI has analyzed data when there is no data.

WHAT-IF SIMULATOR:

Allow the user to change hypothetical:

- Product quantity

- Selling price

- Purchase price

- Expected sales

- Expenses

Calculate projected:

- Revenue

- Costs

- Profit

- Cash impact

Show the difference between current and simulated results clearly.

CURRENCY SYSTEM:

This is VERY IMPORTANT.

Do NOT hardcode USD or INR.

Create a comprehensive currency selector containing world currencies with:

- Currency name

- ISO currency

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://profitpilot-business.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d5b154d3-7936-4f56-bb8d-128aaa7f565c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
