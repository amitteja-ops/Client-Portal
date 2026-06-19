# Client Portal Setup

## Step 1: Add column to Supabase

Run this SQL in Supabase → SQL Editor:

```sql
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS client_access_code text;
```

## Step 2: Set access code for each client

In the studio CRM, when editing a client, set their access code
in the "Client Access Code" field (e.g. HRI-1234).

Or set directly in Supabase Table Editor:
- Open customers table
- Find the client row
- Set client_access_code = e.g. "HRI-1234"

## Step 3: Send to client

WhatsApp/SMS template:
---
Hi [Name], your High Rise Interiors project portal is ready!

🔗 Portal: client-portal-nu-blush.vercel.app
📧 Email: [their email in CRM]  
🔑 Access Code: [their client_access_code]

You can view your project details and download your report anytime.
---

## How Login Works

NO email confirmation, NO redirects, NO OAuth.

Client enters:
1. Their email (same as in CRM)
2. Their access code (set by studio)

Portal checks the customers table directly.
Match found = instant access to their project.
