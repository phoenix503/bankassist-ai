# Failed Transaction Policy

**Policy ID:** BANK-FT-001  
**Version:** 2.0  
**Category:** TRANSACTION_MANAGEMENT  
**Jurisdiction:** India  
**Source Type:** RBI Regulatory Direction and NPCI Operational Guidance  
**Effective Reference:** RBI Circular dated September 20, 2019  
**Last Reviewed:** November 8, 2026

## 1. Overview

This policy covers failed digital payment transactions, including cases where:

- A customer's account is debited but the beneficiary does not receive the funds.
- A customer's account is debited but the merchant does not receive transaction confirmation.
- A transaction fails due to technical issues, communication failures or processing timeouts.
- A transaction remains pending and its final status has not been confirmed.

The investigation must distinguish between:

- SUCCESS: The available transaction system records the payment as successful.
- PENDING: The final transaction outcome has not yet been confirmed.
- FAILED: The transaction has been recorded as unsuccessful.

A transaction status must be interpreted alongside settlement, beneficiary credit and reversal evidence.

## 2. Regulatory References

### 2.1 RBI: Harmonisation of Turn Around Time (TAT)

**Circular:** RBI/2019-20/67  
**Reference:** DPSS.CO.PD No.629/02.01.014/2019-20  
**Date:** September 20, 2019  
**Subject:** Harmonisation of Turn Around Time (TAT) and customer compensation for failed transactions using authorised Payment Systems.

The circular establishes timelines for auto-reversal and compensation for specified failed domestic payment transactions.

The framework became effective on October 15, 2019.

### 2.2 NPCI: UPI FAQs

NPCI provides customer guidance for UPI failures and pending transactions.

The guidance explains that:

- Failed UPI payments should be refunded when the account has been debited.
- Customers should contact their bank if the refund has not arrived within the period described in NPCI's FAQ.
- Pending transactions may require further processing and status confirmation.

### 2.3 NPCI: UPI HELP Guidelines

NPCI's UPI HELP guidelines describe:

- Raising a complaint against an eligible transaction.
- Checking the current transaction status.
- Tracking complaint progress.
- Selecting an appropriate complaint reason.
- Obtaining the resolution reason after complaint closure.

## 3. RBI Reversal Timelines

The following table summarizes the applicable scenarios from the RBI September 20, 2019 circular.

| Payment System          | Incident                                               | Auto-reversal timeline | Compensation for delay    |
| ----------------------- | ------------------------------------------------------ | ---------------------- | ------------------------- |
| UPI - P2P fund transfer | Account debited but beneficiary account not credited   | T + 1 day              | ₹100 per day beyond T + 1 |
| UPI - Merchant payment  | Account debited but merchant confirmation not received | T + 5 days             | ₹100 per day beyond T + 5 |
| IMPS                    | Account debited but beneficiary account not credited   | T + 1 day              | ₹100 per day beyond T + 1 |
| Card-to-card transfer   | Originator debited but beneficiary card not credited   | T + 1 day              | ₹100 per day beyond T + 1 |
| Card PoS                | Account debited but merchant confirmation not received | T + 5 days             | ₹100 per day beyond T + 5 |
| ATM                     | Account debited but cash not dispensed                 | T + 5 days             | ₹100 per day beyond T + 5 |

### Important timeline definitions

- T means the calendar date of the transaction.
- T + 1 means the following calendar day.
- T + 5 means the fifth calendar day after the transaction date.
- The RBI circular defines R as the date on which reversal is concluded and funds are received by the issuer/originator.
- The framework covers domestic transactions where both originator and beneficiary are within India.

The prescribed TAT is an outer limit. Banks and payment system participants should endeavour to resolve failures earlier.

**Important:** Do not apply one payment method's reversal timeline to another payment method.

## 4. Compensation Rules

Under the RBI framework:

- Applicable compensation is ₹100 per day for delays beyond the prescribed timeline in the listed scenarios.
- Compensation is to be credited automatically to the customer's account.
- The customer should not have to submit a separate claim to receive applicable compensation.
- Compensation must be assessed against the applicable transaction scenario and responsible payment participant.

