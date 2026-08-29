// Synthetic Data Generator for AI Finance Controller
// Generates 105+ high-fidelity financial transactions across Bank, Gateway, and Ledger with 7 deliberate edge cases.

export function generateSyntheticData() {
  const merchants = [
    { name: "Amazon Marketplace India", bankAlias: "AMZN Mktp IN", pgAlias: "Amazon.in Marketplace", ledAlias: "Amazon Marketplace", category: "E-Commerce", baseAmount: 2450.00 },
    { name: "Swiggy Food Delivery", bankAlias: "SWIGGY BUNDL TECH", pgAlias: "Swiggy India Orders", ledAlias: "Swiggy Food Delivery", category: "Food & Beverage", baseAmount: 680.00 },
    { name: "Uber India Systems", bankAlias: "UBER INDIA TRVL", pgAlias: "Uber B.V. Payments", ledAlias: "Uber India Systems", category: "Travel & Commute", baseAmount: 420.00 },
    { name: "Microsoft Cloud Azure", bankAlias: "MSFT CLOUD AZURE", pgAlias: "Microsoft Corporation", ledAlias: "Microsoft Cloud Azure", category: "Software & SaaS", baseAmount: 18500.00 },
    { name: "Google Workspace Services", bankAlias: "GOOGLE CLOUD GSUITE", pgAlias: "Google Asia Pacific", ledAlias: "Google Workspace Services", category: "Software & SaaS", baseAmount: 4200.00 },
    { name: "Flipkart Internet Pvt Ltd", bankAlias: "FLIPKART INTERNET", pgAlias: "Flipkart Payments", ledAlias: "Flipkart Internet Pvt Ltd", category: "E-Commerce", baseAmount: 3199.00 },
    { name: "Zomato Online Ordering", bankAlias: "ZOMATO RESTAURANTS", pgAlias: "Zomato Limited", ledAlias: "Zomato Online Ordering", category: "Food & Beverage", baseAmount: 890.00 },
    { name: "Slack Technologies SaaS", bankAlias: "SLACK TECH INC", pgAlias: "Salesforce Slack HQ", ledAlias: "Slack Technologies SaaS", category: "Software & SaaS", baseAmount: 12500.00 },
    { name: "Airtel Telecommunications", bankAlias: "BHARTI AIRTEL CORP", pgAlias: "Airtel Direct Pay", ledAlias: "Airtel Telecommunications", category: "Utilities", baseAmount: 1499.00 },
    { name: "MakeMyTrip Travel Bookings", bankAlias: "MMT TRAVEL SERVICES", pgAlias: "MakeMyTrip India", ledAlias: "MakeMyTrip Travel Bookings", category: "Travel & Commute", baseAmount: 7850.00 },
    { name: "Atlassian Jira Confluence", bankAlias: "ATLASSIAN PTY LTD", pgAlias: "Atlassian Cloud", ledAlias: "Atlassian Jira Confluence", category: "Software & SaaS", baseAmount: 15400.00 },
    { name: "Reliance Jio Infocomm", bankAlias: "RELIANCE JIO CORP", pgAlias: "Jio Payment Services", ledAlias: "Reliance Jio Infocomm", category: "Utilities", baseAmount: 2199.00 },
    { name: "Tata Power Utilities", bankAlias: "TATA POWER CO LTD", pgAlias: "Tata Power Bills", ledAlias: "Tata Power Utilities", category: "Utilities", baseAmount: 6450.00 },
    { name: "Freshworks CRM Cloud", bankAlias: "FRESHWORKS INC", pgAlias: "Freshworks Cloud CRM", ledAlias: "Freshworks CRM Cloud", category: "Software & SaaS", baseAmount: 9200.00 },
    { name: "Apollo Pharmacy Medical", bankAlias: "APOLLO PHARM HEALTH", pgAlias: "Apollo Healthcare Ltd", ledAlias: "Apollo Pharmacy Medical", category: "Healthcare", baseAmount: 1850.00 },
  ];

  const bankRecords = [];
  const gatewayRecords = [];
  const ledgerRecords = [];

  let refCounter = 1001;

  // 1. Generate 70 Clean Exact Matches
  for (let i = 0; i < 70; i++) {
    const m = merchants[i % merchants.length];
    const ref = `REF-${refCounter++}`;
    const amount = Number((m.baseAmount + (i * 37.5) % 850).toFixed(2));
    const day = 10 + (i % 15);
    const date = `2026-08-${day < 10 ? '0' + day : day}`;

    bankRecords.push({
      transaction_id: `BANK-${100 + i}`,
      merchant: m.bankAlias,
      description: `${m.category} settlement - Bank Auto Debit`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    gatewayRecords.push({
      transaction_id: `PG-${200 + i}`,
      merchant: m.pgAlias,
      description: `${m.category} Gateway Payment Authorized`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    ledgerRecords.push({
      transaction_id: `LED-${300 + i}`,
      merchant: m.ledAlias,
      description: `${m.name} General Ledger expense entry`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });
  }

  // 2. Generate 10 Amount Mismatches (e.g. Gateway fee deduction, rounding, surcharge)
  const amountMismatchData = [
    { diff: 50.00, reason: "Gateway processing fee withholding ₹50" },
    { diff: 120.00, reason: "TDS deduction / surcharge discrepancy ₹120" },
    { diff: 45.50, reason: "Currency conversion fee difference ₹45.50" },
    { diff: 500.00, reason: "Partial refund not recorded in Bank statement" },
    { diff: 25.00, reason: "Convenience fee variance ₹25" },
    { diff: 1500.00, reason: "Quarterly maintenance deduction ₹1,500" },
    { diff: 80.00, reason: "Escrow settlement charge variance ₹80" },
    { diff: 350.00, reason: "Late payment penalty recorded only in Gateway" },
    { diff: 15.00, reason: "Fractional round-off difference ₹15" },
    { diff: 850.00, reason: "Pre-authorized security deposit difference ₹850" },
  ];

  for (let i = 0; i < 10; i++) {
    const m = merchants[(i + 3) % merchants.length];
    const ref = `REF-MM-${refCounter++}`;
    const baseAmt = 4500.00 + (i * 240);
    const mm = amountMismatchData[i];
    const date = `2026-08-${12 + (i % 10)}`;

    bankRecords.push({
      transaction_id: `BANK-MM-${100 + i}`,
      merchant: m.bankAlias,
      description: `${m.category} - Cleared through NEFT`,
      amount: baseAmt,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    gatewayRecords.push({
      transaction_id: `PG-MM-${200 + i}`,
      merchant: m.pgAlias,
      description: `${m.category} - Net of gateway fee`,
      amount: Number((baseAmt - mm.diff).toFixed(2)),
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    ledgerRecords.push({
      transaction_id: `LED-MM-${300 + i}`,
      merchant: m.ledAlias,
      description: `${m.name} - Full booked invoice value`,
      amount: baseAmt,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });
  }

  // 3. Generate 7 Missing Transactions (present in Bank/Ledger but missing in Gateway, or vice versa)
  for (let i = 0; i < 7; i++) {
    const m = merchants[(i + 7) % merchants.length];
    const ref = `REF-MISS-${refCounter++}`;
    const amount = 3200.00 + (i * 450);
    const date = `2026-08-${15 + (i % 8)}`;

    bankRecords.push({
      transaction_id: `BANK-MISS-${100 + i}`,
      merchant: m.bankAlias,
      description: `Direct wire transfer to ${m.name}`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    ledgerRecords.push({
      transaction_id: `LED-MISS-${300 + i}`,
      merchant: m.ledAlias,
      description: `Accrual for ${m.name}`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    // Notice: Missing in gatewayRecords!
    if (i === 6) {
      // 1 record present in Gateway & Ledger but missing in Bank (un-deposited settlement)
      gatewayRecords.push({
        transaction_id: `PG-MISS-UNSETTLED`,
        merchant: "Stripe Online Invoicing",
        description: "Customer card checkout waiting bank batch payout",
        amount: 8750.00,
        currency: "INR",
        transaction_date: "2026-08-27",
        reference_id: `REF-MISS-9999`
      });
      ledgerRecords.push({
        transaction_id: `LED-MISS-UNSETTLED`,
        merchant: "Stripe Online Invoicing",
        description: "Expected customer receipt booked",
        amount: 8750.00,
        currency: "INR",
        transaction_date: "2026-08-27",
        reference_id: `REF-MISS-9999`
      });
    }
  }

  // 4. Generate 5 Duplicate Transactions in Gateway (e.g. double webhook triggers)
  for (let i = 0; i < 5; i++) {
    const m = merchants[(i + 2) % merchants.length];
    const ref = `REF-DUP-${refCounter++}`;
    const amount = 1750.00 + (i * 300);
    const date = `2026-08-${18 + (i % 6)}`;

    bankRecords.push({
      transaction_id: `BANK-DUP-${100 + i}`,
      merchant: m.bankAlias,
      description: `${m.name} single debit clearance`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    // Primary Gateway transaction
    gatewayRecords.push({
      transaction_id: `PG-DUP-${200 + i}`,
      merchant: m.pgAlias,
      description: `${m.name} webhook primary capture`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    // Duplicate Gateway transaction (same ref or cloned charge)
    gatewayRecords.push({
      transaction_id: `PG-DUP-CLONE-${200 + i}`,
      merchant: m.pgAlias,
      description: `${m.name} duplicate retry webhook trigger`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });

    ledgerRecords.push({
      transaction_id: `LED-DUP-${300 + i}`,
      merchant: m.ledAlias,
      description: `${m.name} ledger expense journal`,
      amount: amount,
      currency: "INR",
      transaction_date: date,
      reference_id: ref
    });
  }

  // 5. Generate 5 Merchant Variations (Fuzzy Matching with missing reference_ids)
  const fuzzyCases = [
    { bank: "AMZN MKTP IN MUMBAI BR", pg: "Amazon Marketplace India Retail", led: "Amazon India Seller Services", amt: 5400.00, date: "2026-08-20" },
    { bank: "SWIGGY BUNDL TECH BANGALORE", pg: "Swiggy Food Ordering System", led: "Bundl Technologies Swiggy", amt: 1240.00, date: "2026-08-21" },
    { bank: "UBER BV AMSTERDAM INT", pg: "Uber Rides India Private Limited", led: "Uber Technology Mobility", amt: 690.00, date: "2026-08-22" },
    { bank: "MSFT REDMOND CLOUD SUBS", pg: "Microsoft Corporation India", led: "Microsoft Azure Cloud Services", amt: 24000.00, date: "2026-08-23" },
    { bank: "ZOMATO RESTRO GURGAON", pg: "Zomato Ltd Delivery Payments", led: "Zomato Online Food Order", amt: 1560.00, date: "2026-08-24" },
  ];

  for (let i = 0; i < fuzzyCases.length; i++) {
    const fc = fuzzyCases[i];
    bankRecords.push({
      transaction_id: `BANK-FUZZY-${100 + i}`,
      merchant: fc.bank,
      description: "POS Debit without standard external ref",
      amount: fc.amt,
      currency: "INR",
      transaction_date: fc.date,
      reference_id: "" // Empty reference id tests fuzzy matching strategy
    });

    gatewayRecords.push({
      transaction_id: `PG-FUZZY-${200 + i}`,
      merchant: fc.pg,
      description: "Merchant Aggregated Checkout",
      amount: fc.amt,
      currency: "INR",
      transaction_date: fc.date,
      reference_id: ""
    });

    ledgerRecords.push({
      transaction_id: `LED-FUZZY-${300 + i}`,
      merchant: fc.led,
      description: "Vendor booked without explicit gateway tracking tag",
      amount: fc.amt,
      currency: "INR",
      transaction_date: fc.date,
      reference_id: ""
    });
  }

  // 6. Generate 5 Date Mismatches (> 5 days settlement delay)
  for (let i = 0; i < 5; i++) {
    const m = merchants[(i + 4) % merchants.length];
    const ref = `REF-DATE-${refCounter++}`;
    const amount = 2900.00 + (i * 200);

    bankRecords.push({
      transaction_id: `BANK-DATE-${100 + i}`,
      merchant: m.bankAlias,
      description: `${m.name} delayed clearing debit`,
      amount: amount,
      currency: "INR",
      transaction_date: "2026-08-28", // Bank processed 8 days later
      reference_id: ref
    });

    gatewayRecords.push({
      transaction_id: `PG-DATE-${200 + i}`,
      merchant: m.pgAlias,
      description: `${m.name} immediate auth`,
      amount: amount,
      currency: "INR",
      transaction_date: "2026-08-20", // Authorized on 20th
      reference_id: ref
    });

    ledgerRecords.push({
      transaction_id: `LED-DATE-${300 + i}`,
      merchant: m.ledAlias,
      description: `${m.name} invoice booking`,
      amount: amount,
      currency: "INR",
      transaction_date: "2026-08-20",
      reference_id: ref
    });
  }

  // 7. Generate 3 Low Confidence / Ambiguous Transactions
  const ambiguousCases = [
    {
      bank: { id: "BANK-AMB-01", merchant: "Misc Vendor POS Terminal 49", amt: 1450.00, date: "2026-08-19", ref: "TXN-901" },
      pg: { id: "PG-AMB-01", merchant: "CloudFlare CDN Security Net", amt: 1450.00, date: "2026-08-24", ref: "TXN-901" },
      led: { id: "LED-AMB-01", merchant: "Office Supplies Petty Cash", amt: 1450.00, date: "2026-08-19", ref: "TXN-901" }
    },
    {
      bank: { id: "BANK-AMB-02", merchant: "Unknown Wire Transfer Inbound", amt: 50000.00, date: "2026-08-25", ref: "" },
      pg: { id: "PG-AMB-02", merchant: "Enterprise Software License Tier 3", amt: 48500.00, date: "2026-08-25", ref: "" },
      led: { id: "LED-AMB-02", merchant: "Capital Asset Procurement", amt: 50000.00, date: "2026-08-25", ref: "" }
    },
    {
      bank: { id: "BANK-AMB-03", merchant: "Paytm Payments Bank QR Scan", amt: 350.00, date: "2026-08-26", ref: "" },
      pg: { id: "PG-AMB-03", merchant: "PhonePe Merchant Services", amt: 320.00, date: "2026-08-27", ref: "" },
      led: { id: "LED-AMB-03", merchant: "Courier & Postage Charges", amt: 350.00, date: "2026-08-26", ref: "" }
    }
  ];

  for (const ac of ambiguousCases) {
    bankRecords.push({
      transaction_id: ac.bank.id,
      merchant: ac.bank.merchant,
      description: "Ambiguous transaction - low semantic alignment",
      amount: ac.bank.amt,
      currency: "INR",
      transaction_date: ac.bank.date,
      reference_id: ac.bank.ref
    });

    gatewayRecords.push({
      transaction_id: ac.pg.id,
      merchant: ac.pg.merchant,
      description: "Ambiguous transaction gateway source",
      amount: ac.pg.amt,
      currency: "INR",
      transaction_date: ac.pg.date,
      reference_id: ac.pg.ref
    });

    ledgerRecords.push({
      transaction_id: ac.led.id,
      merchant: ac.led.merchant,
      description: "Internal ledger journal entry under audit review",
      amount: ac.led.amt,
      currency: "INR",
      transaction_date: ac.led.date,
      reference_id: ac.led.ref
    });
  }

  return {
    bankRecords,
    gatewayRecords,
    ledgerRecords
  };
}

export function convertToCsv(records) {
  const headers = ["transaction_id", "merchant", "description", "amount", "currency", "transaction_date", "reference_id"];
  const rows = records.map(r => [
    `"${r.transaction_id}"`,
    `"${(r.merchant || '').replace(/"/g, '""')}"`,
    `"${(r.description || '').replace(/"/g, '""')}"`,
    r.amount.toFixed(2),
    `"${r.currency || 'INR'}"`,
    `"${r.transaction_date}"`,
    `"${(r.reference_id || '').replace(/"/g, '""')}"`
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}
