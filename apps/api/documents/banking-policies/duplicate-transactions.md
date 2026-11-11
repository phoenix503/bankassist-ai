# Duplicate Transaction Policy

**Policy ID:** BANK-DT-001  
**Version:** 2.0  
**Category:** TRANSACTION_INVESTIGATION  
**Jurisdiction:** India  
**Source Type:** NPCI Operational Guidance and Internal Investigation Controls  
**Last Reviewed:** November 8, 2026

## 1. Overview

This policy covers cases where a customer reports multiple debits for what appears to be the same payment.

Examples include:

- The customer is debited twice for one merchant purchase.
- The customer makes a payment using an alternative payment method after the first payment appears unsuccessful.
- Multiple transaction references exist for what the customer believes is one payment.
- The payment application shows pending or failed, but the customer subsequently makes another payment.

A duplicate transaction must be investigated using transaction and settlement evidence.

Two transactions with the same amount or merchant description are not automatically confirmed duplicates.

## 2. Regulatory and Operational References

### 2.1 NPCI UPI HELP Guidelines

NPCI's UPI HELP Guidelines, July 2023, include the following complaint reason:

**Reason Code U023:**
Paid by alternate means / Duplicate payment.

The guidelines include this reason under P2M successful or pending transaction complaint scenarios.

The guidelines also describe other relevant complaint reasons:

- U022: Account debited but transaction confirmation not received by merchant.
- U009: Customer account not credited back for failed merchant transaction.
- U005: Customer account not credited back for failed P2P transaction.

These reason codes are NPCI UPI HELP complaint classifications. They should not be interpreted as proof that a duplicate debit has occurred.

### 2.2 RBI Failed Transaction Framework

RBI Circular RBI/2019-20/67 establishes reversal timelines for specified failed payment scenarios.

Where a duplicate-payment complaint involves a failed original payment, the applicable failed-transaction scenario should also be investigated.

The system must distinguish:

- A confirmed duplicate payment.
- A failed original payment.
- A payment made through an alternate method.
- Two separate legitimate payments.

## 3. Investigation Requirements

### 3.1 Identify Potentially Matching Transactions

Retrieve the transaction records reported by the customer and identify potential matching transactions.

Compare:

- Transaction references.
- Account references.
- Transaction amount and currency.
- Transaction type.
- Merchant or beneficiary details.
- Transaction timestamps.
- Payment channel.
- Transaction status.
- Available settlement evidence.

### 3.2 Compare Transaction Amount and Account

Check whether the transactions:

- Belong to the same customer.
- Belong to the same account.
- Have the same amount and currency.
- Are debit transactions.

Matching amounts alone are insufficient to establish duplication.

### 3.3 Compare Merchant and Beneficiary Information

Review:

- Merchant identifier, where available.
- Merchant name.
- Beneficiary details.
- Payment reference.
- Order or invoice reference, where available.

A merchant description may differ between transactions even when they relate to the same merchant.

### 3.4 Compare Timestamps

Review the time difference between transactions.

A short interval can be an indicator of a potential duplicate, but does not independently establish duplication.

### 3.5 Verify Settlement and Merchant Evidence

Where available, review:

- Merchant confirmation.
- Acquirer or payment processor confirmation.
- Beneficiary credit confirmation.
- Settlement records.
- Refund or reversal records.
- Order or invoice details.

## 4. Duplicate Transaction Classification

The investigation system should distinguish the following states.

### POTENTIAL_DUPLICATE

Two or more transactions share matching characteristics.

Additional evidence is required before confirming duplication.

### CONFIRMED_DUPLICATE

Available payment and settlement evidence establishes that multiple debits relate to the same intended payment.

### NOT_A_DUPLICATE

Evidence indicates that the transactions represent separate legitimate payments.

### NEEDS_MORE_INFORMATION

Available records are insufficient to establish whether the transactions are duplicates.

## 5. Resolution Guidelines

- Do not classify transactions as confirmed duplicates based only on matching amounts.
- Do not classify transactions as confirmed duplicates based only on matching merchant descriptions.
- Verify settlement and merchant evidence where available.
- Check whether one transaction has already been reversed or refunded.
- Check whether the customer paid through an alternate payment method.
- Check whether multiple legitimate orders or purchases were made.
- Refer unresolved cases for support review.

If a failed transaction is involved, apply the appropriate RBI failed-transaction reversal framework.

A confirmed duplicate may proceed for applicable dispute or reversal review under the responsible bank or payment participant's process.

## 6. Customer Complaint Handling

For eligible UPI merchant transactions, NPCI UPI HELP provides complaint handling for duplicate or alternate-payment scenarios.

The relevant NPCI UPI HELP reason code is:

**U023 — Paid by alternate means / Duplicate payment.**

The application should retain:

- The original transaction reference.
- The additional transaction reference.
- The payment amount.
- The merchant details.
- The complaint reason.
- Supporting settlement evidence.

The customer should be informed whether the case is:

- Under investigation.
- A potential duplicate.
- Confirmed as a duplicate.
- Not a duplicate.
- Awaiting additional information.

## 7. BankAssist AI Investigation Rules

BankAssist AI must:

1. Retrieve all customer-authorized transaction references.
2. Verify that transactions belong to the customer's accounts.
3. Compare transaction attributes using deterministic backend logic.
4. Identify potential duplicate candidates.
5. Retrieve relevant payment and dispute guidance.
6. Present evidence to the customer and support team.
7. Require explicit customer confirmation before creating a mock dispute.
8. Preserve the distinction between a potential duplicate and a confirmed duplicate.

The AI must not independently declare a duplicate solely from an LLM-generated explanation.

## 8. Evidence Requirements

Retain the following where available:

- Original transaction reference.
- Additional transaction references.
- Transaction amounts.
- Transaction timestamps.
- Account references.
- Merchant or beneficiary details.
- Payment channel.
- Transaction statuses.
- Settlement confirmation.
- Refund or reversal records.
- Customer complaint confirmation.
- NPCI complaint reason code, where applicable.

## 9. Source References

1. NPCI UPI HELP Guidelines, July 2023:
   https://www.npci.org.in/uploads/UPI_Help_Brand_Guidelines_86c8c28922.pdf

2. RBI Circular RBI/2019-20/67:
   https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx?Id=11693

3. NPCI UPI Frequently Asked Questions:
   https://www.npci.org.in/what-we-do/upi/faqs

## 10. Scope and Limitations

This document combines NPCI UPI HELP operational guidance with internal demonstration investigation controls.

NPCI reason codes do not independently establish that a duplicate debit has occurred or that a refund is approved.

The responsible bank or payment participant must determine the final outcome using applicable transaction and settlement evidence.