The application must not calculate compensation as payable solely from a transaction status or elapsed time.

It must first establish:

1. The applicable payment system.
2. The failure scenario.
3. The relevant transaction date.
4. The applicable reversal deadline.
5. Whether the reversal was completed.
6. Whether the compensation conditions are satisfied.

## 5. Investigation Requirements

The investigation system must collect or verify:

- Transaction reference.
- Transaction amount and currency.
- Transaction date and timestamp.
- Payment method or payment network.
- Debit account reference.
- Beneficiary or merchant details.
- Transaction status.
- Beneficiary credit confirmation, where available.
- Merchant confirmation, where applicable.
- Reversal or refund reference, where available.
- Latest status update.
- Customer complaint reference.

### 5.1 Pending Transactions

For pending transactions:

- Check the latest available transaction status.
- Check whether beneficiary confirmation is awaited.
- Check whether a reversal has been initiated.
- Review subsequent transaction updates.
- Do not classify a pending transaction as failed without supporting evidence.

NPCI UPI HELP guidance describes a refresh/status-check facility for obtaining the current transaction status.

### 5.2 Failed Transactions

For failed transactions:

- Verify the debit entry.
- Identify the payment method.
- Determine the applicable RBI TAT scenario.
- Check whether the reversal has been initiated.
- Verify whether the funds have been credited back.
- Record the reversal reference and date when available.

### 5.3 Successful Transactions with Beneficiary Disputes

For transactions marked successful:

- Verify the transaction reference.
- Check beneficiary credit evidence.
- Check settlement confirmation where available.
- Do not conclude that the beneficiary received the funds solely because the originating account has a successful debit entry.

## 6. Customer Complaint Handling

For UPI transactions, NPCI UPI HELP provides a complaint journey through the payment application.

The customer can:

1. Open transaction history.
2. Select the relevant transaction.
3. Select UPI HELP.
4. Choose an applicable complaint reason.
5. Submit the complaint.
6. Check the complaint status.
7. Review the resolution reason after closure.

NPCI's published UPI HELP guidelines also describe complaint reasons for pending and failed transactions.

For other payment methods, the customer should use the applicable bank or payment service provider's official complaint channel.

## 7. AI Investigation and Resolution Guidelines

BankAssist AI must:

- Identify the payment method before applying a reversal timeline.
- Distinguish pending, failed and successful transactions.
- Retrieve the relevant RBI rule and supporting NPCI guidance.
- Compare the applicable deadline with the transaction date.
- Check actual reversal evidence before declaring a refund complete.
- Explain applicable compensation rules without guaranteeing payment.
- Provide source references with investigation findings.
- Escalate cases where the required evidence is unavailable.

The AI must not:

- Treat all pending transactions as failed.
- Apply UPI timelines to unrelated payment methods.
- Declare a refund completed without reversal evidence.
- Declare compensation payable without validating applicability.
- Invent beneficiary settlement confirmation.
- Treat an elapsed deadline as proof of a completed reversal.

## 8. Evidence Requirements

The following evidence should be retained where available:

- Transaction reference.
- Payment method.
- Transaction amount.
- Transaction date.
- Debit confirmation.
- Beneficiary or merchant confirmation.
- Transaction status history.
- Reversal reference.
- Reversal completion date.
- Complaint reference.
- Applicable RBI policy reference.
- Relevant NPCI guidance reference.

## 9. Source References

1. RBI Circular RBI/2019-20/67, dated September 20, 2019:
   https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx?Id=11693

2. NPCI UPI Frequently Asked Questions:
   https://www.npci.org.in/what-we-do/upi/faqs

3. NPCI UPI HELP Guidelines, July 2023:
   https://www.npci.org.in/uploads/UPI_Help_Brand_Guidelines_86c8c28922.pdf

## 10. Scope and Limitations

This document summarizes the referenced RBI regulatory framework and NPCI operational guidance for a demonstration banking application.

It is not a substitute for the latest applicable RBI directions, amendments, bank-specific procedures or payment network technical specifications.

Before production use, the applicable rules and amendments must be verified against official publications.
