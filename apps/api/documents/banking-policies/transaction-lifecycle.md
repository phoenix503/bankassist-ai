# Banking Transaction Lifecycle

**Document ID:** BANK-TL-001  
**Category:** TRANSACTION_MANAGEMENT  
**Document Type:** Demo Banking Knowledge  
**Version:** 1.0  
**Status:** Active  
**Purpose:** Explain common banking transaction states and their interpretation.

## 1. Overview

A banking transaction passes through different processing stages. Its status indicates the current state recorded by the banking system.

A transaction status alone may not establish whether the beneficiary has received the funds.

## 2. Transaction Status Definitions

### SUCCESS

The transaction processing system has recorded the transaction as successfully processed.

Important considerations:

- Check the transaction reference.
- Verify the transaction amount and timestamp.
- For interbank transfers, distinguish successful processing from independently confirmed beneficiary credit.
- Do not assume that a successful debit record proves beneficiary settlement.

### PENDING

The transaction is still awaiting completion or confirmation.

Possible scenarios:

- Payment processing is in progress.
- External payment network confirmation is awaited.
- Final transaction status has not yet been received.

Recommended investigation:

- Check the latest transaction status.
- Verify whether a subsequent status update exists.
- Check whether a reversal or refund record is available.
- Avoid reporting the transaction as failed without supporting evidence.

### FAILED

The transaction has been marked as unsuccessful by the processing system.

Recommended investigation:

- Verify the transaction reference.
- Review the transaction timestamp.
- Check whether the debit was posted.
- Check whether a reversal or refund has been recorded.

## 3. Transaction Investigation Evidence

The following fields can support an investigation:

- Transaction reference
- Account reference
- Transaction amount
- Currency
- Transaction type
- Transaction status
- Transaction timestamp
- Merchant or beneficiary
- Payment channel
- Reversal reference, if available

## 4. Important Investigation Rules

1. Never infer beneficiary settlement solely from SUCCESS status.
2. Never classify a transaction as fraudulent solely because a customer does not recognize it.
3. A PENDING transaction must not automatically be classified as FAILED.
4. A reversal should be verified using an actual transaction record.
5. Investigation conclusions should reference available transaction evidence.

## 5. Example Scenarios

### Scenario A: Successful debit

Customer reports that money was debited.

The transaction is marked SUCCESS.

Investigation should verify the payment reference and, where applicable, beneficiary credit confirmation.

### Scenario B: Pending debit

Customer reports that the payment has not completed.

The transaction is marked PENDING.

The investigation should check for a subsequent status update before recommending a resolution.

### Scenario C: Failed debit

Customer reports that the payment failed.

The transaction is marked FAILED.

The investigation should check whether the amount was reversed or refunded.

## 6. Limitations

This document describes fictional demonstration banking concepts. It does not represent an actual bank's operating procedure, payment-network SLA, or regulatory requirement.
